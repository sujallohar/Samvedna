/**
 * Samvedna (संवेदना) — Empathy Through Understanding
 * =====================================================
 * Design Direction: Organic Calm
 * - Warm earthy palette (terracotta, sage, cream, deep forest)
 * - Rounded organic shapes, nothing sharp or clinical
 * - Nunito + Playfair Display — friendly yet trustworthy
 * - Gentle animations that never startle
 * - Dark mode that feels like dusk, not a lab
 */

import { useState, useCallback, useRef, useEffect } from "react";
import CameraDetection from "./components/CameraDetection";
import ChatBot from "./components/ChatBot";
import Dashboard from "./components/Dashboard";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";
const generateSessionId = () =>
  `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// ── Games data keyed by ASD level ─────────────────────────────────────────────
const GAMES_BY_LEVEL = {
  0: [
    { id: "memory", title: "Pattern Memory", emoji: "🌿", desc: "Remember and repeat colour sequences", duration: "3–5 min", benefit: "Attention & working memory", color: "#6b9e78" },
    { id: "sort", title: "Shape Sorter", emoji: "🔷", desc: "Sort shapes by colour and size", duration: "2–4 min", benefit: "Visual processing", color: "#7b8dc2" },
    { id: "story", title: "Story Builder", emoji: "📖", desc: "Arrange picture cards to tell a story", duration: "5–8 min", benefit: "Narrative & social skills", color: "#c2946b" },
    { id: "music", title: "Melody Match", emoji: "🎵", desc: "Identify and repeat simple melodies", duration: "3–5 min", benefit: "Auditory processing", color: "#9b7bc2" },
  ],
  1: [
    { id: "bubble", title: "Calm Bubbles", emoji: "🫧", desc: "Pop bubbles at your own pace", duration: "2–3 min", benefit: "Focus & calm", color: "#6bb5c2" },
    { id: "colour", title: "Colour Garden", emoji: "🌸", desc: "Paint a garden with calming colours", duration: "4–6 min", benefit: "Creative expression", color: "#c27b8d" },
    { id: "match", title: "Animal Match", emoji: "🐘", desc: "Match animals to their sounds", duration: "3–4 min", benefit: "Association skills", color: "#9bc26b" },
    { id: "breath", title: "Breathing Star", emoji: "⭐", desc: "Follow the star to breathe slowly", duration: "2–3 min", benefit: "Regulation & calm", color: "#c2b96b" },
  ],
  2: [
    { id: "tap", title: "Gentle Tap", emoji: "🌊", desc: "Tap the screen to the gentle rhythm", duration: "2–3 min", benefit: "Motor coordination", color: "#6b9ec2" },
    { id: "light", title: "Light & Shadow", emoji: "☀️", desc: "Simple cause-effect light play", duration: "1–2 min", benefit: "Cause & effect learning", color: "#c2a46b" },
    { id: "spin", title: "Pinwheel", emoji: "🌀", desc: "Blow or tap to spin the pinwheel", duration: "1–3 min", benefit: "Engagement & joy", color: "#c26b6b" },
    { id: "sound", title: "Sound Garden", emoji: "🎶", desc: "Touch to hear calming nature sounds", duration: "2–4 min", benefit: "Sensory exploration", color: "#6bc2a4" },
  ],
  3: [
    { id: "glow", title: "Glow Touch", emoji: "✨", desc: "Touch glowing circles as they appear", duration: "1–2 min", benefit: "Visual tracking", color: "#c29b6b" },
    { id: "drum", title: "Big Drum", emoji: "🥁", desc: "Tap the big drum for happy sounds", duration: "1–2 min", benefit: "Cause & effect, joy", color: "#6b7dc2" },
    { id: "mirror", title: "Mirror Me", emoji: "🪞", desc: "Watch and copy simple movements", duration: "2–3 min", benefit: "Imitation & connection", color: "#c26b9b" },
    { id: "stars", title: "Star Shower", emoji: "🌟", desc: "Touch to release falling stars", duration: "1–2 min", benefit: "Simple interaction & joy", color: "#8bc26b" },
  ],
};

const LEVEL_NAMES = ["Neurotypical", "Mild", "Moderate", "Significant"];

// ── Mini game components ──────────────────────────────────────────────────────
function BubbleGame({ onClose }) {
  const [bubbles, setBubbles] = useState(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i, x: 10 + Math.random() * 80, y: 10 + Math.random() * 80,
      size: 40 + Math.random() * 50, alive: true,
      hue: [180, 200, 220, 240][Math.floor(Math.random() * 4)],
    }))
  );
  const [popped, setPopped] = useState(0);

  const pop = (id) => {
    setBubbles(b => b.map(x => x.id === id ? { ...x, alive: false } : x));
    setPopped(p => p + 1);
  };

  return (
    <div style={{ position: "relative", width: "100%", height: 380, borderRadius: 24, overflow: "hidden", background: "linear-gradient(135deg,#e8f4f8,#d4edf5)" }}>
      {bubbles.map(b => b.alive && (
        <div key={b.id} onClick={() => pop(b.id)} style={{
          position: "absolute", left: `${b.x}%`, top: `${b.y}%`,
          width: b.size, height: b.size, borderRadius: "50%",
          background: `radial-gradient(circle at 35% 35%, hsla(${b.hue},80%,85%,0.9), hsla(${b.hue},60%,65%,0.7))`,
          border: `2px solid hsla(${b.hue},70%,75%,0.8)`,
          cursor: "pointer", transform: "translate(-50%,-50%)",
          transition: "transform 0.1s", boxShadow: `0 4px 20px hsla(${b.hue},60%,60%,0.3)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: b.size * 0.35, userSelect: "none",
          animation: `floatBubble ${3 + Math.random() * 2}s ease-in-out infinite alternate`,
        }}>🫧</div>
      ))}
      <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, textAlign: "center", fontFamily: "Nunito", fontWeight: 700, color: "#4a7c8a", fontSize: 16 }}>
        {popped === 0 ? "Tap the bubbles 🌊" : `${popped} bubbles popped! ${popped >= 12 ? "🎉 All done!" : "Keep going..."}`}
      </div>
      <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.8)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>×</button>
    </div>
  );
}

