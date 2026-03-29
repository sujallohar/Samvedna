"""
smoke_test.py — Post-Deploy Verification
==========================================
Run this AFTER deployment to verify your live backend is working.

Usage:
    python deploy/smoke_test.py https://autisense-backend.onrender.com

Tests every endpoint on the live server and prints PASS/FAIL.
"""

import sys
import json
import time
import urllib.request
import urllib.error
import ssl
import certifi

ssl_context = ssl.create_default_context(cafile=certifi.where())

def req(method, url, body=None, expected=200):
    """Make an HTTP request and return (ok, status_code, data)."""
    try:
        data = json.dumps(body).encode() if body else None
        headers = {"Content-Type": "application/json"} if body else {}
        r = urllib.request.Request(url, data=data, headers=headers, method=method)
        with urllib.request.urlopen(r, timeout=30, context=ssl_context) as resp:
            content = json.loads(resp.read())
            ok = resp.status == expected
            return ok, resp.status, content
    except urllib.error.HTTPError as e:
        content = {}
        try: content = json.loads(e.read())
        except: pass
        return (e.code == expected), e.code, content
    except Exception as ex:
        return False, 0, {"error": str(ex)}


def run(base_url):
    base = base_url.rstrip("/")
    session = f"smoke_test_{int(time.time())}"
    passed = 0
    failed = 0

    def check(name, ok, status, data, note=""):
        nonlocal passed, failed
        if ok:
            passed += 1
            print(f"  ✅  {name}")
            if note: print(f"       {note}")
        else:
            failed += 1
            print(f"  ❌  {name}  (HTTP {status})")
            if "error" in data: print(f"       Error: {data['error']}")
            if note: print(f"       {note}")

    print(f"\n{'━'*52}")
    print(f"  AutiSense Live Smoke Test")
    print(f"  Target: {base}")
    print(f"{'━'*52}\n")

    # 1 — Root
    print("[ Basic Connectivity ]")
    ok, s, d = req("GET", f"{base}/")
    check("Root endpoint", ok, s, d, d.get("message",""))

    ok, s, d = req("GET", f"{base}/health")
    check("Health check", ok, s, d,
          f"Firebase: {d.get('firebase','?')}")
    print()

    # 2 — Log scores
    print("[ Score Logging ]")
    for i, score in enumerate([20, 45, 68]):
        ok, s, d = req("POST", f"{base}/api/log-score", {
            "sessionId":  session,
            "asdScore":   score,
            "rawScores":  {"eyeContact":70,"blinkRate":80,"microExpr":60,"handMovement":75,"headMovement":85},
            "level":      f"Level {i}",
            "timestamp":  "2024-01-15T10:00:00.000Z",
        })
        check(f"Log score {score}", ok, s, d,
              f"sessionAvg: {d.get('sessionAvg','?')}")
        time.sleep(0.3)
    print()

    # 3 — Sessions list
    print("[ Session Queries ]")
    ok, s, d = req("GET", f"{base}/api/sessions")
    check("List sessions", ok, s, d,
          f"Found {d.get('count',0)} session(s)")

    ok, s, d = req("GET", f"{base}/api/session/{session}")
    check("Session detail", ok, s, d,
          f"Scores: {len(d.get('report',{}).get('scores',[]))} · "
          f"Avg: {d.get('report',{}).get('summary',{}).get('avgScore','?')}")

    ok, s, d = req("GET", f"{base}/api/session/DOES_NOT_EXIST", expected=404)
    check("404 for unknown session", ok, s, d)
    print()

    # 4 — Chat
    print("[ Claude AI Chat ]")
    ok, s, d = req("POST", f"{base}/api/chat", {
        "message": "Hello, how are you?",
        "asdScore": 20,
        "history": [],
    })
    reply = d.get("reply","")[:60] if ok else ""
    check("Chat (low ASD score)", ok, s, d,
          f"Reply: {reply}..." if reply else "")

    ok, s, d = req("POST", f"{base}/api/chat", {
        "message": "Hi",
        "asdScore": 80,
        "history": [],
    })
    reply = d.get("reply","")[:60] if ok else ""
    check("Chat (high ASD score)", ok, s, d,
          f"Reply: {reply}..." if reply else "")

    ok, s, d = req("POST", f"{base}/api/chat", {"asdScore": 50}, expected=400)
    check("Chat rejects missing message", ok, s, d)
    print()

    # 5 — CORS header check
    print("[ CORS Headers ]")
    try:
        import urllib.request as ur
        r = ur.Request(f"{base}/health")
        r.add_header("Origin", "https://autisense.vercel.app")
        with ur.urlopen(r, timeout=10) as resp:
            cors = resp.headers.get("Access-Control-Allow-Origin","not set")
            ok = cors != "not set"
            check("CORS header present", ok, resp.status, {}, f"Value: {cors}")
    except Exception as e:
        check("CORS header present", False, 0, {"error": str(e)})
    print()

    # ── Summary ────────────────────────────────────────────────
    total = passed + failed
    print(f"{'━'*52}")
    print(f"  Results: {passed}/{total} passed", end="")
    if failed == 0:
        print(f"  🎉 All tests passed!")
    else:
        print(f"  ⚠️  {failed} test(s) failed")
    print(f"{'━'*52}\n")

    if failed > 0:
        print("Common fixes:")
        print("  Chat fails  → Check ANTHROPIC_API_KEY in Render env vars")
        print("  Score fails → Check FIREBASE_CREDENTIALS in Render env vars")
        print("  CORS fails  → Check FRONTEND_URL in Render env vars")
        print("  All fail    → Server may be sleeping, try again in 60s\n")

    return failed == 0


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python deploy/smoke_test.py <backend_url>")
        print("Example: python deploy/smoke_test.py https://autisense-backend.onrender.com")
        sys.exit(1)

    success = run(sys.argv[1])
    sys.exit(0 if success else 1)