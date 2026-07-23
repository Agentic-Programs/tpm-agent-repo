import { Play, Radio, Terminal } from "lucide-react";
import { MODES } from "../tokens.js";
import OutputBlock from "./OutputBlock.jsx";

export default function SkillCard({ skill, onRun, running, output, onDismiss }) {
  const mode = MODES[skill.mode];
  const Icon = mode.icon;

  return (
    <div style={{ background: "#161c2e", border: "1px solid #262f47", borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, flexShrink: 0, background: mode.color + "22", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={15} color={mode.color} />
            </div>
            <div>
              <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 14, color: "#eef0f7" }}>{skill.name}</div>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: mode.color, marginTop: 2 }}>{skill.mode.toUpperCase()}</div>
            </div>
          </div>
          <button
            onClick={() => onRun(skill)}
            disabled={running}
            style={{
              flexShrink: 0, display: "flex", alignItems: "center", gap: 5,
              background: running ? "#262f47" : "#e0a444",
              color: running ? "#8b93ab" : "#191305",
              border: "none", borderRadius: 6, padding: "6px 11px",
              fontFamily: "Inter", fontWeight: 700, fontSize: 12,
              cursor: running ? "default" : "pointer",
            }}
          >
            {running ? (<><Radio size={12} className="pulse" /> Running</>) : (<><Play size={11} /> Run</>)}
          </button>
        </div>
        <p style={{ fontFamily: "Inter", fontSize: 12.5, color: "#9aa2ba", margin: "10px 0 0", lineHeight: 1.5 }}>{skill.desc}</p>
        <div style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "#5d6785", marginTop: 8, display: "flex", alignItems: "center", gap: 5 }}>
          <Terminal size={11} /> "{skill.tagline}"
        </div>
      </div>

      {output && (
        <div style={{ padding: "0 12px 12px" }}>
          <OutputBlock output={output} skillId={skill.id} onClose={() => onDismiss(skill.id)} />
        </div>
      )}
    </div>
  );
}
