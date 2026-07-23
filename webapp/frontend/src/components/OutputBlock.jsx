import { useState } from "react";
import { Copy, Check, Download, X } from "lucide-react";
import { TONE, iconBtnStyle } from "../tokens.js";

function outputToText(output) {
  let t = `${output.title}\n${output.meta}\n\n`;
  output.sections.forEach((s) => {
    t += `${s.heading.toUpperCase()}\n`;
    s.items.forEach((it) => {
      t += `- ${it.text}\n`;
      (it.sub || []).forEach((sb) => (t += `    ${sb}\n`));
    });
    t += "\n";
  });
  if (output.footer) t += output.footer + "\n";
  return t;
}

export default function OutputBlock({ output, onClose, skillId }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(outputToText(output));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable in some contexts — non-fatal */
    }
  };

  const download = () => {
    const blob = new Blob([outputToText(output)], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${skillId || "output"}-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ background: "#f5f2ea", borderRadius: 10, border: "1px solid #e3ddcb", overflow: "hidden", animation: "riseIn 0.28s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 18px 10px", borderBottom: "1px solid #e3ddcb" }}>
        <div>
          <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 16, color: "#241f13" }}>{output.title}</div>
          <div style={{ fontFamily: "JetBrains Mono", fontSize: 11.5, color: "#8a8168", marginTop: 3 }}>{output.meta}</div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={copy} title="Copy" style={iconBtnStyle}>{copied ? <Check size={14} /> : <Copy size={14} />}</button>
          <button onClick={download} title="Download .md" style={iconBtnStyle}><Download size={14} /></button>
          {onClose && <button onClick={onClose} title="Close" style={iconBtnStyle}><X size={14} /></button>}
        </div>
      </div>

      <div style={{ padding: "14px 18px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
        {output.sections.map((s, i) => {
          const t = TONE[s.tone] || TONE.info;
          return (
            <div key={i} style={{ borderLeft: `3px solid ${t.border}`, background: "#fffdf7", borderRadius: "0 6px 6px 0", padding: "10px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", color: t.chipText, background: t.chip, padding: "2px 7px", borderRadius: 4 }}>
                  {t.label}
                </span>
                <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 13.5, color: "#241f13" }}>{s.heading}</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {s.items.map((it, j) => (
                  <li key={j} style={{ fontFamily: "Inter", fontSize: 13, color: "#443d29", marginBottom: 4, lineHeight: 1.5 }}>
                    {it.text}
                    {(it.sub || []).map((sb, k) => (
                      <div key={k} style={{ fontSize: 12, color: "#8a8168", marginTop: 2, marginLeft: 4 }}>· {sb}</div>
                    ))}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        {output.footer && (
          <div style={{ fontFamily: "Inter", fontStyle: "italic", fontSize: 12.5, color: "#6b6248", paddingTop: 4 }}>{output.footer}</div>
        )}
      </div>
    </div>
  );
}
