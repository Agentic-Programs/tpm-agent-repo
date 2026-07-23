import { useState, useEffect, useRef } from "react";
import { Send, Sparkles } from "lucide-react";
import { api } from "../api.js";

const SUGGESTIONS = [
  "What do I have to do today?",
  "Prep me for my 1:1 with Alex",
  "Summarize my week so far",
  "Top 3 launch risks this week",
  "Who do I need to reach out to?",
];

export default function AgentChat({ programId, onSkillRan }) {
  const [messages, setMessages] = useState([
    { role: "agent", text: "Talk to me the way you'd talk to a TPM peer — no commands to memorize. Try a suggestion below, or ask me anything." },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, thinking]);

  // Reset the conversation when the active program changes — a chat
  // grounded in the wrong program's context is worse than a fresh start.
  useEffect(() => {
    setMessages([
      { role: "agent", text: "Talk to me the way you'd talk to a TPM peer — no commands to memorize. Try a suggestion below, or ask me anything." },
    ]);
  }, [programId]);

  const handleSend = async (text) => {
    const q = (text ?? input).trim();
    if (!q) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setThinking(true);

    try {
      const res = await api.chat(programId, q);
      if (res.matched) {
        setMessages((m) => [...m, { role: "agent", text: `Running "${res.skillName}"...`, meta: true }]);
        onSkillRan(res.skillId, res.output);
      } else {
        setMessages((m) => [...m, { role: "agent", text: res.reply }]);
      }
    } catch (err) {
      setMessages((m) => [...m, { role: "agent", text: `Couldn't reach the backend (${err.message}). Is it running on the configured VITE_API_BASE_URL?` }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div style={{ background: "#12172a", border: "1px solid #262f47", borderRadius: 10, display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{ padding: "13px 16px", borderBottom: "1px solid #262f47", display: "flex", alignItems: "center", gap: 8 }}>
        <Sparkles size={15} color="#e0a444" />
        <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 13.5, color: "#eef0f7" }}>Personal Agent</div>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "92%",
            background: m.role === "user" ? "#e0a444" : "#1d2540",
            color: m.role === "user" ? "#191305" : "#d7dbec",
            fontFamily: "Inter", fontSize: 12.5, lineHeight: 1.5,
            padding: "8px 11px", borderRadius: 9,
            fontStyle: m.meta ? "italic" : "normal", opacity: m.meta ? 0.75 : 1,
          }}>
            {m.text}
          </div>
        ))}
        {thinking && (
          <div style={{ alignSelf: "flex-start", display: "flex", gap: 4, padding: "8px 4px" }}>
            <span className="dot" style={{ animationDelay: "0s" }} />
            <span className="dot" style={{ animationDelay: "0.15s" }} />
            <span className="dot" style={{ animationDelay: "0.3s" }} />
          </div>
        )}
      </div>

      <div style={{ padding: "10px 14px", borderTop: "1px solid #262f47" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 9 }}>
          {SUGGESTIONS.map((s, i) => (
            <button key={i} onClick={() => handleSend(s)} style={{
              fontFamily: "JetBrains Mono", fontSize: 10.5, color: "#9aa2ba",
              background: "#1d2540", border: "1px solid #2c3654", borderRadius: 20,
              padding: "4px 9px", cursor: "pointer",
            }}>
              {s}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask your agent anything..."
            style={{ flex: 1, background: "#0e1220", border: "1px solid #2c3654", borderRadius: 7, padding: "9px 11px", color: "#eef0f7", fontFamily: "Inter", fontSize: 12.5, outline: "none" }}
          />
          <button onClick={() => handleSend()} style={{ background: "#e0a444", border: "none", borderRadius: 7, width: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#191305" }}>
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
