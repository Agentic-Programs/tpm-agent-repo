/**
 * Skill: risk-action-tracker
 * Mirrors skills/risk-action-tracker/SKILL.md.
 *
 * Real path syncs stalled items to Jira (Atlassian MCP) as the system of
 * record, and can export a snapshot to a local Excel workbook for offline
 * review. Both are suggested, not automatic — see steering-identity.md.
 */
import { callMcpTool } from "../mcpClient.js";

export const meta = {
  id: "risk-action-tracker",
  mode: "React",
  name: "Action Item & Risk Tracker",
  tagline: "Top 3 launch risks this week",
  desc: "Maintains a live risk/action register. Can sync stalled items to Jira and export a snapshot to Excel.",
  triggers: ["risk", "blocker", "action item", "log a risk", "log this decision"],
};

function runMock() {
  return {
    title: "Risk & Action Register — OneDelivery",
    meta: `Snapshot ${new Date().toISOString().slice(0, 16).replace("T", " ")} · 7 open items, 2 stalled >5 days`,
    sections: [
      {
        heading: "Stalled — needs escalation",
        tone: "critical",
        items: [
          { text: "R-014 · Launch date confirmation — owner: Jordan · open 6 days · no update since Monday.", sub: ["Suggested Jira ticket: PROJ-491 (not yet created)"] },
          { text: "A-031 · Cross-team schema review — owner: Alex's team · open 5 days · blocked on reviewer availability." },
        ],
      },
      {
        heading: "On track",
        tone: "good",
        items: [
          { text: "A-028 · Vendor booking hold — owner: you · due Wed · confirmed in progress." },
          { text: "R-011 · Upsell Widget latency risk — owner: Taylor · mitigation shipped, monitoring." },
        ],
      },
      {
        heading: "New this week",
        tone: "info",
        items: [{ text: "R-016 · Hiring loop coverage gap flagged by Pat — needs owner assignment." }],
      },
    ],
    footer: "Create Jira tickets for the 2 stalled items, and/or export this snapshot to Excel?",
  };
}

async function runReal() {
  // TODO: wire real calls once MOCK_MODE=false.
  // Jira sync: callMcpTool("atlassian", "create_issue", { fields: { project, summary, issuetype, description } })
  // Excel export: callMcpTool("excel", "write_data_to_excel", { filepath, sheet_name, data })
  throw new Error("runReal() not implemented yet — set MOCK_MODE=true or implement this skill's real path.");
}

export async function run({ mockMode = true } = {}) {
  return mockMode ? runMock() : runReal();
}
