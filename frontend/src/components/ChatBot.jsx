/**
 * ChatBot.jsx — Mitra (मित्र) Companion
 * Warm, organic design. Never clinical. Always kind.
 */

import { useState, useRef, useEffect } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const getWelcome = (score) => {
  if (score < 25) return "Namaste! 🙏 I'm Mitra, your companion. How are you feeling today?";
  if (score < 50) return "Hello! I am Mitra 🌸 I am here for you. How do you feel?";
  if (score < 75) return "Hi! I am Mitra. 🌼 I am your friend. How are you?";
  return "Hello! I am here. 🌟 I am Mitra!";
};

const QUICK = {
  low: ["Tell me something fun ✨", "I feel happy today 😊", "What can we do? 🌿", "Share a fact 🧠"],
  mid: ["I feel good 😊", "I feel sad 🌧", "Let us play 🎮", "Hello! 👋"],
  high: ["Happy 😊", "Sad 🌧", "Play 🎮", "Hi! 👋"],
};
const getQuick = (s) => s < 40 ? QUICK.low : s < 70 ? QUICK.mid : QUICK.high;

export default function ChatBot({ asdScore = 0, asdLevel, sessionId, dark, theme: t }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const historyRef = useRef([]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const prevLevel = useRef(0);

  useEffect(() => {
    setMessages([{ id: "w", role: "bot", text: getWelcome(asdScore), time: new Date() }]);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const curr = Math.floor(asdScore / 25);
    if (curr !== prevLevel.current && messages.length > 1) {
      setMessages(m => [...m, { id: `n${Date.now()}`, role: "notice", text: `Mitra is adapting to ${asdLevel?.level || "current level"} 🌿`, time: new Date() }]);
      prevLevel.current = curr;
    }
  }, [asdScore]);

  const send = async (text) => {
    const msg = text.trim();
    if (!msg || loading) return;

    setInput("");
    setLoading(true);

    // Add user message
    setMessages(m => [
      ...m,
      { id: `u${Date.now()}`, role: "user", text: msg, time: new Date() }
    ]);

    historyRef.current = [
      ...historyRef.current,
      { role: "user", content: msg }
    ];

    try {
      console.log("🌐 Backend URL:", BACKEND_URL);
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: msg,
          asdScore,
          sessionId,
          history: historyRef.current.slice(-8)
        })
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("❌ API Error:", text);
        throw new Error("Server error");
      }

      const data = await res.json();
      console.log("🤖 Full response:", data);

      const reply = data?.reply ?? "⚠️ No response from server";
      const model = data.model || "unknown";

      // Add bot message
      setMessages(m => [
        ...m,
        {
          id: `b${Date.now()}`,
          role: "bot",
          text: reply,
          time: new Date(),
          model // optional (debug)
        }
      ]);

      historyRef.current = [
        ...historyRef.current,
        { role: "assistant", content: reply }
      ];

      console.log("🤖 Model used:", model); // DEBUG

    } catch (err) {
      console.error("Chat error:", err);

      // Better fallback messages
      const fallbacks = [
        "I am here. 🌸",
        "Tell me more. 🌿",
        "I hear you. 💛",
        "That is okay. I am with you. ✨"
      ];

      setMessages(m => [
        ...m,
        {
          id: `f${Date.now()}`,
          role: "bot",
          text: fallbacks[Math.floor(Math.random() * fallbacks.length)],
          time: new Date(),
          offline: true
        }
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const fmt = (d) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const accentColor = t?.accent || "#9b5e38";
  const bg = t?.cardBg || "#fff";
  const text = t?.text || "#2c1f0e";
  const muted = t?.muted || "#8a7560";
  const border = t?.border || "#e8ddd0";
  const tagBg = t?.tagBg || "#f5ede2";

  return (
    <div style={{ background: bg, borderRadius: 24, border: `1px solid ${border}`, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", width: "100%", maxWidth: 400 }}>

      {/* Header */}
      <div style={{ padding: "14px 18px", background: tagBg, borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: accentColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🌺</div>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, color: accentColor }}>Mitra</div>
            <div style={{ fontSize: 10, color: muted, letterSpacing: "0.08em" }}>
              {asdLevel ? `${asdLevel.level} · ${asdLevel.label}` : "मित्र · Your Companion"}
            </div>
          </div>
          {/* Live indicator */}
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", animation: "gentlePulse 2s infinite", marginLeft: 4 }} />
        </div>
        <button onClick={() => setCollapsed(c => !c)} style={{ background: "none", border: "none", cursor: "pointer", color: muted, fontSize: 18, padding: "4px 8px", borderRadius: 8 }}>
          {collapsed ? "▲" : "▼"}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Messages */}
          <div style={{ height: 320, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map(msg => (
              <div key={msg.id}>
                {msg.role === "notice" && (
                  <div style={{ textAlign: "center", fontSize: 11, color: muted, background: tagBg, borderRadius: 99, padding: "3px 12px", margin: "4px auto", display: "inline-block", width: "auto" }}>
                    {msg.text}
                  </div>
                )}
                {msg.role === "bot" && (
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start", maxWidth: "88%" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: accentColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🌺</div>
                    <div>
                      <div style={{ background: tagBg, border: `1px solid ${border}`, borderRadius: "4px 16px 16px 16px", padding: "10px 14px", fontSize: 14, color: text, lineHeight: 1.6, maxWidth: 260 }}>
                        {msg.text}
                        {msg.offline && <span style={{ fontSize: 10, color: muted, display: "block", marginTop: 4 }}>· offline mode</span>}
                      </div>
                      <div style={{ fontSize: 10, color: muted, marginTop: 3, paddingLeft: 4 }}>{fmt(msg.time)}</div>
                    </div>
                  </div>
                )}
                {msg.role === "user" && (
                  <div style={{ display: "flex", justifyContent: "flex-end", maxWidth: "88%", marginLeft: "auto" }}>
                    <div>
                      <div style={{ background: accentColor, borderRadius: "16px 4px 16px 16px", padding: "10px 14px", fontSize: 14, color: "#fff", lineHeight: 1.6, maxWidth: 260 }}>
                        {msg.text}
                      </div>
                      <div style={{ fontSize: 10, color: muted, marginTop: 3, textAlign: "right", paddingRight: 4 }}>{fmt(msg.time)}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: accentColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🌺</div>
                <div style={{ background: tagBg, border: `1px solid ${border}`, borderRadius: "4px 16px 16px 16px", padding: "12px 16px", display: "flex", gap: 5 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: muted, animation: `gentlePulse 1.2s ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          <div style={{ padding: "8px 16px 0", display: "flex", flexWrap: "wrap", gap: 6 }}>
            {getQuick(asdScore).map(q => (
              <button key={q} onClick={() => send(q)} disabled={loading} style={{
                padding: "5px 12px", borderRadius: 99, border: `1px solid ${border}`,
                background: tagBg, color: muted, fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "'Nunito',sans-serif",
                opacity: loading ? 0.5 : 1,
              }}>{q}</button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: "10px 16px 14px", display: "flex", gap: 8 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send(input))}
              placeholder={asdScore > 70 ? "Type here…" : "Say something to Mitra…"}
              disabled={loading}
              maxLength={500}
              style={{
                flex: 1, padding: "10px 14px", borderRadius: 99,
                border: `1.5px solid ${border}`, fontSize: 13,
                background: tagBg, color: text,
                fontFamily: "'Nunito',sans-serif",
              }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              style={{
                padding: "10px 18px", borderRadius: 99, border: "none",
                background: accentColor, color: "#fff",
                fontWeight: 800, fontSize: 13, cursor: "pointer",
                fontFamily: "'Nunito',sans-serif",
                opacity: !input.trim() || loading ? 0.4 : 1,
                transition: "opacity 0.15s",
              }}>Send</button>
          </div>

          {/* Score strip */}
          <div style={{ padding: "6px 16px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10, color: muted, whiteSpace: "nowrap" }}>ASD indicator</span>
            <div style={{ flex: 1, height: 5, borderRadius: 99, background: border, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 99,
                width: `${asdScore}%`,
                background: asdScore > 60 ? "#ef4444" : asdScore > 35 ? "#f97316" : "#22c55e",
                transition: "width 0.6s ease",
              }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: accentColor }}>{Math.round(asdScore)}</span>
          </div>
        </>
      )}

      <style>{`@keyframes gentlePulse { 0%,100%{opacity:0.5} 50%{opacity:1} }`}</style>
    </div>
  );
}