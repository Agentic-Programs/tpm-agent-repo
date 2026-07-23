import { X } from "lucide-react";
import { MODES, iconBtnStyle } from "../tokens.js";

export default function HistoryDrawer({ history, loading, onClose }) {
  return (
    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 320, background: "#12172a", borderLeft: "1px solid #262f47", padding: 16, overflowY: "auto", zIndex: 20, animation: "riseIn 0.2s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 14 }}>Run history</div>
        <button onClick={onClose} style={iconBtnStyle}><X size={14} /></button>
      </div>
      {loading && <div style={{ fontFamily: "Inter", fontSize: 12, color: "#5d6785" }}>Loading...</div>}
      {!loading && history.length === 0 && (
        <div style={{ fontFamily: "Inter", fontSize: 12.5, color: "#5d6785" }}>
          No runs yet — trigger a skill from the console or ask your agent.
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {history.map((h, i) => {
          const modeInfo = MODES[h.mode];
          return (
            <div key={i} style={{ background: "#161c2e", border: "1px solid #262f47", borderRadius: 8, padding: "9px 11px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {modeInfo && <modeInfo.icon size={11} color={modeInfo.color} />}
                <span style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 12, color: "#eef0f7" }}>{h.skillName}</span>
              </div>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: 10.5, color: "#5d6785", marginTop: 4 }}>
                {new Date(h.time).toLocaleString()} · via {h.source}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
