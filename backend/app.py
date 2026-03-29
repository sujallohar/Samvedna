"""
app.py — AutiSense Flask Backend (FIXED VERSION)

BUGS FIXED:
  1. CORS too restrictive — only allowed localhost:5173 exactly.
     FIX: Use CORS(app) to allow ALL origins during local dev.

  2. Chat crashed when API key was missing/empty.
     FIX: Check key before calling API, fall back to rule-based chat gracefully.

  3. Firebase init could crash the whole server on startup if credentials wrong.
     FIX: Wrapped in try/except, server always starts, runs in mock mode if needed.

  4. Port 5000 conflict on Mac (AirPlay uses 5000).
     FIX: Default changed to 5001.

  5. Gemini import handled gracefully with fallback.
"""

import os
import json
import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load .env FIRST so all env vars are available
load_dotenv()

import firebase_admin
from firebase_admin import credentials, firestore

# ── App setup ─────────────────────────────────────────────────────────────────
app = Flask(__name__)

# Allow ALL origins during development

CORS(
    app,
    supports_credentials=True,
    resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173",
                "https://samvedna-beta.vercel.app"
            ]
        }
    }
)
# ── Firebase init ─────────────────────────────────────────────────────────────
db = None

def init_firebase():
    global db
    try:
        if firebase_admin._apps:
            db = firestore.client()
            return

        creds_json = os.getenv("FIREBASE_CREDENTIALS")
        if creds_json:
            cred = credentials.Certificate(json.loads(creds_json))
        else:
            key_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")
            if os.path.exists(key_path):
                cred = credentials.Certificate(key_path)
            else:
                print("⚠️  No Firebase credentials — running in MOCK mode")
                return

        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("✅ Firebase connected")

    except Exception as e:
        print(f"⚠️  Firebase error: {e} — running in MOCK mode")
        db = None

init_firebase()

# ── Mock storage (used when Firebase not configured) ──────────────────────────
_mock_scores   = {}
_mock_sessions = {}

def save_db(collection, doc_id, data):
    if db:
        db.collection(collection).document(doc_id).set(data, merge=True)
    else:
        if collection == "scores":
            sid = data.get("sessionId", "x")
            _mock_scores.setdefault(sid, []).append(data)
        elif collection == "sessions":
            _mock_sessions[doc_id] = data

def get_db(collection, doc_id=None, session_filter=None):
    if db:
        if doc_id:
            d = db.collection(collection).document(doc_id).get()
            return d.to_dict() if d.exists else None
        q = db.collection(collection)
        if session_filter:
            q = q.where("sessionId", "==", session_filter)
        return [d.to_dict() for d in q.stream()]
    else:
        if collection == "sessions":
            return _mock_sessions.get(doc_id) if doc_id else list(_mock_sessions.values())
        if collection == "scores" and session_filter:
            return _mock_scores.get(session_filter, [])
        return []

# ── Helpers ───────────────────────────────────────────────────────────────────
def score_to_level(score):
    if score < 25: return {"level": "Level 0", "label": "Neurotypical indicators",   "color": "green"}
    if score < 50: return {"level": "Level 1", "label": "Mild ASD indicators",       "color": "amber"}
    if score < 75: return {"level": "Level 2", "label": "Moderate ASD indicators",   "color": "orange"}
    return              {"level": "Level 3", "label": "Significant ASD indicators", "color": "red"}

# ── ENDPOINT: Health check ────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status":   "ok",
        "service":  "AutiSense Backend",
        "firebase": "connected" if db else "mock mode",
        "version":  "1.1.0",
    }), 200

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "message": "AutiSense API running",
        "endpoints": ["POST /api/log-score", "GET /api/sessions",
                      "GET /api/session/<id>", "POST /api/chat", "GET /health"]
    }), 200

# ── ENDPOINT: Log score ───────────────────────────────────────────────────────
@app.route("/api/log-score", methods=["POST"])
def log_score():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON body"}), 400
        for f in ["sessionId", "asdScore", "rawScores"]:
            if f not in data:
                return jsonify({"error": f"Missing: {f}"}), 400

        sid       = data["sessionId"]
        score     = float(data["asdScore"])
        timestamp = data.get("timestamp", datetime.datetime.utcnow().isoformat())

        # Save score record
        score_id = f"{sid}_{int(datetime.datetime.utcnow().timestamp()*1000)}"
        save_db("scores", score_id, {
            "sessionId": sid, "asdScore": score,
            "rawScores": data["rawScores"],
            "level": score_to_level(score),
            "timestamp": timestamp,
        })

        # Upsert session summary
        existing = get_db("sessions", sid)
        if existing:
            count  = existing.get("scoreCount", 0) + 1
            avg    = (existing.get("avgScore", score) * (count-1) + score) / count
            hi     = max(existing.get("maxScore", 0), score)
            lo     = min(existing.get("minScore", 100), score)
            hist   = existing.get("scoreHistory", [])[-99:] + [round(score, 1)]
            started = existing.get("startedAt", timestamp)
        else:
            count, avg, hi, lo, hist, started = 1, score, score, score, [round(score,1)], timestamp

        save_db("sessions", sid, {
            "sessionId": sid, "scoreCount": count,
            "avgScore": round(avg,1), "maxScore": round(hi,1),
            "minScore": round(lo,1),  "lastScore": round(score,1),
            "scoreHistory": hist, "lastLevel": score_to_level(score),
            "lastUpdated": datetime.datetime.utcnow().isoformat(),
            "startedAt": started,
        })

        return jsonify({"success": True, "sessionAvg": round(avg,1)}), 200

    except Exception as e:
        print(f"log_score error: {e}")
        return jsonify({"error": str(e)}), 500