function StarGame({ onClose }) {
  const [stars, setStars] = useState([]);
  const addStar = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const id = Date.now();
    setStars(s => [...s, { id, x, y }]);
    setTimeout(() => setStars(s => s.filter(st => st.id !== id)), 2000);
  };
  return (
    <div onClick={addStar} style={{ position: "relative", width: "100%", height: 380, borderRadius: 24, overflow: "hidden", background: "linear-gradient(135deg,#1a1a3e,#2d1b69,#1a1a3e)", cursor: "pointer" }}>
      {stars.map(s => (
        <div key={s.id} style={{
          position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
          transform: "translate(-50%,-50%)", fontSize: 32,
          animation: "starFall 2s ease-out forwards", pointerEvents: "none",
        }}>✨</div>
      ))}
      <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, textAlign: "center", fontFamily: "Nunito", color: "rgba(255,255,255,0.8)", fontSize: 15 }}>
        Touch anywhere to release stars 🌟
      </div>
      <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#fff" }}>×</button>
    </div>
  );
}

function BreathingGame({ onClose }) {
  const [phase, setPhase] = useState("inhale");
  const [count, setCount] = useState(4);
  useEffect(() => {
    const timer = setInterval(() => {
      setCount(c => {
        if (c <= 1) {
          setPhase(p => p === "inhale" ? "hold" : p === "hold" ? "exhale" : "inhale");
          return p => p === "inhale" ? 7 : p === "hold" ? 8 : 4;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const colors = { inhale: "#6b9e78", hold: "#c2946b", exhale: "#6b9ec2" };
  const sizes = { inhale: 160, hold: 160, exhale: 80 };
  const labels = { inhale: "Breathe In 🌱", hold: "Hold 🌟", exhale: "Breathe Out 🌊" };
  return (
    <div style={{ width: "100%", height: 380, borderRadius: 24, background: "#f5f0e8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
      <div style={{ width: sizes[phase], height: sizes[phase], borderRadius: "50%", background: colors[phase], opacity: 0.85, transition: "all 1s ease", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, boxShadow: `0 0 60px ${colors[phase]}66` }}>
        {count}
      </div>
      <p style={{ fontFamily: "Nunito", fontSize: 20, fontWeight: 700, color: "#4a3728" }}>{labels[phase]}</p>
      <button onClick={onClose} style={{ padding: "8px 20px", borderRadius: 99, border: "2px solid #c2946b", background: "transparent", color: "#c2946b", fontFamily: "Nunito", fontWeight: 700, cursor: "pointer" }}>Stop</button>
    </div>
  );
}

function GlowGame({ onClose }) {
  const [circles, setCircles] = useState(() =>
    Array.from({ length: 1 }, () => ({ id: 0, x: 50, y: 50, hue: 45 }))
  );
  const [score, setScore] = useState(0);
  const tap = (id) => {
    setScore(s => s + 1);
    setCircles([{ id: Date.now(), x: 15 + Math.random() * 70, y: 15 + Math.random() * 70, hue: Math.random() * 360 }]);
  };
  return (
    <div style={{ position: "relative", width: "100%", height: 380, borderRadius: 24, background: "#0d1117", overflow: "hidden" }}>
      {circles.map(c => (
        <div key={c.id} onClick={() => tap(c.id)} style={{
          position: "absolute", left: `${c.x}%`, top: `${c.y}%`,
          transform: "translate(-50%,-50%)",
          width: 80, height: 80, borderRadius: "50%",
          background: `radial-gradient(circle, hsla(${c.hue},90%,70%,0.95), hsla(${c.hue},70%,40%,0.7))`,
          boxShadow: `0 0 40px hsla(${c.hue},80%,60%,0.8), 0 0 80px hsla(${c.hue},80%,60%,0.4)`,
          cursor: "pointer", animation: "glowPulse 1.5s ease-in-out infinite",
        }} />
      ))}
      <div style={{ position: "absolute", top: 16, left: 0, right: 0, textAlign: "center", fontFamily: "Nunito", color: "rgba(255,255,255,0.8)", fontSize: 16 }}>
        Score: {score} ✨ Tap the glow!
      </div>
      <button onClick={onClose} style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", padding: "8px 24px", borderRadius: 99, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", fontFamily: "Nunito", cursor: "pointer" }}>Done</button>
    </div>
  );
}

const GAME_COMPONENTS = { bubble: BubbleGame, stars: StarGame, breath: BreathingGame, glow: GlowGame };

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useState(false);
  const [sessionId] = useState(generateSessionId);
  const [asdScore, setAsdScore] = useState(0);
  const [asdLevel, setAsdLevel] = useState(null);
  const [activeTab, setActiveTab] = useState("detect");
  const [activeGame, setActiveGame] = useState(null);
  const logThrottle = useRef(0);

  const levelIndex = asdLevel
    ? ["Level 0", "Level 1", "Level 2", "Level 3"].indexOf(asdLevel.level)
    : 0;
  const games = GAMES_BY_LEVEL[Math.max(0, levelIndex)];

  const handleScoreUpdate = useCallback(async ({ asdScore: score, level, rawScores }) => {
    setAsdScore(score);
    setAsdLevel(level);
    const now = Date.now();
    if (now - logThrottle.current < 3000) return;
    logThrottle.current = now;
    try {
      await fetch(`${BACKEND_URL}/api/log-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, asdScore: score, rawScores, level: level?.level, timestamp: new Date().toISOString() }),
      });
    } catch { }
  }, [sessionId]);

  const GameComp = activeGame ? GAME_COMPONENTS[activeGame] : null;

  const t = dark ? DARK : LIGHT;

  return (
    <div style={{ ...S.root, background: t.bg, color: t.text, minHeight: "100vh" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Playfair+Display:ital,wght@0,700;1,600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Nunito', sans-serif; }
        @keyframes floatBubble { from { transform: translate(-50%,-50%) scale(1); } to { transform: translate(-50%,-53%) scale(1.04); } }
        @keyframes starFall { 0%{opacity:1;transform:translate(-50%,-50%) scale(1)} 100%{opacity:0;transform:translate(-50%,30%) scale(0.3)} }
        @keyframes glowPulse { 0%,100%{opacity:1;transform:translate(-50%,-50%) scale(1)} 50%{opacity:0.85;transform:translate(-50%,-50%) scale(1.1)} }
        @keyframes gentlePulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform:rotate(360deg) } }
        .tab-btn:hover { opacity: 0.85; }
        .game-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.12) !important; }
        .game-card { transition: transform 0.2s, box-shadow 0.2s; }
        .nav-tab { transition: all 0.2s; }
        .toggle-btn { transition: background 0.3s; }
        input, textarea { outline: none; }
      `}</style>

      {/* ── Header ── */}
      <header style={{ ...S.header, background: t.headerBg, borderBottom: `1px solid ${t.border}` }}>
        <div style={S.headerInner}>

          {/* Logo */}
          <div style={S.logoWrap}>
            <div style={{ ...S.logoMark, background: t.accent }}>
              <span style={{ fontSize: 22 }}>🪷</span>
            </div>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: t.accent, letterSpacing: "-0.02em" }}>
                Samvedna
              </div>
              <div style={{ fontSize: 10, color: t.muted, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                संवेदना · Empathy Through Understanding
              </div>
            </div>
          </div>

          {/* Nav tabs */}
          <nav style={S.navTabs}>
            {[
              { key: "detect", label: "Live Detection", icon: "👁" },
              { key: "games", label: "Play & Grow", icon: "🌿" },
              { key: "dashboard", label: "Guardian View", icon: "🌸" },
            ].map(({ key, label, icon }) => (
              <button key={key} className="nav-tab" onClick={() => setActiveTab(key)} style={{
                ...S.navTab,
                background: activeTab === key ? t.accent : "transparent",
                color: activeTab === key ? "#fff" : t.muted,
                border: `1.5px solid ${activeTab === key ? t.accent : t.border}`,
              }}>
                <span style={{ fontSize: 14 }}>{icon}</span> {label}
              </button>
            ))}
          </nav>

          {/* Right: score pill + dark toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {asdLevel && (
              <div style={{ ...S.scorePill, background: t.pillBg, border: `1.5px solid ${t.border}` }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: asdLevel.color, animation: "gentlePulse 2s infinite" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{asdLevel.level}</span>
                <span style={{ fontSize: 11, color: t.muted }}>· {Math.round(asdScore)}</span>
              </div>
            )}

            {/* Dark mode toggle */}
            <button className="toggle-btn" onClick={() => setDark(d => !d)} style={{
              width: 52, height: 28, borderRadius: 99, border: "none", cursor: "pointer",
              background: dark ? "#5a8f6a" : "#d4c4a8", position: "relative", flexShrink: 0,
            }}>
              <div style={{
                position: "absolute", top: 3, left: dark ? 26 : 3,
                width: 22, height: 22, borderRadius: "50%", background: "#fff",
                transition: "left 0.3s", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              }}>{dark ? "🌙" : "☀️"}</div>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 20px", animation: "slideUp 0.4s ease" }}>

        {/* ══ TAB: Live Detection ══ */}
        {activeTab === "detect" && (
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>

            {/* Left: camera */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: "0 0 auto" }}>
              {/* Cloud chips */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { icon: "🧠", label: "MediaPipe · Google CDN" },
                  { icon: "🔥", label: "Firebase · BaaS" },
                  { icon: "☁️", label: "Render · PaaS" },
                  { icon: "✨", label: "Claude · AI API" },
                ].map(c => (
                  <div key={c.label} style={{ ...S.chip, background: t.chipBg, color: t.muted, border: `1px solid ${t.border}` }}>
                    {c.icon} {c.label}
                  </div>
                ))}
              </div>

              <CameraDetection onScoreUpdate={handleScoreUpdate} sessionId={sessionId} />

              {/* Session card */}
              <div style={{ ...S.card, background: t.cardBg, border: `1px solid ${t.border}` }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: t.accent, marginBottom: 12 }}>Session Info</div>
                {[
                  { label: "Session", value: sessionId.slice(0, 22) + "…" },
                  { label: "Classification", value: asdLevel?.label || "Awaiting detection…" },
                  { label: "Live Score", value: `${Math.round(asdScore)} / 100` },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${t.border}` }}>
                    <span style={{ fontSize: 12, color: t.muted }}>{row.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{row.value}</span>
                  </div>
                ))}
                <button onClick={() => setActiveTab("games")} style={{ ...S.btnPrimary, background: t.accent, marginTop: 14, width: "100%" }}>
                  🌿 Go to Recommended Games →
                </button>
              </div>
            </div>

            {/* Right: Mitra chatbot */}
            <div style={{ flex: 1, minWidth: 320, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", background: t.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🌺</div>
                <div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: t.accent }}>Mitra</div>
                  <div style={{ fontSize: 11, color: t.muted, letterSpacing: "0.08em" }}>मित्र · Your Companion</div>
                </div>
              </div>
              <ChatBot asdScore={asdScore} asdLevel={asdLevel} sessionId={sessionId} dark={dark} theme={t} />
            </div>
          </div>
        )}

        {/* ══ TAB: Games ══ */}
        {activeTab === "games" && (
          <div style={{ animation: "slideUp 0.3s ease" }}>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: t.accent, marginBottom: 6 }}>
                Play & Grow 🌿
              </h2>
              <p style={{ color: t.muted, fontSize: 14, lineHeight: 1.6 }}>
                Activities chosen for <strong style={{ color: t.text }}>
                  {asdLevel ? `${asdLevel.level} — ${LEVEL_NAMES[levelIndex]} indicators` : "you"}
                </strong>. Each game is calm, safe, and joyful.
              </p>
            </div>

            {/* Active game */}
            {GameComp && (
              <div style={{ marginBottom: 28, animation: "slideUp 0.3s ease" }}>
                <GameComp onClose={() => setActiveGame(null)} />
              </div>
            )}

            {/* Game grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 18 }}>
              {games.map(game => {
                const hasInteractive = !!GAME_COMPONENTS[game.id];
                return (
                  <div key={game.id} className="game-card" style={{
                    ...S.card, background: t.cardBg, border: `1px solid ${t.border}`,
                    cursor: hasInteractive ? "pointer" : "default",
                  }} onClick={() => hasInteractive && setActiveGame(game.id)}>
                    <div style={{ fontSize: 44, marginBottom: 12, textAlign: "center" }}>{game.emoji}</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: t.accent, marginBottom: 6 }}>
                      {game.title}
                    </div>
                    <p style={{ fontSize: 13, color: t.muted, lineHeight: 1.6, marginBottom: 14 }}>{game.desc}</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                      <span style={{ ...S.tag, background: t.tagBg, color: t.muted }}>⏱ {game.duration}</span>
                      <span style={{ ...S.tag, background: t.tagBg, color: t.muted }}>✦ {game.benefit}</span>
                    </div>
                    {hasInteractive ? (
                      <div style={{ ...S.btnPrimary, background: game.color, textAlign: "center", fontSize: 13 }}>
                        Play Now →
                      </div>
                    ) : (
                      <div style={{ ...S.btnOutline, borderColor: t.border, color: t.muted, textAlign: "center", fontSize: 13 }}>
                        Coming soon
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Level legend */}
            <div style={{ ...S.card, background: t.cardBg, border: `1px solid ${t.border}`, marginTop: 28 }}>
              <div style={{ fontFamily: "'Playfair Display', serif", color: t.accent, marginBottom: 14, fontSize: 16 }}>
                How we choose games for you
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                {Object.entries(GAMES_BY_LEVEL).map(([lvl, g]) => (
                  <div key={lvl} style={{ padding: "12px 14px", borderRadius: 12, background: t.tagBg, border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: ["#22c55e", "#f59e0b", "#f97316", "#ef4444"][lvl], marginBottom: 4 }}>
                      Level {lvl} — {LEVEL_NAMES[lvl]}
                    </div>
                    <div style={{ fontSize: 11, color: t.muted }}>{g.map(x => x.title).join(" · ")}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB: Dashboard ══ */}
        {activeTab === "dashboard" && (
          <div style={{ animation: "slideUp 0.3s ease" }}>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: t.accent, marginBottom: 6 }}>
                Guardian View 🌸
              </h2>
              <p style={{ color: t.muted, fontSize: 14 }}>Session history, score trends, and doctor-ready reports.</p>
            </div>
            <Dashboard sessionId={sessionId} dark={dark} theme={t} />
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={{ textAlign: "center", padding: "20px 24px", borderTop: `1px solid ${t.border}`, color: t.muted, fontSize: 11 }}>
        <span style={{ fontFamily: "'Playfair Display', serif", color: t.accent }}>Samvedna</span>
        {" · "}Screening aid only — not a medical diagnosis
        {" · "}MediaPipe · Firebase · Render
      </footer>
    </div>
  );
}

// ── Themes ────────────────────────────────────────────────────────────────────
const LIGHT = {
  bg: "#faf7f2",
  headerBg: "#fff9f4",
  cardBg: "#ffffff",
  text: "#2c1f0e",
  muted: "#8a7560",
  accent: "#9b5e38",
  border: "#e8ddd0",
  pillBg: "#fff",
  chipBg: "#f5ede2",
  tagBg: "#f5ede2",
};
const DARK = {
  bg: "#1a1410",
  headerBg: "#211a13",
  cardBg: "#2a211a",
  text: "#f0e8dc",
  muted: "#9a8a78",
  accent: "#d4854a",
  border: "#3d2e22",
  pillBg: "#2a211a",
  chipBg: "#2a211a",
  tagBg: "#211a13",
};

// ── Shared styles ─────────────────────────────────────────────────────────────
const S = {
  root: { fontFamily: "'Nunito', sans-serif", transition: "background 0.3s, color 0.3s" },
  header: { position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)" },
  headerInner: { maxWidth: 1200, margin: "0 auto", padding: "0 20px", height: 68, display: "flex", alignItems: "center", gap: 20 },
  logoWrap: { display: "flex", alignItems: "center", gap: 12, flexShrink: 0 },
  logoMark: { width: 44, height: 44, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  navTabs: { display: "flex", gap: 6, flex: 1, justifyContent: "center" },
  navTab: { padding: "7px 16px", borderRadius: 99, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "'Nunito',sans-serif", display: "flex", alignItems: "center", gap: 6 },
  scorePill: { display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 99 },
  card: { padding: "20px 22px", borderRadius: 20, boxShadow: "0 2px 16px rgba(0,0,0,0.04)" },
  chip: { padding: "5px 12px", borderRadius: 99, fontSize: 11, fontWeight: 600 },
  tag: { padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600 },
  btnPrimary: { padding: "10px 20px", borderRadius: 99, border: "none", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "'Nunito',sans-serif", display: "block" },
  btnOutline: { padding: "10px 20px", borderRadius: 99, border: "1.5px solid", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Nunito',sans-serif", background: "transparent", display: "block" },
};