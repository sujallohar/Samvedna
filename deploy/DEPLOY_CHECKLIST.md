# AutiSense — Day 5 Deploy Checklist
# =====================================
# Follow this TOP TO BOTTOM. Do not skip steps.
# Estimated time: 30-45 minutes total.
# Cost: $0.00 (everything on free tiers)
#
# WHAT YOU'LL HAVE AT THE END:
#   Frontend → https://autisense.vercel.app        (or similar)
#   Backend  → https://autisense-backend.onrender.com
#   Database → Firebase Firestore (Google Cloud)
#   AI Chat  → Claude API (Anthropic)
# =====================================================

## ════════════════════════════════════════════
## PHASE 1 — ACCOUNTS SETUP (do this first)
## ════════════════════════════════════════════

### 1.1 — GitHub (you probably have this)
[ ] Go to https://github.com → Sign up / Sign in
[ ] Have Git installed: open terminal → type: git --version
    If not installed: https://git-scm.com/downloads

### 1.2 — Firebase (Google's free database)
[ ] Go to https://console.firebase.google.com
[ ] Click "Create a project"
[ ] Name it: autisense  (or any name)
[ ] Disable Google Analytics (not needed) → click Continue
[ ] Wait for project to be created (~30 sec)
[ ] Click "Build" in left sidebar → "Firestore Database"
[ ] Click "Create database"
[ ] Choose "Start in test mode" (allows all reads/writes for 30 days — enough for demo)
[ ] Select region: asia-south1 (Mumbai) → click Enable
[ ] FIRESTORE IS NOW READY ✅

### 1.3 — Get Firebase Service Account Key
[ ] In Firebase Console → click gear icon (top left) → "Project settings"
[ ] Click "Service accounts" tab
[ ] Click "Generate new private key" button
[ ] Click "Generate key" in the popup
[ ] A JSON file downloads → RENAME IT to: serviceAccountKey.json
[ ] Move it to: autism-detect/backend/serviceAccountKey.json
[ ] NEVER commit this file to GitHub (it's in .gitignore already) ✅

### 1.4 — Anthropic API Key (Claude AI)
[ ] Go to https://console.anthropic.com
[ ] Sign up (free account gets $5 credit — enough for 500+ chat messages)
[ ] Go to "API Keys" in the sidebar
[ ] Click "Create Key" → name it: autisense
[ ] COPY THE KEY NOW (you can't see it again!)
[ ] Paste it somewhere safe temporarily (Notepad, etc.)

### 1.5 — Render.com (free backend hosting)
[ ] Go to https://render.com → Sign up with GitHub
[ ] Allow Render to access your GitHub repos

### 1.6 — Vercel (free frontend hosting)
[ ] Go to https://vercel.com → Sign up with GitHub
[ ] Allow Vercel to access your GitHub repos


## ════════════════════════════════════════════
## PHASE 2 — PUSH CODE TO GITHUB
## ════════════════════════════════════════════

### 2.1 — Create GitHub Repository
[ ] Go to https://github.com/new
[ ] Repository name: autism-detect
[ ] Set to: Public
[ ] Do NOT check any initialization options
[ ] Click "Create repository"
[ ] Copy your repo URL: https://github.com/YOUR_USERNAME/autism-detect.git

### 2.2 — Add .gitignore to root
[ ] Create file autism-detect/.gitignore with this content:
    (see section: ROOT GITIGNORE below)

### 2.3 — Push code
Open terminal in the autism-detect/ folder and run:

    cd autism-detect
    git init
    git add .
    git commit -m "Initial commit - AutiSense cloud project"
    git branch -M main
    git remote add origin https://github.com/YOUR_USERNAME/autism-detect.git
    git push -u origin main

[ ] Refresh GitHub page — you should see all your files ✅


## ════════════════════════════════════════════
## PHASE 3 — DEPLOY BACKEND ON RENDER.COM
## ════════════════════════════════════════════

### 3.1 — Create Web Service
[ ] Go to https://render.com → Dashboard
[ ] Click "New +" → "Web Service"
[ ] Click "Connect a repository"
[ ] Select your autism-detect repo
[ ] Click "Connect"

### 3.2 — Configure the service
Fill in these fields:
[ ] Name:            autisense-backend
[ ] Region:          Singapore (closest free region to India)
[ ] Branch:          main
[ ] Root Directory:  backend        ← IMPORTANT: set this to "backend"
[ ] Runtime:         Python 3
[ ] Build Command:   pip install -r requirements.txt
[ ] Start Command:   gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120
[ ] Plan:            Free

### 3.3 — Add Environment Variables
Click "Advanced" → "Add Environment Variable" — add ALL of these:

KEY                   | VALUE
----------------------|--------------------------------------------------
FLASK_ENV             | production
ANTHROPIC_API_KEY     | sk-ant-xxxx  (your key from step 1.4)
FRONTEND_URL          | https://autisense.vercel.app  (update after deploy)
FIREBASE_CREDENTIALS  | (see step 3.4 below)

### 3.4 — Format Firebase credentials for Render
The FIREBASE_CREDENTIALS env var needs the entire serviceAccountKey.json
as a SINGLE LINE of text. Here's how:

On Mac/Linux terminal:
    cat backend/serviceAccountKey.json | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin)))"

