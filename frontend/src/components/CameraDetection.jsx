/**
 * CameraDetection.jsx — FIXED VERSION
 *
 * BUGS FIXED:
 *  1. Dynamic import() of MediaPipe from CDN fails in Vite (ESM incompatibility)
 *     FIX: Load MediaPipe via <script> tags injected into <head>, wait for globals
 *  2. Camera utility was imported from wrong package path
 *     FIX: Use correct CDN path and wait for window.Camera global
 *  3. processFrame was called before landmarks were ready, causing silent crash
 *     FIX: Guard checks added, wrapped in try/catch
 *  4. Status never reached "running" if MediaPipe threw during initialize()
 *     FIX: Full try/catch with setStatus("error") and visible error message
 *  5. canvas ref lost after re-render — now checks every draw call
 */

import { useRef, useState, useCallback, useEffect } from "react";

const INDICATORS = {
  eyeContact: { weight: 35, label: "Eye contact", desc: "Gaze toward camera/face region" },
  blinkRate: { weight: 15, label: "Blink rate", desc: "Normal: 15-20 blinks/min" },
  microExpr: { weight: 20, label: "Facial expression", desc: "Range and variability" },
  handMovement: { weight: 20, label: "Hand movement", desc: "Repetitive or stimming patterns" },
  headMovement: { weight: 10, label: "Head stability", desc: "Rocking or repetitive motion" },
};

const getASDLevel = (score) => {
  if (score < 25) return { level: "Level 0", label: "Neurotypical indicators", color: "#22c55e", bg: "#f0fdf4" };
  if (score < 50) return { level: "Level 1", label: "Mild ASD indicators", color: "#f59e0b", bg: "#fffbeb" };
  if (score < 75) return { level: "Level 2", label: "Moderate ASD indicators", color: "#f97316", bg: "#fff7ed" };
  return { level: "Level 3", label: "Significant ASD indicators", color: "#ef4444", bg: "#fef2f2" };
};

// ── Scoring helpers ───────────────────────────────────────────────────────────
function computeEyeContactScore(lm) {
  if (!lm || lm.length < 478) return 50;
  try {
    const lw = Math.abs(lm[133].x - lm[33].x);
    const rw = Math.abs(lm[263].x - lm[362].x);
    const lp = lw > 0 ? (lm[468].x - lm[33].x) / lw : 0.5;
    const rp = rw > 0 ? (lm[473].x - lm[362].x) / rw : 0.5;
    const dev = (Math.abs(lp - 0.5) + Math.abs(rp - 0.5)) / 2;
    return Math.max(0, Math.min(100, (1 - dev * 4) * 100));
  } catch { return 50; }
}

function computeBlinkScore(lm, blinkHistory) {
  if (!lm || lm.length < 478) return 50;
  try {
    const lo = Math.abs(lm[159].y - lm[145].y);
    const ro = Math.abs(lm[386].y - lm[374].y);
    const isBlink = (lo + ro) / 2 < 0.015;
    const now = Date.now();
    blinkHistory.current = blinkHistory.current.filter(t => now - t < 60000);
    if (isBlink && (blinkHistory.current.length === 0 || now - blinkHistory.current.at(-1) > 200)) {
      blinkHistory.current.push(now);
    }
    const bpm = blinkHistory.current.length;
    if (bpm < 8) return 20;
    if (bpm > 30) return 30;
    return 85;
  } catch { return 50; }
}

function computeExpressionScore(lm, exprHistory) {
  if (!lm || lm.length < 478) return 50;
  try {
    const w = Math.abs(lm[291].x - lm[61].x);
    const h = Math.abs(lm[14].y - lm[13].y);
    const mar = h / (w + 0.001);
    exprHistory.current.push(mar);
    if (exprHistory.current.length > 60) exprHistory.current.shift();
    if (exprHistory.current.length < 10) return 50;
    const mean = exprHistory.current.reduce((a, b) => a + b, 0) / exprHistory.current.length;
    const variance = exprHistory.current.reduce((a, b) => a + (b - mean) ** 2, 0) / exprHistory.current.length;
    return Math.min(100, variance * 50000);
  } catch { return 50; }
}

