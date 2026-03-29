"""
wake_backend.py — Pre-Demo Backend Warmer
==========================================
Render.com free tier sleeps after 15 minutes of inactivity.
Cold start takes 30-60 seconds — very embarrassing during a faculty demo!

Run this script 2 MINUTES BEFORE your demo to wake the backend up.

Usage:
    python deploy/wake_backend.py https://autisense-backend.onrender.com

What it does:
    - Pings /health every 10 seconds until the server responds
    - Times how long the cold start took
    - Confirms Firebase and Claude API are ready
    - Tells you when it's safe to start the demo
"""

import sys
import time
import json
import urllib.request
import urllib.error
from datetime import datetime

def ping(url):
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            return True, json.loads(r.read())
    except urllib.error.URLError:
        return False, {}
    except Exception:
        return False, {}


def wake(backend_url):
    base    = backend_url.rstrip("/")
    health  = f"{base}/health"
    start   = time.time()
    attempt = 0

    print(f"\n{'━'*50}")
    print(f"  AutiSense — Backend Warmer")
    print(f"{'━'*50}")
    print(f"  Target: {base}")
    print(f"  Time:   {datetime.now().strftime('%H:%M:%S')}")
    print(f"{'━'*50}\n")
    print(f"  Pinging server... (may take up to 60s if sleeping)\n")

    while True:
        attempt += 1
        ok, data = ping(health)
        elapsed  = time.time() - start

        if ok:
            firebase = data.get("firebase", "unknown")
            print(f"\n  ✅ Server is AWAKE! (took {elapsed:.1f}s)\n")
            print(f"  Firebase:  {firebase}")
            print(f"  Version:   {data.get('version','?')}")
            print(f"  Service:   {data.get('service','?')}")

            if firebase == "connected":
                print(f"\n  🎉 Everything ready! Safe to start demo.\n")
            else:
                print(f"\n  ⚠️  Server awake but Firebase is in mock mode.")
                print(f"     Check FIREBASE_CREDENTIALS in Render env vars.\n")

            # Optionally pre-warm the Claude API too
            print(f"  Pre-warming Claude API...")
            try:
                body = json.dumps({
                    "message": "Hello",
                    "asdScore": 0,
                    "history": []
                }).encode()
                r = urllib.request.Request(
                    f"{base}/api/chat",
                    data=body,
                    headers={"Content-Type": "application/json"},
                    method="POST"
                )
                with urllib.request.urlopen(r, timeout=20) as resp:
                    print(f"  ✅ Claude API warm!\n")
            except Exception as e:
                print(f"  ⚠️  Claude API warm-up failed: {e}")
                print(f"     Chat might be slow on first use.\n")

            print(f"{'━'*50}")
            print(f"  YOU ARE READY TO DEMO!")
            print(f"{'━'*50}\n")
            return True

        else:
            dots = "." * (attempt % 4)
            print(f"  Attempt {attempt:02d} — sleeping{dots:<4} ({elapsed:.0f}s elapsed)", end="\r")

        if elapsed > 120:
            print(f"\n\n  ❌ Server did not respond after 120s.")
            print(f"     Check your Render dashboard for errors.\n")
            return False

        time.sleep(8)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python deploy/wake_backend.py <backend_url>")
        print("Example: python deploy/wake_backend.py https://autisense-backend.onrender.com")
        sys.exit(1)

    success = wake(sys.argv[1])
    sys.exit(0 if success else 1)