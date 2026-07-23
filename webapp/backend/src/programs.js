/**
 * programs.js
 *
 * Top-level "Program" hierarchy — a TPM works multiple programs at once,
 * and skills/history/stakeholders are all scoped to whichever program is
 * active. Storage is a single JSON file for simplicity; move to SQLite if
 * this ever needs to survive concurrent writers or get queried.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../data");
const PROGRAMS_PATH = path.join(DATA_DIR, "programs.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Seed data ties back to the names already used in the mock skill outputs
 *  (Jordan, Alex, Taylor, Pat) so the Stakeholders tab and the skill cards
 *  tell a consistent story out of the box. */
function seedPrograms() {
  return [
    {
      id: "onedelivery",
      name: "OneDelivery",
      description: "Launch readiness for the OneDelivery program.",
      createdAt: new Date().toISOString(),
      stakeholders: [
        { id: "jordan", name: "Jordan", role: "Sponsor", team: "Leadership", influence: "high", interest: "high", preferredChannel: "meeting", lastContact: daysAgo(6), sentiment: "yellow", notes: "Sponsor for the May 22 launch date decision." },
        { id: "alex", name: "Alex", role: "Engineering Lead", team: "OneDelivery Eng", influence: "medium", interest: "high", preferredChannel: "slack", lastContact: daysAgo(0), sentiment: "green", notes: "Owns the schema migration workstream." },
        { id: "taylor", name: "Taylor", role: "Design / PM", team: "Upsell Widget", influence: "medium", interest: "medium", preferredChannel: "email", lastContact: daysAgo(1), sentiment: "green", notes: "Driving MTR slides for Upsell Widget." },
        { id: "pat", name: "Pat", role: "Recruiting", team: "Hiring", influence: "low", interest: "medium", preferredChannel: "slack", lastContact: daysAgo(3), sentiment: "green", notes: "Coordinating hiring loop coverage." },
      ],
      meetingNotes: [],
    },
  ];
}

function readAll() {
  ensureDataDir();
  if (!fs.existsSync(PROGRAMS_PATH)) {
    const seeded = seedPrograms();
    fs.writeFileSync(PROGRAMS_PATH, JSON.stringify(seeded, null, 2));
    return seeded;
  }
  try {
    return JSON.parse(fs.readFileSync(PROGRAMS_PATH, "utf-8"));
  } catch {
    return [];
  }
}

function writeAll(programs) {
  ensureDataDir();
  fs.writeFileSync(PROGRAMS_PATH, JSON.stringify(programs, null, 2));
}

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function listPrograms() {
  return readAll().map(({ stakeholders, meetingNotes, ...meta }) => ({
    ...meta,
    stakeholderCount: stakeholders.length,
  }));
}

export function getProgram(id) {
  return readAll().find((p) => p.id === id) || null;
}

export function createProgram({ name, description = "" }) {
  if (!name || !name.trim()) throw new Error("Program name is required.");
  const programs = readAll();
  let id = slugify(name) || crypto.randomUUID().slice(0, 8);
  if (programs.some((p) => p.id === id)) id = `${id}-${crypto.randomUUID().slice(0, 4)}`;
  const program = { id, name, description, createdAt: new Date().toISOString(), stakeholders: [], meetingNotes: [] };
  programs.push(program);
  writeAll(programs);
  return program;
}

export function updateProgram(id, patch) {
  const programs = readAll();
  const idx = programs.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  programs[idx] = { ...programs[idx], ...patch, id: programs[idx].id };
  writeAll(programs);
  return programs[idx];
}

export function deleteProgram(id) {
  writeAll(readAll().filter((p) => p.id !== id));
}

export function addStakeholder(programId, data) {
  const programs = readAll();
  const program = programs.find((p) => p.id === programId);
  if (!program) throw new Error(`Unknown program "${programId}"`);
  if (!data.name || !data.name.trim()) throw new Error("Stakeholder name is required.");
  const stakeholder = {
    id: crypto.randomUUID().slice(0, 8),
    name: data.name,
    role: data.role || "",
    team: data.team || "",
    influence: data.influence || "medium",
    interest: data.interest || "medium",
    preferredChannel: data.preferredChannel || "email",
    lastContact: data.lastContact || null,
    sentiment: data.sentiment || "green",
    notes: data.notes || "",
  };
  program.stakeholders.push(stakeholder);
  writeAll(programs);
  return stakeholder;
}

export function updateStakeholder(programId, stakeholderId, patch) {
  const programs = readAll();
  const program = programs.find((p) => p.id === programId);
  if (!program) return null;
  const idx = program.stakeholders.findIndex((s) => s.id === stakeholderId);
  if (idx === -1) return null;
  program.stakeholders[idx] = { ...program.stakeholders[idx], ...patch, id: program.stakeholders[idx].id };
  writeAll(programs);
  return program.stakeholders[idx];
}

export function deleteStakeholder(programId, stakeholderId) {
  const programs = readAll();
  const program = programs.find((p) => p.id === programId);
  if (!program) return;
  program.stakeholders = program.stakeholders.filter((s) => s.id !== stakeholderId);
  writeAll(programs);
}

export function addMeetingNote(programId, stakeholderId, note) {
  const programs = readAll();
  const program = programs.find((p) => p.id === programId);
  if (!program) throw new Error(`Unknown program "${programId}"`);
  const entry = { id: crypto.randomUUID().slice(0, 8), stakeholderId, ...note, createdAt: new Date().toISOString() };
  program.meetingNotes.unshift(entry);
  writeAll(programs);
  return entry;
}
