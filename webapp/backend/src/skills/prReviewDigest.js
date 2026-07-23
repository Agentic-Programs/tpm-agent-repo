/**
 * Skill: pr-review-digest
 * Mirrors skills/pr-review-digest/SKILL.md.
 * Real path: callMcpTool("github", "list_pull_requests", ...) per tracked repo.
 */
import { callMcpTool } from "../mcpClient.js";

export const meta = {
  id: "pr-review-digest",
  mode: "Observe",
  name: "GitHub PR / Code Review Digest",
  tagline: "Who has tasks slipping right now?",
  desc: "Scans open PRs across tracked repos — flags stale reviews, failing checks, and PRs blocking a workstream.",
  triggers: ["pr", "pull request", "github", "code review", "slipping"],
};

function runMock() {
  return {
    title: "PR Digest — 3 tracked repos",
    meta: `Scanned ${new Date().toISOString().slice(0, 16).replace("T", " ")} · 11 open PRs · 3 flagged`,
    sections: [
      {
        heading: "Blocking a workstream",
        tone: "critical",
        items: [
          { text: "#482 schema-migration-service — open 4 days, 0 reviews, blocks the schema change." },
          { text: "#217 onedelivery-api — failing integration checks since last night's merge to main." },
        ],
      },
      {
        heading: "Stale (>3 days, no activity)",
        tone: "warn",
        items: [{ text: "#356 upsell-widget-fe — approved but unmerged for 3 days." }],
      },
      {
        heading: "Healthy",
        tone: "good",
        items: [{ text: "8 other open PRs reviewed within SLA, no action needed." }],
      },
    ],
    footer: "Ping the owners of #482 and #217 in Slack?",
  };
}

async function runReal() {
  // TODO: wire real calls once MOCK_MODE=false.
  throw new Error("runReal() not implemented yet — set MOCK_MODE=true or implement this skill's real path.");
}

export async function run({ mockMode = true } = {}) {
  return mockMode ? runMock() : runReal();
}
