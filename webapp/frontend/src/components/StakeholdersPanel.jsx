import { useState, useEffect, useCallback, Fragment } from "react";
import { Plus, Trash2, Calendar, Mail, NotebookPen, Copy, Check, X, Users } from "lucide-react";
import { api } from "../api.js";

const INFLUENCE_LEVELS = ["high", "medium", "low"];
const INTEREST_LEVELS = ["low", "medium", "high"];
const SENTIMENT_COLOR = { green: "#3f9d6f", yellow: "#c98a2c", red: "#c2483d" };

const inputStyle = {
  width: "100%", background: "#0e1220", border: "1px solid #2c3654", borderRadius: 6,
  padding: "7px 9px", color: "#eef0f7", fontFamily: "Inter", fontSize: 12.5, outline: "none",
};
const selectStyle = { ...inputStyle };
const smallBtn = (variant = "default") => ({
  display: "flex", alignItems: "center", gap: 5, fontFamily: "Inter", fontWeight: 700, fontSize: 11.5,
  padding: "5px 9px", borderRadius: 6, cursor: "pointer", border: "1px solid #262f47",
  background: variant === "primary" ? "#e0a444" : "#161c2e",
  color: variant === "primary" ? "#191305" : "#d7dbec",
});

function daysSince(dateStr) {
  if (!dateStr) return null;
  const then = new Date(dateStr);
  const now = new Date();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

function StakeholderForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial || { name: "", role: "", team: "", influence: "medium", interest: "medium", preferredChannel: "email", sentiment: "green", notes: "" }
  );
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div style={{ background: "#161c2e", border: "1px solid #262f47", borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <input style={inputStyle} placeholder="Name" value={form.name} onChange={set("name")} />
        <input style={inputStyle} placeholder="Role" value={form.role} onChange={set("role")} />
        <input style={inputStyle} placeholder="Team" value={form.team} onChange={set("team")} />
        <select style={selectStyle} value={form.preferredChannel} onChange={set("preferredChannel")}>
          <option value="email">Preferred: Email</option>
          <option value="slack">Preferred: Slack</option>
          <option value="meeting">Preferred: Meeting</option>
        </select>
        <select style={selectStyle} value={form.influence} onChange={set("influence")}>
          <option value="high">Influence: High</option>
          <option value="medium">Influence: Medium</option>
          <option value="low">Influence: Low</option>
        </select>
        <select style={selectStyle} value={form.interest} onChange={set("interest")}>
          <option value="high">Interest: High</option>
          <option value="medium">Interest: Medium</option>
          <option value="low">Interest: Low</option>
        </select>
        <select style={selectStyle} value={form.sentiment} onChange={set("sentiment")}>
          <option value="green">Sentiment: Green</option>
          <option value="yellow">Sentiment: Yellow</option>
          <option value="red">Sentiment: Red</option>
        </select>
      </div>
      <textarea style={{ ...inputStyle, minHeight: 50, resize: "vertical" }} placeholder="Notes" value={form.notes} onChange={set("notes")} />
      <div style={{ display: "flex", gap: 6 }}>
        <button style={smallBtn("primary")} onClick={() => form.name.trim() && onSave(form)}>Save</button>
        <button style={smallBtn()} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function InfluenceInterestGrid({ stakeholders }) {
  return (
    <div style={{ background: "#161c2e", border: "1px solid #262f47", borderRadius: 10, padding: 14 }}>
      <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Influence × Interest</div>
      <div style={{ display: "grid", gridTemplateColumns: "70px repeat(3, 1fr)", gap: 4 }}>
        <div />
        {INTEREST_LEVELS.map((i) => (
          <div key={i} style={{ textAlign: "center", fontFamily: "JetBrains Mono", fontSize: 10, color: "#5d6785", textTransform: "uppercase" }}>{i} interest</div>
        ))}
        {INFLUENCE_LEVELS.map((inf) => (
          <Fragment key={inf}>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: "#5d6785", textTransform: "uppercase", display: "flex", alignItems: "center" }}>{inf}</div>
            {INTEREST_LEVELS.map((interest) => {
              const cell = stakeholders.filter((s) => s.influence === inf && s.interest === interest);
              return (
                <div key={inf + interest} style={{ background: "#0e1220", border: "1px solid #1d2540", borderRadius: 6, minHeight: 54, padding: 6, display: "flex", flexWrap: "wrap", gap: 4, alignContent: "flex-start" }}>
                  {cell.map((s) => (
                    <span key={s.id} title={`${s.name} — ${s.role}`} style={{
                      fontFamily: "Inter", fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
                      background: (SENTIMENT_COLOR[s.sentiment] || "#5d6785") + "33",
                      color: SENTIMENT_COLOR[s.sentiment] || "#9aa2ba",
                      border: `1px solid ${SENTIMENT_COLOR[s.sentiment] || "#5d6785"}`,
                    }}>
                      {s.name}
                    </span>
                  ))}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
      <div style={{ fontFamily: "Inter", fontSize: 10.5, color: "#5d6785", marginTop: 8 }}>
        High influence / high interest = manage closely. High influence / low interest = keep satisfied.
      </div>
    </div>
  );
}

function ActionResult({ result, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!result) return null;

  const text = result.type === "meeting"
    ? `${result.subject}\nProposed times: ${result.proposedTimes.join(", ")}\nAgenda:\n${result.agenda.map((a) => "- " + a).join("\n")}`
    : result.type === "email"
    ? `Subject: ${result.subject}\n\n${result.body}`
    : null;

  const copy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div style={{ background: "#fffdf7", border: "1px solid #e3ddcb", borderRadius: 8, padding: 12, marginTop: 8, fontFamily: "Inter" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontWeight: 700, fontSize: 12.5, color: "#241f13" }}>
          {result.type === "meeting" && "Draft meeting"}
          {result.type === "email" && "Draft email"}
          {result.type === "notes" && "Notes captured"}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {text && (
            <button onClick={copy} style={{ ...smallBtn(), padding: "3px 7px" }}>
              {copied ? <Check size={11} /> : <Copy size={11} />}
            </button>
          )}
          <button onClick={onClose} style={{ ...smallBtn(), padding: "3px 7px" }}><X size={11} /></button>
        </div>
      </div>

      {result.type === "meeting" && (
        <div style={{ fontSize: 12, color: "#443d29", marginTop: 6, lineHeight: 1.6 }}>
          <div><strong>{result.subject}</strong></div>
          <div>Proposed: {result.proposedTimes.join(" · ")}</div>
          <ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>
            {result.agenda.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}
      {result.type === "email" && (
        <div style={{ fontSize: 12, color: "#443d29", marginTop: 6, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
          <div><strong>{result.subject}</strong></div>
          {result.body}
        </div>
      )}
      {result.type === "notes" && (
        <div style={{ fontSize: 12, color: "#443d29", marginTop: 6, lineHeight: 1.6 }}>
          {result.actionItemsDetected > 0 ? (
            <div>{result.suggestion}</div>
          ) : (
            <div>Logged — last contact date updated.</div>
          )}
        </div>
      )}
      {(result.type === "meeting" || result.type === "email") && (
        <div style={{ fontSize: 10.5, color: "#8a8168", marginTop: 6, fontStyle: "italic" }}>{result.note}</div>
      )}
    </div>
  );
}

function NotesCaptureBox({ onSubmit, onCancel }) {
  const [text, setText] = useState("");
  return (
    <div style={{ marginTop: 8 }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'What happened / was discussed? One line per point.\nPrefix a line with "Action:" or "TODO:" to flag it as an action item.'}
        style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
      />
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <button style={smallBtn("primary")} onClick={() => text.trim() && onSubmit(text)}>Save notes</button>
        <button style={smallBtn()} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

export default function StakeholdersPanel({ programId }) {
  const [stakeholders, setStakeholders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [openAction, setOpenAction] = useState(null); // { id, type: 'meeting'|'email'|'notes'|'notes-input' }
  const [actionResults, setActionResults] = useState({}); // key `${id}:${type}` -> result

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setStakeholders(await api.listStakeholders(programId));
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => { refresh(); }, [refresh]);

  const saveNew = async (form) => {
    await api.addStakeholder(programId, form);
    setAdding(false);
    refresh();
  };

  const saveEdit = async (id, form) => {
    await api.updateStakeholder(programId, id, form);
    setEditingId(null);
    refresh();
  };

  const remove = async (id) => {
    await api.deleteStakeholder(programId, id);
    refresh();
  };

  const runAction = async (stakeholder, type) => {
    const key = `${stakeholder.id}:${type}`;
    if (type === "meeting") {
      const { draft } = await api.draftMeeting(programId, stakeholder.id);
      setActionResults((r) => ({ ...r, [key]: draft }));
    } else if (type === "email") {
      const { draft } = await api.draftEmail(programId, stakeholder.id);
      setActionResults((r) => ({ ...r, [key]: draft }));
    }
    setOpenAction({ id: stakeholder.id, type });
  };

  const submitNotes = async (stakeholder, text) => {
    const res = await api.captureNotes(programId, stakeholder.id, text);
    setActionResults((r) => ({ ...r, [`${stakeholder.id}:notes`]: { type: "notes", ...res } }));
    setOpenAction({ id: stakeholder.id, type: "notes" });
    refresh();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <InfluenceInterestGrid stakeholders={stakeholders} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "Inter", fontWeight: 700, fontSize: 13 }}>
          <Users size={14} color="#e0a444" /> Stakeholders
        </div>
        {!adding && (
          <button style={smallBtn("primary")} onClick={() => setAdding(true)}><Plus size={12} /> Add stakeholder</button>
        )}
      </div>

      {adding && <StakeholderForm onSave={saveNew} onCancel={() => setAdding(false)} />}

      {loading && <div style={{ fontFamily: "Inter", fontSize: 12, color: "#5d6785" }}>Loading...</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {stakeholders.map((s) => {
          const days = daysSince(s.lastContact);
          if (editingId === s.id) {
            return <StakeholderForm key={s.id} initial={s} onSave={(form) => saveEdit(s.id, form)} onCancel={() => setEditingId(null)} />;
          }
          return (
            <div key={s.id} style={{ background: "#161c2e", border: "1px solid #262f47", borderRadius: 10, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: SENTIMENT_COLOR[s.sentiment] || "#5d6785" }} />
                    <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 14, color: "#eef0f7" }}>{s.name}</span>
                    <span style={{ fontFamily: "Inter", fontSize: 12, color: "#9aa2ba" }}>{s.role}{s.team ? ` · ${s.team}` : ""}</span>
                  </div>
                  <div style={{ fontFamily: "JetBrains Mono", fontSize: 10.5, color: "#5d6785", marginTop: 4 }}>
                    influence: {s.influence} · interest: {s.interest} · preferred: {s.preferredChannel} ·{" "}
                    {days === null ? "no contact logged" : `last contact ${days}d ago`}
                  </div>
                  {s.notes && <div style={{ fontFamily: "Inter", fontSize: 12, color: "#9aa2ba", marginTop: 6 }}>{s.notes}</div>}
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button style={smallBtn()} onClick={() => setEditingId(s.id)}>Edit</button>
                  <button style={{ ...smallBtn(), color: "#c2483d" }} onClick={() => remove(s.id)}><Trash2 size={11} /></button>
                </div>
              </div>

              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <button style={smallBtn()} onClick={() => runAction(s, "meeting")}><Calendar size={11} /> Setup meeting</button>
                <button style={smallBtn()} onClick={() => runAction(s, "email")}><Mail size={11} /> Send email</button>
                <button style={smallBtn()} onClick={() => setOpenAction({ id: s.id, type: "notes-input" })}><NotebookPen size={11} /> Capture notes</button>
              </div>

              {openAction?.id === s.id && openAction.type === "notes-input" && (
                <NotesCaptureBox onSubmit={(text) => submitNotes(s, text)} onCancel={() => setOpenAction(null)} />
              )}
              {openAction?.id === s.id && actionResults[`${s.id}:${openAction.type}`] && (
                <ActionResult result={actionResults[`${s.id}:${openAction.type}`]} onClose={() => setOpenAction(null)} />
              )}
            </div>
          );
        })}
        {!loading && stakeholders.length === 0 && !adding && (
          <div style={{ fontFamily: "Inter", fontSize: 12.5, color: "#5d6785" }}>
            No stakeholders in this program yet — add one above.
          </div>
        )}
      </div>
    </div>
  );
}