function computeHandScore(hands, handHistory) {
  if (!hands || hands.length === 0) return 50;
  try {
    const wrist = hands[0][0];
    handHistory.current.push({ x: wrist.x, y: wrist.y });
    if (handHistory.current.length > 30) handHistory.current.shift();
    if (handHistory.current.length < 5) return 50;
    let total = 0;
    for (let i = 1; i < handHistory.current.length; i++) {
      const dx = handHistory.current[i].x - handHistory.current[i - 1].x;
      const dy = handHistory.current[i].y - handHistory.current[i - 1].y;
      total += Math.sqrt(dx * dx + dy * dy);
    }
    const avg = total / handHistory.current.length;
    if (avg > 0.05) return 20;
    if (avg > 0.02) return 50;
    return 80;
  } catch { return 50; }
}

function computeHeadScore(lm, headHistory) {
  if (!lm || lm.length < 2) return 50;
  try {
    headHistory.current.push({ x: lm[1].x });
    if (headHistory.current.length > 60) headHistory.current.shift();
    if (headHistory.current.length < 10) return 50;
    const xs = headHistory.current.map(p => p.x);
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    const variance = xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length;
    return Math.max(0, Math.min(100, 100 - variance * 10000));
  } catch { return 50; }
}

// ── Load a script from CDN and wait for it ────────────────────────────────────
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src; s.async = true; s.crossOrigin = "anonymous";
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.head.appendChild(s);
  });
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CameraDetection({ onScoreUpdate, sessionId }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);

  const blinkHistory = useRef([]);
  const exprHistory = useRef([]);
  const handHistory = useRef([]);
  const headHistory = useRef([]);
  const latestFace = useRef(null);
  const latestHands = useRef(null);
  const fpsRef = useRef({ frames: 0, last: Date.now() });

  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [scores, setScores] = useState(null);
  const [asdLevel, setAsdLevel] = useState(null);
  const [fps, setFps] = useState(0);
  const [loadStep, setLoadStep] = useState("");

  // ── Process frame scores ────────────────────────────────────────────────────
  const processFrame = useCallback(() => {
    const face = latestFace.current;
    const hands = latestHands.current;

    const rawScores = {
      eyeContact: computeEyeContactScore(face),
      blinkRate: computeBlinkScore(face, blinkHistory),
      microExpr: computeExpressionScore(face, exprHistory),
      handMovement: computeHandScore(hands, handHistory),
      headMovement: computeHeadScore(face, headHistory),
    };

    const totalW = Object.values(INDICATORS).reduce((s, i) => s + i.weight, 0);
    const asdScore = Object.entries(rawScores).reduce((tot, [k, v]) =>
      tot + ((100 - v) * INDICATORS[k].weight) / totalW, 0);

    const level = getASDLevel(asdScore);
    setScores({ ...rawScores, asdScore: Math.round(asdScore) });
    setAsdLevel(level);

    // draw overlay
    drawOverlay(face, hands, asdScore);

    // fps
    fpsRef.current.frames++;
    const now = Date.now();
    if (now - fpsRef.current.last >= 1000) {
      setFps(fpsRef.current.frames);
      fpsRef.current = { frames: 0, last: now };
    }

    onScoreUpdate?.({ asdScore: Math.round(asdScore), rawScores, level, sessionId });
  }, [onScoreUpdate, sessionId]);

  // ── Draw landmarks ──────────────────────────────────────────────────────────
  const drawOverlay = (faceLM, handLM, asdScore) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !video.videoWidth) return;
    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (faceLM) {
      [33, 133, 362, 263, 1, 61, 291, 13, 14, 468, 473].forEach(idx => {
        if (!faceLM[idx]) return;
        ctx.beginPath();
        ctx.arc(faceLM[idx].x * canvas.width, faceLM[idx].y * canvas.height, 3, 0, Math.PI * 2);
        ctx.fillStyle = asdScore > 50 ? "rgba(239,68,68,0.85)" : "rgba(34,197,94,0.85)";
        ctx.fill();
      });
      [468, 473].forEach(idx => {
        if (!faceLM[idx]) return;
        ctx.beginPath();
        ctx.arc(faceLM[idx].x * canvas.width, faceLM[idx].y * canvas.height, 7, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(99,102,241,0.9)";
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }

    if (handLM) {
      const conn = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
      [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16],
      [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]];
      handLM.forEach(hand => {
        conn.forEach(([a, b]) => {
          if (!hand[a] || !hand[b]) return;
          ctx.beginPath();
          ctx.moveTo(hand[a].x * canvas.width, hand[a].y * canvas.height);
          ctx.lineTo(hand[b].x * canvas.width, hand[b].y * canvas.height);
          ctx.strokeStyle = "rgba(251,191,36,0.85)";
          ctx.lineWidth = 2;
          ctx.stroke();
        });
        hand.forEach(pt => {
          ctx.beginPath();
          ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 3, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(251,191,36,0.9)";
          ctx.fill();
        });
      });
    }
  };

  // ── Init MediaPipe via script tags (fixes Vite ESM import issue) ────────────
  const startDetection = async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      // Step 1: Load MediaPipe scripts from CDN as regular <script> tags
      // This is the correct way — dynamic import() breaks with these UMD bundles
      setLoadStep("Loading face detection model...");
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js");
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js");
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js");

      setLoadStep("Loading hand tracking model...");
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");

      // Step 2: Access globals (MediaPipe sets window.FaceMesh, window.Hands, window.Camera)
      const { FaceMesh, Hands, Camera } = window;
      if (!FaceMesh || !Hands || !Camera) {
        throw new Error("MediaPipe globals not available after script load. Check your internet connection.");
      }

      // Step 3: Set up FaceMesh
      setLoadStep("Initialising face mesh...");
      const faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,  // lowered from 0.7 for better detection
        minTrackingConfidence: 0.5,
      });
      faceMesh.onResults((results) => {
        latestFace.current = results.multiFaceLandmarks?.[0] ?? null;
      });
      await faceMesh.initialize();

      // Step 4: Set up Hands
      setLoadStep("Initialising hand tracking...");
      const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 0,           // 0 = lite, faster on Mac
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      hands.onResults((results) => {
        latestHands.current = results.multiHandLandmarks?.length > 0
          ? results.multiHandLandmarks : null;
      });
      await hands.initialize();

      // Step 5: Request camera permission EXPLICITLY before starting Camera utility
      setLoadStep("Requesting camera permission...");
      await navigator.mediaDevices.getUserMedia({ video: true });

      // Step 6: Start camera
      setLoadStep("Starting camera...");
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            await faceMesh.send({ image: videoRef.current });
            await hands.send({ image: videoRef.current });
            processFrame();
          } catch (e) {
            // individual frame errors are non-fatal
          }
        },
        width: 640,
        height: 480,
      });
      await camera.start();
      cameraRef.current = camera;

      setLoadStep("");
      setStatus("running");

    } catch (err) {
      console.error("MediaPipe init error:", err);
      setStatus("error");
      setErrorMsg(err.message || "Unknown error starting detection.");
    }
  };

  // cleanup on unmount
  useEffect(() => {
    return () => { cameraRef.current?.stop?.(); };
  }, []);

  const levelColors = { "#22c55e": true, "#f59e0b": true, "#f97316": true, "#ef4444": true };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={S.wrapper}>

      {/* Video + canvas */}
      <div style={S.videoBox}>
        <video ref={videoRef} autoPlay playsInline muted style={S.video} />
        <canvas ref={canvasRef} style={S.canvas} />

        {status === "idle" && (
          <div style={S.overlay}>
            <button style={S.startBtn} onClick={startDetection}>Start Detection</button>
            <p style={S.overlayNote}>Camera access required · MediaPipe loads from Google CDN</p>
          </div>
        )}

        {status === "loading" && (
          <div style={S.overlay}>
            <div style={S.spinner} />
            <p style={{ color: "#fff", marginTop: 14, fontSize: 14, textAlign: "center" }}>
              {loadStep || "Loading MediaPipe models..."}
            </p>
            <p style={{ color: "#94a3b8", fontSize: 11, marginTop: 6 }}>
              First load downloads ~15MB from Google CDN
            </p>
          </div>
        )}

        {status === "error" && (
          <div style={S.overlay}>
            <p style={{ color: "#ef4444", fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
              Detection failed to start
            </p>
            <p style={{ color: "#fca5a5", fontSize: 12, textAlign: "center", maxWidth: 340, marginBottom: 16 }}>
              {errorMsg}
            </p>
            <button style={S.startBtn} onClick={startDetection}>Try Again</button>
            <p style={{ color: "#94a3b8", fontSize: 11, marginTop: 8 }}>
              Make sure you're on http://localhost:5173 and camera is not in use
            </p>
          </div>
        )}

        {status === "running" && <div style={S.fpsBadge}>{fps} fps</div>}
      </div>

      {/* Score panel */}
      {scores && asdLevel && (
        <div style={S.scorePanel}>
          <div style={{ ...S.levelBanner, background: asdLevel.bg, borderColor: asdLevel.color }}>
            <span style={{ ...S.levelText, color: asdLevel.color }}>{asdLevel.level}</span>
            <span style={{ ...S.levelLabel, color: asdLevel.color }}>{asdLevel.label}</span>
            <svg width="70" height="70" viewBox="0 0 70 70">
              <circle cx="35" cy="35" r="28" fill="none" stroke="#e2e8f0" strokeWidth="6" />
              <circle cx="35" cy="35" r="28" fill="none" stroke={asdLevel.color} strokeWidth="6"
                strokeDasharray={`${(scores.asdScore / 100) * 175.9} 175.9`}
                strokeLinecap="round" transform="rotate(-90 35 35)" />
              <text x="35" y="40" textAnchor="middle"
                style={{ fontSize: 16, fontWeight: 700, fill: asdLevel.color }}>
                {scores.asdScore}
              </text>
            </svg>
          </div>

          <div style={S.indicatorList}>
            {Object.entries(INDICATORS).map(([key, info]) => {
              const contrib = 100 - (scores[key] ?? 50);
              return (
                <div key={key} style={S.indicatorRow}>
                  <div style={S.indHeader}>
                    <span style={S.indLabel}>{info.label}</span>
                    <span style={S.indWeight}>×{info.weight}%</span>
                  </div>
                  <p style={S.indDesc}>{info.desc}</p>
                  <div style={S.barTrack}>
                    <div style={{
                      ...S.barFill, width: `${contrib}%`,
                      background: contrib > 60 ? "#ef4444" : contrib > 35 ? "#f97316" : "#22c55e",
                    }} />
                  </div>
                  <div style={S.barLabels}>
                    <span style={{ color: "#22c55e" }}>Neurotypical</span>
                    <span style={{ color: "#ef4444" }}>ASD indicator</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={S.legend}>
            <p style={S.legendNote}>
              Screening aid only — NOT a medical diagnosis. Consult a qualified clinician.
            </p>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const S = {
  wrapper: { display: "flex", gap: 24, flexWrap: "wrap", fontFamily: "'DM Sans', sans-serif" },
  videoBox: { position: "relative", flex: "0 0 auto", width: 640, height: 480, borderRadius: 16, overflow: "hidden", background: "#0f172a", boxShadow: "0 4px 24px rgba(0,0,0,0.18)" },
  video: { width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" },
  canvas: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", transform: "scaleX(-1)", pointerEvents: "none" },
  overlay: { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.8)", backdropFilter: "blur(4px)", padding: 24 },
  startBtn: { padding: "14px 32px", fontSize: 16, fontWeight: 700, borderRadius: 12, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff" },
  overlayNote: { color: "#94a3b8", marginTop: 10, fontSize: 12, textAlign: "center" },
  spinner: { width: 40, height: 40, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.15)", borderTopColor: "#6366f1", animation: "spin 0.8s linear infinite" },
  fpsBadge: { position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.55)", color: "#94a3b8", fontSize: 11, padding: "3px 8px", borderRadius: 6 },
  scorePanel: { flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 16 },
  levelBanner: { display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderRadius: 14, border: "2px solid", flexWrap: "wrap" },
  levelText: { fontSize: 18, fontWeight: 800, flex: "0 0 auto" },
  levelLabel: { fontSize: 13, fontWeight: 500, flex: 1 },
  indicatorList: { display: "flex", flexDirection: "column", gap: 14 },
  indicatorRow: { background: "#f8fafc", borderRadius: 10, padding: "12px 14px", border: "1px solid #e2e8f0" },
  indHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  indLabel: { fontSize: 13, fontWeight: 600, color: "#1e293b" },
  indWeight: { fontSize: 11, color: "#94a3b8" },
  indDesc: { fontSize: 11, color: "#64748b", margin: "2px 0 8px" },
  barTrack: { height: 8, borderRadius: 99, background: "#e2e8f0", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 99, transition: "width 0.4s ease, background 0.4s ease" },
  barLabels: { display: "flex", justifyContent: "space-between", fontSize: 10, marginTop: 4, color: "#94a3b8" },
  legend: { padding: "12px 14px", background: "#fffbeb", borderRadius: 10, border: "1px solid #fde68a" },
  legendNote: { fontSize: 11, color: "#92400e", margin: 0, lineHeight: 1.5 },
};