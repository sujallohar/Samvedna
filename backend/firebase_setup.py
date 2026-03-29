"""
firebase_setup.py
─────────────────
Run this ONCE after setting up Firebase to create the Firestore collections
and verify your connection works.

Usage:
  python firebase_setup.py

What it does:
  1. Tests Firebase connection
  2. Creates a test document in 'sessions' collection
  3. Creates a test document in 'scores' collection
  4. Reads them back to confirm everything works
  5. Deletes the test documents

FIRESTORE STRUCTURE (explain to faculty):
  Firebase Firestore is a NoSQL document database.
  Unlike SQL, there are no tables — only collections of JSON documents.

  Collection: sessions/
    Document: session_1234_abc
      {
        sessionId:    "session_1234_abc",
        avgScore:     42.5,
        scoreCount:   18,
        scoreHistory: [38, 41, 45, 43, ...],
        lastLevel:    { level: "Level 1", label: "Mild ASD indicators" },
        startedAt:    "2024-01-15T10:00:00Z",
        lastUpdated:  "2024-01-15T10:05:00Z"
      }

  Collection: scores/
    Document: session_1234_abc_1705312800000
      {
        sessionId:  "session_1234_abc",
        asdScore:   42,
        rawScores:  { eyeContact: 60, blinkRate: 80, ... },
        level:      { level: "Level 1", ... },
        timestamp:  "2024-01-15T10:01:00Z"
      }
"""

import os
import json
import datetime
from dotenv import load_dotenv

load_dotenv()


def test_firebase_connection():
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore

        print("✅ firebase-admin package installed")

        # Load credentials
        creds_json = os.getenv("FIREBASE_CREDENTIALS")
        if creds_json:
            cred = credentials.Certificate(json.loads(creds_json))
            print("✅ Credentials loaded from FIREBASE_CREDENTIALS env var")
        elif os.path.exists("serviceAccountKey.json"):
            cred = credentials.Certificate("serviceAccountKey.json")
            print("✅ Credentials loaded from serviceAccountKey.json")
        else:
            print("❌ No Firebase credentials found!")
            print("\nTo fix this:")
            print("  1. Go to Firebase Console (console.firebase.google.com)")
            print("  2. Project Settings → Service Accounts")
            print("  3. Click 'Generate new private key'")
            print("  4. Save file as: backend/serviceAccountKey.json")
            return False

        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)

        db = firestore.client()
        print("✅ Firestore client initialized")

        # ── Write test session ──────────────────────────────────────────
        test_session_id = "TEST_SESSION_DELETE_ME"
        test_data = {
            "sessionId":    test_session_id,
            "avgScore":     35.0,
            "scoreCount":   5,
            "scoreHistory": [30, 33, 35, 37, 40],
            "lastLevel":    {"level": "Level 1", "label": "Mild ASD indicators"},
            "startedAt":    datetime.datetime.utcnow().isoformat(),
            "lastUpdated":  datetime.datetime.utcnow().isoformat(),
            "isTestDoc":    True,
        }

        db.collection("sessions").document(test_session_id).set(test_data)
        print("✅ Test session written to Firestore")

        # ── Write test score ────────────────────────────────────────────
        test_score_id = f"{test_session_id}_score1"
        score_data = {
            "sessionId":  test_session_id,
            "asdScore":   35,
            "rawScores":  {
                "eyeContact":   65,
                "blinkRate":    80,
                "microExpr":    55,
                "handMovement": 70,
                "headMovement": 75,
            },
            "level":      {"level": "Level 1", "label": "Mild ASD indicators"},
            "timestamp":  datetime.datetime.utcnow().isoformat(),
            "isTestDoc":  True,
        }
        db.collection("scores").document(test_score_id).set(score_data)
        print("✅ Test score written to Firestore")

        # ── Read back ───────────────────────────────────────────────────
        session_doc = db.collection("sessions").document(test_session_id).get()
        assert session_doc.exists, "Session document not found!"
        print("✅ Session read back successfully")
        print(f"   avgScore: {session_doc.to_dict()['avgScore']}")

        # ── Clean up ────────────────────────────────────────────────────
        db.collection("sessions").document(test_session_id).delete()
        db.collection("scores").document(test_score_id).delete()
        print("✅ Test documents cleaned up")

        print("\n🎉 Firebase is fully set up and working!")
        print("   Your Firestore collections are ready:")
        print("   • sessions/  — stores session summaries")
        print("   • scores/    — stores individual score records")
        return True

    except ImportError:
        print("❌ firebase-admin not installed. Run: pip install -r requirements.txt")
        return False
    except Exception as e:
        print(f"❌ Firebase error: {e}")
        return False


def test_anthropic_connection():
    try:
        import anthropic
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key or api_key == "sk-ant-your-key-here":
            print("⚠️  ANTHROPIC_API_KEY not set. Chat endpoint will not work.")
            print("   Get your key from: https://console.anthropic.com")
            return False

        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=30,
            messages=[{"role": "user", "content": "Say 'API works' only."}],
        )
        print(f"✅ Anthropic API working: {response.content[0].text.strip()}")
        return True
    except Exception as e:
        print(f"❌ Anthropic error: {e}")
        return False


if __name__ == "__main__":
    print("=" * 50)
    print("AutiSense — Firebase & API Connection Test")
    print("=" * 50)
    print()

    print("[ Firebase ]")
    firebase_ok = test_firebase_connection()
    print()

    print("[ Anthropic Claude API ]")
    claude_ok = test_anthropic_connection()
    print()

    print("=" * 50)
    if firebase_ok and claude_ok:
        print("✅ All systems ready! Run: python app.py")
    elif firebase_ok:
        print("⚠️  Firebase OK, but set ANTHROPIC_API_KEY for chat feature")
        print("   Run: python app.py  (chat will be disabled)")
    else:
        print("⚠️  Running in MOCK mode — no Firebase")
        print("   Run: python app.py  (data stored in memory only)")
    print("=" * 50)