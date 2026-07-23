/**
 * Skill: daily-focus-digest
 * Mirrors skills/daily-focus-digest/SKILL.md — see that file for the
 * real workflow steps, gotchas, and output contract this mock stands in for.
 *
 * Mock sources: Slack, Microsoft 365 (mail + calendar), Jira (assigned tickets).
 * Real path (MOCK_MODE=false): replace runMock() below with calls to
 * callMcpTool("slack", ...), callMcpTool("ms365", ...), and
 * callMcpTool("atlassian", "search" /* JQL: assignee = currentUser() *\/, ...).
 */
import { callMcpTool } from "../mcpClient.js";

export const meta = {
  id: "daily-focus-digest",
  mode: "Observe",
  name: "Daily Focus Digest",
  tagline: "What do I have to do today?",
  desc: "Reads calendar, inbox, Slack mentions, and assigned Jira tickets. Sorts into needs-response, meetings needing prep, and deferred items.",
  triggers: ["today", "focus", "what do i have to do"],
};

function runMock() {
  const today = new Date().toDateString();
  return {
    title: `Today — ${today}`,
    meta: "Sources: Calendar, Outlook inbox, Slack mentions (4 channels), Jira (assigned)",
    sections: [
      {
        heading: "Needs response today",
        tone: "critical",
        items: [
          { text: "OneDelivery launch date — Jordan asked in DM 2h ago whether the May 22 target holds.", sub: ["Context: risk flagged Monday in the program decision log."] },
          { text: "MTR slides for Upsell Widget — Taylor sent the draft yesterday at 18:42, needs to land before Friday noon." },
          { text: "PROJ-482 (Jira) — due today, unassigned status change needed after yesterday's review." },
        ],
      },
      {
        heading: "Meetings today (2 of 4 need prep)",
        tone: "warn",
        items: [
          { text: "09:30 — 1:1 with Alex — unprepped. Run: meeting-prep for alex" },
          { text: "10:30 — OneDelivery standup — no prep needed" },
          { text: "14:00 — Sponsor sync · Jordan — unprepped. Run: meeting-prep for jordan" },
          { text: "15:30 — MTR dry run · Upsell Widget" },
        ],
      },
      {
        heading: "Deferred / no action today",
        tone: "good",
        items: [
          { text: "3 Jira tickets auto-progressed overnight — no blockers reported." },
          { text: "Weekly review due Friday — draft queued for tomorrow." },
        ],
      },
    ],
    footer: "Shall I draft a reply to Jordan's OneDelivery question first?",
  };
}

async function runReal() {
  // TODO: wire real calls once MOCK_MODE=false. Example shape:
  // const cal = await callMcpTool("ms365", "list-events", { calendarId: "primary", timeMin: startOfDay, timeMax: endOfDay });
  // const mail = await callMcpTool("ms365", "list-messages", { filter: "isRead eq false" });
  // const slack = await callMcpTool("slack", "search_messages", { query: "after:yesterday" });
  // const jira = await callMcpTool("atlassian", "search", { jql: "assignee = currentUser() AND due <= now()" });
  // ... classify and assemble into the same shape runMock() returns.
  throw new Error("runReal() not implemented yet — set MOCK_MODE=true or implement this skill's real path.");
}

export async function run({ mockMode = true } = {}) {
  return mockMode ? runMock() : runReal();
}
