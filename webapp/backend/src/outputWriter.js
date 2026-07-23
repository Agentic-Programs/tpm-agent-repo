import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, "../../../output");

function dateStamp() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

export function outputToMarkdown(output) {
  let t = `# ${output.title}\n\n**${output.meta}**\n\n`;
  for (const s of output.sections) {
    t += `## ${s.heading}\n`;
    for (const item of s.items) {
      t += `- ${item.text}\n`;
      for (const sub of item.sub || []) t += `    - ${sub}\n`;
    }
    t += "\n";
  }
  if (output.footer) t += `> ${output.footer}\n`;
  return t;
}

/** Writes output/<programId>/<skillId>-YYYYMMDD.md, returns the path written. */
export function writeSkillOutput(programId, skillId, output) {
  const dir = path.join(OUTPUT_DIR, programId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filename = `${skillId}-${dateStamp()}.md`;
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, outputToMarkdown(output), "utf-8");
  return filepath;
}
