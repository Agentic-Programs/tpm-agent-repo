import "dotenv/config";
import express from "express";
import cors from "cors";
import { skillRegistry, findSkillById, routeMessageToSkill } from "./skills/index.js";
import { writeSkillOutput } from "./outputWriter.js";
import { getHistory, addHistoryEntry } from "./history.js";
import {
  listPrograms,
  getProgram,
  createProgram,
  updateProgram,
  deleteProgram,
  addStakeholder,
  updateStakeholder,
  deleteStakeholder,
  addMeetingNote,
} from "./programs.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8787;
const MOCK_MODE = (process.env.MOCK_MODE ?? "true") !== "false";

function publicSkillMeta(s) {
  const { run, ...meta } = s;
  return meta;
}

function requireProgram(req, res) {
  const program = getProgram(req.params.pid);
  if (!program) {
    res.status(404).json({ error: `Unknown program "${req.params.pid}"` });
    return null;
  }
  return program;
}

function requireStakeholder(program, sid, res) {
  const stakeholder = program.stakeholders.find((s) => s.id === sid);
  if (!stakeholder) {
    res.status(404).json({ error: `Unknown stakeholder "${sid}" in program "${program.id}"` });
    return null;
  }
  return stakeholder;
}

// ---- health ----
app.get("/api/health", (_req, res) => res.json({ ok: true, mockMode: MOCK_MODE }));

// ---- programs ----
app.get("/api/programs", (_req, res) => res.json(listPrograms()));

