import { useState } from "react";
import { ChevronDown, Plus, Layers } from "lucide-react";

export default function ProgramSwitcher({ programs, activeProgram, onSwitch, onCreate }) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [error, setError] = useState(null);

  const submitCreate = async () => {
    if (!newName.trim()) return;
    try {
      setError(null);
      await onCreate({ name: newName.trim(), description: newDesc.trim() });
      setNewName("");
      setNewDesc("");
      setCreating(false);
      setOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#161c2e", border: "1px solid #262f47", borderRadius: 8,
          padding: "8px 12px", color: "#eef0f7", cursor: "pointer",
          fontFamily: "Inter", fontSize: 13, fontWeight: 700,
        }}
      >
        <Layers size={14} color="#e0a444" />
        {activeProgram ? activeProgram.name : "Select a program"}
        <ChevronDown size={14} color="#5d6785" />
      </button>

      {open && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: 260,
            background: "#12172a", border: "1px solid #262f47", borderRadius: 10,
            padding: 8, zIndex: 30, boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
          }}
        >
          {programs.map((p) => (
            <button
              key={p.id}
              onClick={() => { onSwitch(p.id); setOpen(false); }}
              style={{
                display: "block", width: "100%", textAlign: "left",
                background: p.id === activeProgram?.id ? "#1d2540" : "transparent",
                border: "none", borderRadius: 7, padding: "9px 10px", cursor: "pointer",
                color: "#eef0f7", fontFamily: "Inter", fontSize: 12.5,
              }}
            >
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: 10.5, color: "#5d6785", marginTop: 2 }}>
                {p.stakeholderCount} stakeholder{p.stakeholderCount === 1 ? "" : "s"}
              </div>
            </button>
          ))}

          <div style={{ borderTop: "1px solid #262f47", marginTop: 6, paddingTop: 6 }}>
            {!creating ? (
              <button
                onClick={() => setCreating(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, width: "100%",
                  background: "transparent", border: "none", borderRadius: 7,
                  padding: "9px 10px", cursor: "pointer", color: "#e0a444",
                  fontFamily: "Inter", fontSize: 12.5, fontWeight: 700,
                }}
              >
                <Plus size={13} /> New program
              </button>
            ) : (
              <div style={{ padding: "6px 6px 2px" }}>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Program name"
                  style={{ width: "100%", background: "#0e1220", border: "1px solid #2c3654", borderRadius: 6, padding: "7px 9px", color: "#eef0f7", fontFamily: "Inter", fontSize: 12.5, marginBottom: 6, outline: "none" }}
                />
                <input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Description (optional)"
                  style={{ width: "100%", background: "#0e1220", border: "1px solid #2c3654", borderRadius: 6, padding: "7px 9px", color: "#eef0f7", fontFamily: "Inter", fontSize: 12.5, marginBottom: 6, outline: "none" }}
                />
                {error && <div style={{ color: "#c2483d", fontSize: 11, marginBottom: 6, fontFamily: "Inter" }}>{error}</div>}
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={submitCreate} style={{ flex: 1, background: "#e0a444", border: "none", borderRadius: 6, padding: "7px 0", color: "#191305", fontFamily: "Inter", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                    Create
                  </button>
                  <button onClick={() => { setCreating(false); setError(null); }} style={{ flex: 1, background: "transparent", border: "1px solid #2c3654", borderRadius: 6, padding: "7px 0", color: "#9aa2ba", fontFamily: "Inter", fontSize: 12, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
