# AutiSense — Faculty Demo Script
# ==================================
# Estimated demo time: 8-10 minutes
# Run wake_backend.py 2 minutes before starting!
#
# This script tells you exactly what to SAY and DO
# for maximum impact with your faculty evaluator.
# ====================================================


## PRE-DEMO SETUP (5 min before faculty arrives)

1. Open two browser tabs:
   Tab 1: https://your-app.vercel.app           (the live app)
   Tab 2: https://dashboard.render.com           (to show cloud infra)

2. Run the warmer in terminal:
   python deploy/wake_backend.py https://autisense-backend.onrender.com

3. Open browser DevTools → Network tab (to show real API calls live)

4. Make sure your webcam works and lighting is decent


## ════════════════════════════════════════════
##  DEMO FLOW — Follow this exactly
## ════════════════════════════════════════════

─────────────────────────────────────────────
STEP 1 (1 min): The Problem Statement
─────────────────────────────────────────────
SAY:
"Autism Spectrum Disorder affects 1 in 36 children globally.
 Diagnosis currently requires expensive, months-long clinical assessments.
 Our project — AutiSense — is a cloud-native screening tool that can
 detect early ASD indicators in real time using just a webcam."


─────────────────────────────────────────────
STEP 2 (2 min): Show the Architecture FIRST
─────────────────────────────────────────────
SAY (pointing at your architecture diagram or drawing on board):

"The system uses four cloud service models:

 FIRST — Vercel serves the React frontend from 40+ global edge locations.
 That's CDN-based serverless hosting — no web server to manage.

 SECOND — MediaPipe, Google's ML library, runs as WebAssembly entirely
 in the browser. The model is downloaded from Google's CDN once and cached.
 This is serverless ML inference — we get GPU-class performance with zero
 server cost.

 THIRD — Our Flask backend runs on Render.com, which is PaaS.
 I wrote Python code. Render handles OS, SSL, auto-scaling, health checks.
 I never SSH into a machine.

 FOURTH — Session data is stored in Firebase Firestore, Google's BaaS.
 No database server, no schema migrations, automatic global replication.

 FIFTH — The AI chat uses Anthropic's Claude API — AI consumed as a cloud
 service. This is the API Economy model, central to modern cloud architecture."


─────────────────────────────────────────────
STEP 3 (3 min): LIVE DEMO
─────────────────────────────────────────────
DO: Switch to Tab 1 (the live app)

SAY: "Let me show you the system working live."

DO: Click "Start Detection" → allow camera

SAY: "The app is now downloading the MediaPipe face mesh model from
      Google's CDN. This is approximately 8 megabytes of WebAssembly ML code."

[Wait for model to load — green landmarks appear on your face]

SAY: "You can see 478 facial landmarks being tracked at 30 frames per second.
      The purple dots on my eyes are iris landmarks — these measure eye gaze.
      The system is extracting five behavioral signals simultaneously."

DO: Point to the score panel on the right

SAY: "Each signal contributes a weighted score:
      - Eye contact:     35% weight
      - Blink rate:      15% weight
      - Facial expression: 20% weight
      - Hand movement:   20% weight
      - Head stability:  10% weight

      These weights are based on published ASD behavioral research.
      The combined score gives us an ASD indicator level from 0 to 100."

DO: Open DevTools Network tab, show POST to /api/log-score

SAY: "Every 3 seconds, the score is sent to our Render.com backend
      and saved to Firebase Firestore. You can see the real API call here."


─────────────────────────────────────────────
STEP 4 (1 min): Chat Demonstration
─────────────────────────────────────────────
DO: Type "Hello, I want to play a game" in the chat

SAY: "This is the AI companion powered by Claude. The key innovation is
      adaptive communication — the system prompt changes based on the detected
      ASD level. At Level 0 it speaks normally. At Level 3 it uses maximum
      5 words per sentence with very simple vocabulary. The communication
      style adapts in real time as the score changes."

[Show the response from Claude]


─────────────────────────────────────────────
STEP 5 (1 min): Guardian Dashboard
─────────────────────────────────────────────
DO: Click "Guardian Dashboard" tab

SAY: "This is the guardian and doctor view. All sessions are stored in
      Firebase. The sparkline charts show score trends at a glance."

DO: Click your current session

SAY: "Clicking a session shows the full time-series chart rendered with
      Chart.js. The system generates evidence-based — not prescriptive —
      recommendations based on the average score."

DO: Click "Export Doctor Report"

SAY: "The PDF report is generated entirely client-side using jsPDF.
      No server processing. The guardian can share this with a clinician."


─────────────────────────────────────────────
STEP 6 (1 min): Cloud Infrastructure
─────────────────────────────────────────────
DO: Switch to Tab 2 (Render dashboard)

SAY: "This is the Render.com dashboard. You can see the deployment logs,
      memory usage, CPU, and request volume. The backend auto-scales
      and has automatic SSL — things I get for free from PaaS."

SAY: "The entire stack costs zero rupees to run.
      Vercel: free.
      Render: free 750 hours per month.
      Firebase: free Spark plan — 1GB storage, 50,000 reads per day.
      Anthropic: $5 free credit on signup."


─────────────────────────────────────────────
STEP 7 (30 sec): Closing
─────────────────────────────────────────────
SAY: "To summarize — this project demonstrates SaaS delivery, PaaS deployment,
      BaaS data storage, serverless ML inference, CDN-based hosting, and
      API economy patterns — all integrated in a single working application
      that addresses a real healthcare problem.

      The live URL is: [your Vercel URL]
      Anyone with a browser and webcam can use it right now."


## ════════════════════════════════════════════
##  LIKELY FACULTY QUESTIONS + ANSWERS
## ════════════════════════════════════════════

Q: "How accurate is your ASD detection?"
A: "Our scoring algorithm is rule-based, drawing on research-validated
   behavioral markers. It's a screening aid — like a blood pressure cuff.
   It flags indicators for a clinician to evaluate, not diagnose.
   A full clinical model would require training on a labeled video dataset
   like SSBD, which is our next step."

Q: "How is this cloud computing and not just a website?"
A: "The computation is distributed across four cloud providers:
   Google's CDN for model delivery, Render's PaaS for backend logic,
   Firebase's globally-distributed Firestore for storage, and Anthropic's
   inference cluster for AI. No single machine handles everything.
   That's the essence of cloud-native architecture."

Q: "What happens to user privacy / video data?"
A: "Video frames never leave the browser — MediaPipe processes them in
   WebAssembly locally. We only send the extracted numerical scores to the
   backend, never raw video. This is a privacy-by-design approach."

Q: "Could this scale to thousands of users?"
A: "Yes. Vercel's edge network handles frontend scaling automatically.
   Firebase scales horizontally with zero configuration. The Flask backend
   on Render can be upgraded to a paid plan for multiple workers.
   MediaPipe runs in the client browser, so ML inference scales to
   infinite users with zero server cost."

Q: "Why Flask and not Node.js?"
A: "Python was chosen because the AI/ML ecosystem is Python-native —
   DeepFace, scikit-learn, and the Anthropic SDK all have first-class
   Python support. Flask is lightweight and deploys easily on Render.
   For production we would add async handling with FastAPI."

Q: "What is your cloud provider?"
A: "We use a multi-cloud architecture deliberately:
   Google Cloud (Firebase + MediaPipe CDN),
   Render.com (backend compute),
   Vercel (frontend / CDN),
   Anthropic (AI inference).
   This demonstrates vendor diversity and resilience."