# ── ENDPOINT: List sessions ───────────────────────────────────────────────────
@app.route("/api/sessions", methods=["GET"])
def get_sessions():
    try:
        sessions = get_db("sessions") or []
        sessions.sort(key=lambda s: s.get("lastUpdated", ""), reverse=True)
        return jsonify({"success": True, "count": len(sessions), "sessions": sessions}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── ENDPOINT: Single session detail ──────────────────────────────────────────
@app.route("/api/session/<session_id>", methods=["GET"])
def get_session(session_id):
    try:
        session = get_db("sessions", session_id)
        if not session:
            return jsonify({"error": "Session not found"}), 404

        scores = get_db("scores", session_filter=session_id) or []
        scores.sort(key=lambda s: s.get("timestamp", ""))

        avg = session.get("avgScore", 0)
        return jsonify({"success": True, "report": {
            "sessionId": session_id,
            "summary":   session,
            "scores":    scores,
            "reportText": (
                f"Session: {session_id}\n"
                f"Avg score: {avg}/100\n"
                f"Level: {score_to_level(avg)['level']}"
            ),
            "recommendation": get_recommendation(avg),
        }}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def get_recommendation(avg):
    if avg < 25:
        return {"title": "No significant ASD indicators", "urgency": "routine",
                "text": "Patterns appear consistent with neurotypical development."}
    if avg < 50:
        return {"title": "Mild ASD indicators observed", "urgency": "moderate",
                "text": "Some patterns warrant attention. Consider a developmental assessment."}
    if avg < 75:
        return {"title": "Moderate ASD indicators observed", "urgency": "high",
                "text": "Multiple ASD-associated patterns detected. Recommend evaluation by a specialist."}
    return     {"title": "Significant ASD indicators observed", "urgency": "urgent",
                "text": "Strong patterns detected. Please consult a specialist promptly."}

# ── ENDPOINT: Chat ────────────────────────────────────────────────────────────
@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        if not data or "message" not in data:
            return jsonify({"error": "Missing message"}), 400

        message   = data["message"]
        asd_score = float(data.get("asdScore", 0))

        # 🔥 GEMINI API (FREE)
        
        groq_key = os.getenv("GROQ_API_KEY", "")

        if os.getenv("GROQ_API_KEY"):
            try:
                from groq import Groq

               
                client = Groq(api_key=groq_key)
                response = client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[
                        {
                            "role": "system",
                            "content": f"You are a supportive autism-friendly assistant. ASD Score: {asd_score}"
                        },
                        {
                            "role": "user",
                            "content": message
                        }
                    ],
                    temperature=0.7,
                )

                reply = response.choices[0].message.content

                return jsonify({
                    "success": True,
                    "reply": reply,
                    "model": "groq"
                }), 200

            except Exception as e:
                print(f"Groq failed: {e}")

        # 🧠 FALLBACK (rule-based logic)
        reply = rule_based_reply(message.lower(), asd_score)

        return jsonify({
            "success": True,
            "reply": reply,
            "model": "rule-based"
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


def build_system_prompt(score):
    base = ("You are a friendly, supportive companion for autism behavioural support. "
            "Be patient, kind, and never judgmental.\n\n")
    if score < 25:
        return base + "Communicate naturally and conversationally."
    if score < 50:
        return base + "Use clear, direct language. Avoid idioms. Keep sentences moderately short."
    if score < 75:
        return base + ("Use short simple sentences. One idea per sentence. Be very literal. "
                       "Keep reply under 3 sentences.")
    return base + ("Use very short sentences. Max 5 words each. Simple common words only. "
                   "Keep reply to 2 sentences.")


def rule_based_reply(msg, score):
    """Zero-cost adaptive chat — works without any API key."""
    greet = any(w in msg for w in ["hello","hi","hey","namaste"])
    happy = any(w in msg for w in ["happy","good","great","fine","excited"])
    sad   = any(w in msg for w in ["sad","bad","upset","tired","cry","bored"])
    play  = any(w in msg for w in ["play","game","activity","fun","bored"])
    thanks= any(w in msg for w in ["thanks","thank","good job","nice","wow"])

    if score < 50:
        if greet:  return "Hello! Great to see you. How are you feeling today?"
        if happy:  return "That's wonderful! Tell me more about what's making you happy."
        if sad:    return "I'm sorry you're feeling that way. I'm here for you. Would you like to talk?"
        if play:   return "That sounds fun! What kind of activities do you enjoy most?"
        if thanks: return "You're very welcome! Is there anything else I can help with?"
        return "That's interesting! Tell me more — I'm listening."
    elif score < 75:
        if greet:  return "Hello! I am happy to see you. How do you feel?"
        if happy:  return "That is great! I am glad you feel happy."
        if sad:    return "I am sorry. I am here with you. Do you want to talk?"
        if play:   return "Yes! Let us do something fun together."
        if thanks: return "Thank you! I am happy to help you."
        return "I hear you. Thank you for sharing with me."
    else:
        if greet:  return "Hello! I am here!"
        if happy:  return "Happy! Me too!"
        if sad:    return "I am sorry. You are safe."
        if play:   return "Yes! Fun time!"
        if thanks: return "Thank you! Good job!"
        return "I hear you. Good job!"


# ── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port  = int(os.getenv("PORT", 5001))
    debug = os.getenv("FLASK_ENV", "development") == "development"
    print(f"\n🚀 AutiSense backend → http://localhost:{port}")
    print(f"   Firebase: {'connected' if db else 'MOCK MODE'}")
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    print(f"   Gemini:   {'configured ✅' if gemini_key else 'not set — rule-based chat active'}")
    print(f"   Debug:    {debug}\n")
    app.run(host="0.0.0.0", port=port, debug=True, use_reloader=False)