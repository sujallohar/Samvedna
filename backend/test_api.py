"""
test_api.py
───────────
Test all Flask API endpoints without needing the React frontend.
Run this while Flask is running in another terminal.

Usage:
  Terminal 1:  python app.py
  Terminal 2:  python test_api.py

Prints PASS / FAIL for each endpoint.
"""

import requests
import json
import time

BASE = "http://localhost:5001"
SESSION_ID = f"test_session_{int(time.time())}"


def test(name, method, path, body=None, expected_status=200):
    url = f"{BASE}{path}"
    try:
        if method == "GET":
            r = requests.get(url, timeout=10)
        else:
            r = requests.post(url, json=body, timeout=10)

        ok = r.status_code == expected_status
        data = r.json()
        status = "✅ PASS" if ok else "❌ FAIL"
        print(f"{status}  {method} {path}  (HTTP {r.status_code})")
        if not ok:
            print(f"       Expected {expected_status}, got {r.status_code}")
            print(f"       Response: {json.dumps(data, indent=2)[:200]}")
        return data if ok else None
    except Exception as e:
        print(f"❌ FAIL  {method} {path}  ERROR: {e}")
        return None


print("\n" + "=" * 55)
print("AutiSense API Tests")
print("=" * 55 + "\n")

# 1. Health check
print("[ Health ]")
test("Health check", "GET", "/health")
test("Root", "GET", "/")
print()

# 2. Log some scores
print("[ Log Scores ]")
for i in range(3):
    score = 20 + i * 15  # 20, 35, 50
    test(f"Log score {score}", "POST", "/api/log-score", {
        "sessionId":  SESSION_ID,
        "asdScore":   score,
        "rawScores": {
            "eyeContact":   80 - i * 10,
            "blinkRate":    75,
            "microExpr":    60,
            "handMovement": 70,
            "headMovement": 85,
        },
        "level":     f"Level {i}",
        "timestamp": "2024-01-15T10:00:00.000Z",
    })
    time.sleep(0.1)
print()

# 3. List sessions
print("[ Sessions ]")
result = test("List sessions", "GET", "/api/sessions")
if result:
    print(f"       Found {result.get('count', 0)} session(s)")
print()

# 4. Get single session
print("[ Session Detail ]")
result = test("Get session detail", "GET", f"/api/session/{SESSION_ID}")
if result and result.get("report"):
    r = result["report"]
    print(f"       avgScore: {r['summary'].get('avgScore')}")
    print(f"       scores recorded: {len(r.get('scores', []))}")
print()

# 5. Chat endpoint
print("[ Chat ]")
result = test("Chat (low ASD)", "POST", "/api/chat", {
    "message":  "Hello! Can you tell me about today?",
    "asdScore": 15,
    "history":  [],
})
if result:
    print(f"       Reply: {result.get('reply', '')[:80]}...")

result = test("Chat (high ASD)", "POST", "/api/chat", {
    "message":  "Hello",
    "asdScore": 80,
    "history":  [],
})
if result:
    print(f"       Reply: {result.get('reply', '')[:80]}...")
print()

# 6. Error handling
print("[ Error Handling ]")
test("Missing fields", "POST", "/api/log-score", {"sessionId": "x"}, expected_status=400)
test("Missing message", "POST", "/api/chat", {"asdScore": 50}, expected_status=400)
test("Not found", "GET", "/api/session/DOES_NOT_EXIST", expected_status=404)
print()

print("=" * 55)
print("Tests complete!")
print(f"Session used: {SESSION_ID}")
print("=" * 55 + "\n")