app.post("/api/programs", (req, res) => {
  try {
    res.status(201).json(createProgram(req.body || {}));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/programs/:pid", (req, res) => {
  const program = requireProgram(req, res);
  if (program) res.json(program);
});

app.patch("/api/programs/:pid", (req, res) => {
  const updated = updateProgram(req.params.pid, req.body || {});
  if (!updated) return res.status(404).json({ error: `Unknown program "${req.params.pid}"` });
  res.json(updated);
});

app.delete("/api/programs/:pid", (req, res) => {
  deleteProgram(req.params.pid);
  res.status(204).end();
});

// ---- stakeholders ----
app.get("/api/programs/:pid/stakeholders", (req, res) => {
  const program = requireProgram(req, res);
  if (program) res.json(program.stakeholders);
});

app.post("/api/programs/:pid/stakeholders", (req, res) => {
  try {
    res.status(201).json(addStakeholder(req.params.pid, req.body || {}));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch("/api/programs/:pid/stakeholders/:sid", (req, res) => {
  const updated = updateStakeholder(req.params.pid, req.params.sid, req.body || {});
  if (!updated) return res.status(404).json({ error: "Unknown program or stakeholder" });
  res.json(updated);
});

app.delete("/api/programs/:pid/stakeholders/:sid", (req, res) => {
  deleteStakeholder(req.params.pid, req.params.sid);
  res.status(204).end();
});

// ---- communication actions (draft only — see context/steering-identity.md) ----
function nextBusinessDaySlots() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  if (d.getDay() === 6) d.setDate(d.getDate() + 2); // Sat -> Mon
  if (d.getDay() === 0) d.setDate(d.getDate() + 1); // Sun -> Mon
  const dateStr = d.toISOString().slice(0, 10);
  return [`${dateStr} 09:30`, `${dateStr} 14:00`, `${dateStr} 16:00`];
}

app.post("/api/programs/:pid/stakeholders/:sid/draft-meeting", (req, res) => {
  const program = requireProgram(req, res);
  if (!program) return;
  const stakeholder = requireStakeholder(program, req.params.sid, res);
  if (!stakeholder) return;

  res.json({
    draft: {
      type: "meeting",
      to: stakeholder.name,
      subject: `${program.name} check-in with ${stakeholder.name}`,
      proposedTimes: nextBusinessDaySlots(),
      agenda: [
        stakeholder.lastContact
          ? `Status since last contact (${stakeholder.lastContact})`
          : "Introductory context-setting — no prior contact logged",
        `Open items on ${program.name}`,
        "Anything blocking on their side",
      ],
      note: "Draft only — nothing is sent. Wiring mcpClient.js to ms365's create-event tool is what would actually send this.",
    },
  });
});

app.post("/api/programs/:pid/stakeholders/:sid/draft-email", (req, res) => {
  const program = requireProgram(req, res);
  if (!program) return;
  const stakeholder = requireStakeholder(program, req.params.sid, res);
  if (!stakeholder) return;

  const body = [
    `Hi ${stakeholder.name},`,
    "",
    stakeholder.lastContact
      ? `Wanted to check in on ${program.name} — it's been a bit since we last connected (${stakeholder.lastContact}).`
      : `Wanted to introduce a regular check-in on ${program.name}.`,
    "",
    "A few things on my radar for you:",
    "- [fill in — this is a draft, not a summary of real activity]",
    "",
    "Let me know if a quick call would be easier than email.",
  ].join("\n");

  res.json({
    draft: {
      type: "email",
      to: stakeholder.name,
      subject: `${program.name} check-in`,
      body,
      note: "Draft only — nothing is sent. Wiring mcpClient.js to ms365's send-mail tool is what would actually send this.",
    },
  });
});

app.post("/api/programs/:pid/stakeholders/:sid/capture-notes", (req, res) => {
  const program = requireProgram(req, res);
  if (!program) return;
  const stakeholder = requireStakeholder(program, req.params.sid, res);
  if (!stakeholder) return;

  const notes = (req.body?.notes || "").trim();
  if (!notes) return res.status(400).json({ error: "notes is required" });

  const lines = notes.split("\n").map((l) => l.trim()).filter(Boolean);
  const actionItems = lines.filter((l) => /^(action|todo|follow[- ]?up)\s*[:\-]/i.test(l));
  const general = lines.filter((l) => !actionItems.includes(l));

  const entry = addMeetingNote(program.id, stakeholder.id, { raw: notes, actionItems, general });
  const today = new Date().toISOString().slice(0, 10);
  updateStakeholder(program.id, stakeholder.id, { lastContact: today });

  res.json({
    entry,
    actionItemsDetected: actionItems.length,
    suggestion:
      actionItems.length > 0
        ? `${actionItems.length} action item${actionItems.length > 1 ? "s" : ""} detected — worth logging in the Action Item & Risk Tracker next time you run it.`
        : null,
  });
});

// ---- skills (program-scoped) ----
app.get("/api/programs/:pid/skills", (req, res) => {
  const program = requireProgram(req, res);
  if (program) res.json(skillRegistry.map(publicSkillMeta));
});

app.post("/api/programs/:pid/skills/:id/run", async (req, res) => {
  const program = requireProgram(req, res);
  if (!program) return;
  const skill = findSkillById(req.params.id);
  if (!skill) return res.status(404).json({ error: `Unknown skill "${req.params.id}"` });

  try {
    const output = await skill.run({ mockMode: MOCK_MODE, stakeholders: program.stakeholders, ...req.body });
    const filepath = writeSkillOutput(program.id, skill.id, output);
    const entry = {
      skillId: skill.id,
      skillName: skill.name,
      mode: skill.mode,
      source: req.body?.source || "dashboard",
      time: new Date().toISOString(),
      outputFile: filepath,
    };
    addHistoryEntry(program.id, entry);
    res.json({ output, entry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/programs/:pid/history", (req, res) => {
  const program = requireProgram(req, res);
  if (program) res.json(getHistory(program.id));
});

app.post("/api/programs/:pid/chat", async (req, res) => {
  const program = requireProgram(req, res);
  if (!program) return;
  const message = (req.body?.message || "").trim();
  if (!message) return res.status(400).json({ error: "message is required" });

  const skill = routeMessageToSkill(message);
  if (!skill) {
    return res.json({
      matched: false,
      reply:
        "I don't have a skill wired up for that yet — here's what I can do: " +
        skillRegistry.map((s) => `"${s.tagline}"`).join(", ") + ".",
    });
  }

  try {
    const output = await skill.run({ mockMode: MOCK_MODE, stakeholders: program.stakeholders });
    const filepath = writeSkillOutput(program.id, skill.id, output);
    const entry = {
      skillId: skill.id,
      skillName: skill.name,
      mode: skill.mode,
      source: "chat",
      time: new Date().toISOString(),
      outputFile: filepath,
    };
    addHistoryEntry(program.id, entry);
    res.json({ matched: true, skillId: skill.id, skillName: skill.name, output, entry });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`tpm-agent backend listening on http://localhost:${PORT} (MOCK_MODE=${MOCK_MODE})`);
});
