# AutiSense — Complete Local Setup Guide
# ========================================
# Follow this EXACTLY, top to bottom.
# Estimated time: 20-30 minutes first time.
# OS: Works on Windows, Mac, and Linux.
# ========================================


## ════════════════════════════════════════════
## PART 1 — WHAT TO INSTALL ON YOUR COMPUTER
## ════════════════════════════════════════════

Install these ONCE. Skip if already installed.

### 1.1 — Node.js (for React frontend)
  Download: https://nodejs.org  → choose "LTS" version
  After install, verify in terminal:
      node --version     → should show v18 or v20
      npm --version      → should show v9 or v10

### 1.2 — Python 3.10+ (for Flask backend)
  Download: https://www.python.org/downloads
  WINDOWS: check "Add Python to PATH" during install ← IMPORTANT
  After install, verify:
      python --version   → should show 3.10 or higher
      pip --version      → should show pip 23+

### 1.3 — Git (for version control)
  Download: https://git-scm.com/downloads
  After install, verify:
      git --version      → should show git 2.x


## ════════════════════════════════════════════
## PART 2 — FOLDER STRUCTURE TO CREATE
## ════════════════════════════════════════════

Create this EXACT folder structure on your computer.
You can do this in Finder (Mac) or File Explorer (Windows).

autism-detect/                     ← ROOT folder (create this anywhere, e.g. Desktop)
│
├── .gitignore                     ← copy from output files
│
├── frontend/                      ← React app folder
│   ├── vercel.json                ← copy from output files
│   ├── index.html                 ← copy from output files
│   ├── package.json               ← copy from output files
│   ├── vite.config.js             ← copy from output files
│   ├── .env.local                 ← YOU CREATE THIS (see Part 4)
│   └── src/
│       ├── main.jsx               ← copy from output files
│       ├── App.jsx                ← copy from output files
│       └── components/
│           ├── CameraDetection.jsx ← copy from output files
│           ├── ChatBot.jsx         ← copy from output files
│           └── Dashboard.jsx       ← copy from output files
│
├── backend/                       ← Flask API folder
│   ├── app.py                     ← copy from output files
│   ├── requirements.txt           ← copy from output files
│   ├── render.yaml                ← copy from output files
│   ├── firebase_setup.py          ← copy from output files
│   ├── test_api.py                ← copy from output files
│   ├── .env                       ← YOU CREATE THIS (see Part 4)
│   └── serviceAccountKey.json     ← YOU DOWNLOAD FROM FIREBASE (see Part 4)
│
└── deploy/                        ← Deploy scripts
    ├── DEPLOY_CHECKLIST.md        ← copy from output files
    ├── DEMO_SCRIPT.md             ← copy from output files
    ├── smoke_test.py              ← copy from output files
    ├── wake_backend.py            ← copy from output files
    └── deploy.sh                  ← copy from output files


QUICK WAY TO CREATE ALL FOLDERS AT ONCE:
Open terminal and run these commands:

  mkdir autism-detect
  cd autism-detect
  mkdir -p frontend/src/components
  mkdir backend
  mkdir deploy

Then copy all the downloaded files into the correct folders.


## ════════════════════════════════════════════
## PART 3 — NO DATASET NEEDED (important!)
## ════════════════════════════════════════════

Good news: YOU DO NOT NEED TO DOWNLOAD ANY DATASET to run this project.

