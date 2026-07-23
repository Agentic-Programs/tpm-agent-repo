import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, "../../../output");

function historyPath(programId) {
  return path.join(OUTPUT_DIR, programId, "history.json");
}

function readAll(programId) {
  const p = historyPath(programId);
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch {
    return [];
  }
}

export function getHistory(programId) {
  return readAll(programId);
}

export function addHistoryEntry(programId, entry) {
  const dir = path.join(OUTPUT_DIR, programId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const all = readAll(programId);
  all.unshift(entry);
  fs.writeFileSync(historyPath(programId), JSON.stringify(all.slice(0, 100), null, 2), "utf-8");
  return all;
}
