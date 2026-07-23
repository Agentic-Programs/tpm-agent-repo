/**
 * Skill: weekly-status-report
 * Mirrors skills/weekly-status-report/SKILL.md.
 *
 * Rolls up this week's other skill outputs. Real path additionally offers
 * to export to Word (local office-word MCP) and/or publish a draft to
 * Confluence (Atlassian MCP) — both stay behind the confirm-before-write
 * rule in context/steering-identity.md.
 */
import { callMcpTool } from "../mcpClient.js";

export const meta = {
  id: "weekly-status-report",
  mode: "Manage",
  name: "Weekly Status Report / WBR",
  tagline: "Summarize my week so far",
  desc: "Rolls up program health, metrics, risks, and asks. Can export to Word or draft a Confluence page.",
  triggers: ["status", "wbr", "weekly report", "summarize my week"],
};

function runMock() {
  const date = new Date().toISOString().slice(0, 10);
  return {
    title: `Weekly Status — OneDelivery · ${date}`,
    meta: "Period: Mon–Fri (in progress) · Rolled up from 5 skill outputs + manual review",
    sections: [
      {
        heading: "Program health: Yellow",
        tone: "warn",
        items: [
          { text: "Launch date (May 22) at risk pending sponsor confirmation." },
          { text: "Two workstreams (OD2, Upsell Widget) trending green; one (schema migration) trending yellow." },
        ],
      },
      {
        heading: "Wins this week",
        tone: "good",
        items: [
          { text: "MTR dry run completed a day ahead of schedule." },
          { text: "3 backlog tickets closed with zero reopens." },
        ],
      },
      {
        heading: "Risks & asks",
        tone: "critical",
        items: [
          { text: "Need sponsor sign-off on May 22 target by Wednesday to keep vendor booking on track." },
          { text: "Schema change needs a cross-team review before it can merge." },
        ],
      },
    ],
    footer: "Export to Word, draft a Confluence page, or hold for one more review pass?",
  };
}

async function runReal() {
  // TODO: wire real calls once MOCK_MODE=false. Publish/export steps
  // (callMcpTool("word-document-server", "create_document", ...) or
  // callMcpTool("atlassian", "create_page", ...)) must stay confirm-gated —
  // draft only, never auto-publish.
  throw new Error("runReal() not implemented yet — set MOCK_MODE=true or implement this skill's real path.");
}

export async function run({ mockMode = true } = {}) {
  return mockMode ? runMock() : runReal();
}