Here is why:
  - MediaPipe (Google's library) comes PRE-TRAINED. It already knows how
    to detect faces, eyes, and hands. No training required from you.
  - DeepFace is also pre-trained on millions of faces.
  - Our ASD scoring is rule-based (math formulas on the landmarks),
    not a trained neural network that needs data.
  - The MediaPipe model files download AUTOMATICALLY from Google's CDN
    when you first open the app in the browser (~8MB, takes 10 seconds).

So the flow is:
  Browser opens → MediaPipe WASM downloads from Google → detection starts
  No GPU, no training, no dataset download needed. ✅

IF YOUR FACULTY ASKS about datasets:
  "For a production system, we would fine-tune on the SSBD dataset
   (Self-Stimulatory Behaviour Dataset) and the Kaggle ASD Screening dataset.
   For this demo, we use MediaPipe's pre-trained models, which is the
   standard approach for real-time browser-based landmark detection."


## ════════════════════════════════════════════
## PART 4 — CREATE YOUR SECRET FILES
## ════════════════════════════════════════════

These files contain API keys. Create them manually (do NOT copy to GitHub).

### 4.1 — Create frontend/.env.local
Create a new file called exactly: .env.local
Put it inside the frontend/ folder.
Content:

    VITE_BACKEND_URL=http://localhost:5000

(This tells the React app where the Flask backend is during local dev)


### 4.2 — Create backend/.env
Create a new file called exactly: .env
Put it inside the backend/ folder.
Content (fill in your real keys):

    ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE
    FLASK_ENV=development
    PORT=5000
    FRONTEND_URL=http://localhost:5173

Get your Anthropic key from: https://console.anthropic.com
(Free $5 credit on signup — no credit card needed)


### 4.3 — Get Firebase serviceAccountKey.json
  1. Go to: https://console.firebase.google.com
  2. Click "Add project" → name it autisense → click Continue
  3. Disable Google Analytics → click Create Project
  4. In left sidebar: Build → Firestore Database
  5. Click "Create database"
  6. Choose "Start in test mode" → Next
  7. Region: asia-south1 (Mumbai) → Enable
  8. Now get the key:
     - Click gear icon (top-left, next to "Project Overview")
     - Click "Project settings"
     - Click "Service accounts" tab
     - Click "Generate new private key" button
     - Click "Generate key"
     - A .json file downloads → rename it: serviceAccountKey.json
     - Move it to: autism-detect/backend/serviceAccountKey.json


## ════════════════════════════════════════════
## PART 5 — INSTALL ALL DEPENDENCIES
## ════════════════════════════════════════════

Open terminal. Run these commands IN ORDER.

─────────────────────────────────────────
FRONTEND DEPENDENCIES (Node packages)
─────────────────────────────────────────
  cd autism-detect/frontend
  npm install

  This installs: react, react-dom, vite (~150MB in node_modules)
  Takes: 1-2 minutes
  You will see: added X packages in Xs ✅

─────────────────────────────────────────
BACKEND DEPENDENCIES (Python packages)
─────────────────────────────────────────
  cd autism-detect/backend

  # Create virtual environment (keeps packages isolated)
  python -m venv venv

  # Activate it:
  # Mac/Linux:
  source venv/bin/activate
  # Windows:
  venv\Scripts\activate

  # You should now see (venv) at the start of your terminal prompt

  # Install all packages:
  pip install -r requirements.txt

  This installs: flask, firebase-admin, anthropic, gunicorn, etc.
  Takes: 2-5 minutes
  You will see: Successfully installed X packages ✅

─────────────────────────────────────────
VERIFY FIREBASE CONNECTION
─────────────────────────────────────────
  # Still in backend/ with venv activated:
  python firebase_setup.py

  Expected output:
    ✅ firebase-admin package installed
    ✅ Credentials loaded from serviceAccountKey.json
    ✅ Firestore client initialized
    ✅ Test session written to Firestore
    ✅ Test score written to Firestore
    ✅ Session read back successfully
    ✅ Test documents cleaned up
    🎉 Firebase is fully set up and working!

  If you see MOCK MODE — your serviceAccountKey.json is not in the right
  place or has the wrong name. Check Part 3, step 4.3 again.


## ════════════════════════════════════════════
## PART 6 — RUN THE PROJECT LOCALLY
## ════════════════════════════════════════════

You need TWO terminal windows open at the same time.

─────────────────────────────────────────
TERMINAL 1 — Start the Backend (Flask)
─────────────────────────────────────────
  cd autism-detect/backend
  source venv/bin/activate    # Mac/Linux
  # or: venv\Scripts\activate  # Windows

  python app.py

  Expected output:
    🚀 AutiSense backend running on http://localhost:5000
       Firebase: connected
       Debug:    True

  Leave this terminal running. Do not close it.

─────────────────────────────────────────
TERMINAL 2 — Start the Frontend (React)
─────────────────────────────────────────
  cd autism-detect/frontend
  npm run dev

  Expected output:
    VITE v5.x.x  ready in 500ms
    ➜  Local:   http://localhost:5173/
    ➜  Network: http://192.168.x.x:5173/

  Leave this terminal running. Do not close it.

─────────────────────────────────────────
OPEN THE APP
─────────────────────────────────────────
  Open your browser and go to: http://localhost:5173

  You should see the AutiSense app with the purple logo.

  Click "Start Detection" → allow camera access → wait 10-15 seconds
  for MediaPipe model to download → green landmarks appear on your face!

─────────────────────────────────────────
TEST THE BACKEND SEPARATELY
─────────────────────────────────────────
  Open a THIRD terminal:
  cd autism-detect/backend
  source venv/bin/activate
  python test_api.py

  All tests should show ✅ PASS


## ════════════════════════════════════════════
## PART 7 — TROUBLESHOOTING
## ════════════════════════════════════════════

PROBLEM: npm install fails
FIX: Make sure you are inside the frontend/ folder, not root
     Check node --version shows v18+

PROBLEM: pip install fails
FIX: Make sure venv is activated (you see (venv) in terminal)
     Try: pip install --upgrade pip    then retry

PROBLEM: Camera not working in browser
FIX: Must use http://localhost:5173 (not a file:// URL)
     Allow camera when browser asks
     Check no other app is using the camera (Zoom, Teams, etc.)

PROBLEM: MediaPipe loads forever / never shows landmarks
FIX: Check internet connection (needs to download from Google CDN)
     Try opening: https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/
     If that loads, MediaPipe CDN is reachable

PROBLEM: Chat shows "offline mode"
FIX: Check your backend/.env has ANTHROPIC_API_KEY set correctly
     Restart Flask: Ctrl+C in Terminal 1, then python app.py again
     Check http://localhost:5000/health — should show {"status":"ok"}

PROBLEM: Firebase shows "MOCK MODE"
FIX: Check serviceAccountKey.json is in backend/ folder (not backend/backend/)
     Check the file is valid JSON: python -c "import json; json.load(open('serviceAccountKey.json'))"

PROBLEM: CORS error in browser console
FIX: Make sure Flask is running on port 5000
     Make sure .env.local has VITE_BACKEND_URL=http://localhost:5000
     Restart both terminals

PROBLEM: Port 5000 already in use (Mac)
FIX: Mac uses port 5000 for AirPlay. Change Flask port:
     In backend/.env: PORT=5001
     In frontend/.env.local: VITE_BACKEND_URL=http://localhost:5001

PROBLEM: "venv\Scripts\activate is not recognized" (Windows)
FIX: Run this first: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
     Then try activating again


## ════════════════════════════════════════════
## PART 8 — DAILY WORKFLOW (after first setup)
## ════════════════════════════════════════════

Every time you want to work on the project:

  Terminal 1:
    cd autism-detect/backend
    source venv/bin/activate     # Mac/Linux
    python app.py

  Terminal 2:
    cd autism-detect/frontend
    npm run dev

  Browser: http://localhost:5173

That's it. No reinstalling needed.


## ════════════════════════════════════════════
## PACKAGE REFERENCE (what each package does)
## ════════════════════════════════════════════

FRONTEND (installed via npm):
  react          → UI framework
  react-dom      → renders React to browser DOM
  vite           → fast build tool / dev server

BACKEND (installed via pip):
  flask          → Python web framework, handles HTTP requests
  flask-cors     → allows frontend (port 5173) to call backend (port 5000)
  firebase-admin → Python SDK to read/write Firebase Firestore
  anthropic      → Python SDK for Claude AI chat
  python-dotenv  → loads .env file into environment variables
  gunicorn       → production web server (used on Render.com)
  requests       → HTTP client (utility)

LOADED FROM CDN (no install needed, browser fetches automatically):
  @mediapipe/face_mesh    → 478 facial landmark detection
  @mediapipe/hands        → 21 hand landmark detection
  @mediapipe/camera_utils → webcam capture utility
  Chart.js                → score history charts in dashboard
  jsPDF                   → PDF report generation


## ════════════════════════════════════════════
## COMPLETE COMMANDS QUICK REFERENCE
## ════════════════════════════════════════════

FIRST TIME SETUP:
  cd autism-detect/frontend && npm install
  cd ../backend && python -m venv venv
  source venv/bin/activate  (Mac) / venv\Scripts\activate  (Windows)
  pip install -r requirements.txt
  python firebase_setup.py

RUN EVERY TIME:
  Terminal 1: cd backend && source venv/bin/activate && python app.py
  Terminal 2: cd frontend && npm run dev
  Browser: http://localhost:5173

TEST BACKEND:
  cd backend && source venv/bin/activate && python test_api.py

DEPLOY TO CLOUD:
  git add . && git commit -m "update" && git push origin main
  (Render + Vercel auto-deploy from GitHub push)

WARM UP BEFORE DEMO:
  python deploy/wake_backend.py https://your-app.onrender.com