On Windows PowerShell:
    Get-Content backend\serviceAccountKey.json | python -c "import sys,json; print(json.dumps(json.load(sys.stdin)))"

[ ] Copy the output (starts with {"type":"service_account"...)
[ ] Paste it as the value for FIREBASE_CREDENTIALS in Render

### 3.5 — Deploy
[ ] Click "Create Web Service"
[ ] Watch the build logs — takes 3-5 minutes
[ ] Wait for status: "Live" with green dot
[ ] Click the URL at the top: https://autisense-backend.onrender.com
[ ] You should see: {"message": "AutiSense API is running", ...}
[ ] Test health: https://autisense-backend.onrender.com/health
[ ] BACKEND IS LIVE ✅

SAVE YOUR BACKEND URL — you need it in the next step.


## ════════════════════════════════════════════
## PHASE 4 — DEPLOY FRONTEND ON VERCEL
## ════════════════════════════════════════════

### 4.1 — Add Vercel config
[ ] Create file frontend/vercel.json (see VERCEL CONFIG section below)

### 4.2 — Import project on Vercel
[ ] Go to https://vercel.com → Dashboard
[ ] Click "Add New..." → "Project"
[ ] Click "Import" next to your autism-detect repo
[ ] Under "Root Directory" → click "Edit" → type: frontend
[ ] Framework Preset: Vite (auto-detected)
[ ] Click "Deploy" — DO NOT add env vars yet

### 4.3 — Wait for first deploy
[ ] Wait 1-2 minutes for deploy to complete
[ ] Vercel gives you a URL like: https://autism-detect-abc123.vercel.app
[ ] SAVE THIS URL

### 4.4 — Add environment variable
[ ] Go to your Vercel project → Settings → Environment Variables
[ ] Add:
    Name:  VITE_BACKEND_URL
    Value: https://autisense-backend.onrender.com  (your Render URL)
[ ] Click Save

### 4.5 — Redeploy with env var
[ ] Go to Deployments tab → click the three dots → "Redeploy"
[ ] Wait for deploy to complete
[ ] Open your Vercel URL
[ ] You should see the AutiSense app! ✅

### 4.6 — Update Render with your Vercel URL
[ ] Go back to Render → your service → Environment
[ ] Update FRONTEND_URL to your actual Vercel URL
[ ] Render will auto-redeploy (30 sec)


## ════════════════════════════════════════════
## PHASE 5 — SMOKE TEST EVERYTHING
## ════════════════════════════════════════════

Test these in order:

[ ] 1. Open your Vercel URL in browser
[ ] 2. Click "Start Detection" → allow camera → see MediaPipe loading
[ ] 3. Wait for model to load (first time: ~15 seconds)
[ ] 4. See face landmarks appear on your face in the video
[ ] 5. See live ASD indicator score updating in the right panel
[ ] 6. Type "Hello" in the chat → get a response from Claude
[ ] 7. Click "Guardian Dashboard" tab → see your session
[ ] 8. Click your session → see the score chart
[ ] 9. Click "Export Doctor Report (PDF)" → PDF downloads
[ ] 10. Test on mobile: open Vercel URL on your phone ✅


## ════════════════════════════════════════════
## ROOT GITIGNORE (autism-detect/.gitignore)
## ════════════════════════════════════════════

Create file: autism-detect/.gitignore

    # Python
    backend/venv/
    backend/__pycache__/
    backend/*.pyc
    backend/.env

    # SECRETS — NEVER COMMIT
    backend/serviceAccountKey.json
    **/*.key
    **/*.pem

    # Node
    frontend/node_modules/
    frontend/dist/
    frontend/.env.local

    # OS
    .DS_Store
    Thumbs.db
    *.log


## ════════════════════════════════════════════
## VERCEL CONFIG (frontend/vercel.json)
## ════════════════════════════════════════════

Create file: frontend/vercel.json

    {
      "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
      "headers": [
        {
          "source": "/(.*)",
          "headers": [
            { "key": "Cross-Origin-Embedder-Policy", "value": "credentialless" },
            { "key": "Cross-Origin-Opener-Policy",   "value": "same-origin" }
          ]
        }
      ]
    }

NOTE: These headers are required for MediaPipe WebAssembly to work on Vercel.


## ════════════════════════════════════════════
## TROUBLESHOOTING
## ════════════════════════════════════════════

PROBLEM: Camera doesn't work on Vercel
FIX:     Must use HTTPS. Vercel provides HTTPS automatically. ✅

PROBLEM: MediaPipe takes 30+ seconds to load
FIX:     Normal on first load — downloading 8MB WASM model.
         Second load is instant (browser caches it).

PROBLEM: Chat says "offline mode"
FIX:     Check ANTHROPIC_API_KEY in Render environment variables.
         Check Render logs for Python errors.

PROBLEM: Dashboard shows "Cannot reach backend"
FIX:     Render free tier SLEEPS after 15 min of inactivity.
         First request takes 30-60 seconds to wake up.
         Solution: open https://your-backend.onrender.com/health
         first, wait for it to wake up, then use the app.

PROBLEM: Firebase not saving data
FIX:     Check FIREBASE_CREDENTIALS in Render env vars.
         Make sure it's valid JSON on one line.
         Run python firebase_setup.py locally to test.

PROBLEM: CORS error in browser console
FIX:     Update FRONTEND_URL in Render to match your exact Vercel URL.
         Include https:// and no trailing slash.

PROBLEM: Vercel build fails
FIX:     Make sure Root Directory is set to "frontend" in Vercel settings.
         Check that package.json has "build": "vite build" in scripts.


## ════════════════════════════════════════════
## WHAT TO SAY TO FACULTY (demo script)
## ════════════════════════════════════════════

"This project demonstrates four cloud computing service models:

1. SaaS — The end user (guardian/child) accesses the app through a browser
   at autisense.vercel.app. No installation required.

2. PaaS — The Flask backend is hosted on Render.com. I only wrote Python code.
   Render handles the OS, runtime, SSL certificates, auto-scaling, and
   zero-downtime deployments. I never managed a server.

3. BaaS — Firebase Firestore is Backend-as-a-Service. I never provisioned a
   database server. Google manages availability, backups, and global distribution.

4. Serverless / Edge — Vercel deploys the React frontend to 40+ edge locations
   worldwide. The MediaPipe ML model runs as WebAssembly in the browser — that
   is serverless ML inference. No GPU server required.

5. API Economy — The AI intelligence comes from Anthropic's Claude API.
   I consumed AI as a cloud service, which demonstrates the modern API-first
   architecture used by real production systems.

The system uses real-time data flow: webcam frames → browser ML inference →
REST API → NoSQL cloud database → live dashboard. All free, all cloud-native."
