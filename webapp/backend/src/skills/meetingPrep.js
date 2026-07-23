/**
 * Skill: meeting-prep
 * Mirrors skills/meeting-prep/SKILL.md.
 *
 * Mock sources: Microsoft 365 (calendar+mail), Slack, Confluence (context
 * docs), local memory of prior preps.
 * Real path: callMcpTool("ms365", ...), callMcpTool("slack", ...),
 * callMcpTool("atlassian", "search" /* CQL against Confluence *\/, ...).
 */
import { callMcpTool } from "../mcpClient.js";

export const meta = {
  id: "meeting-prep",
  mode: "Manage",
  name: "Meeting Prep / Briefing",
  tagline: "Prep me for my 1:1 with Alex",
  desc: "Pulls prior notes, open action items, and relevant Confluence pages into a one-page brief.",
  triggers: ["prep", "1:1", "brief", "meeting"],
};

function runMock({ attendee = "Alex" } = {}) {
  return {
    title: `Briefing — 1:1 with ${attendee}`,
    meta: `Prepped ${new Date().toISOString().slice(0, 16).replace("T", " ")} · Last synced 3 days ago`,
    sections: [
      {
        heading: "Open from last time",
        tone: "warn",
        items: [
          { text: `${attendee} owed a call on the OD2 dependency — not yet closed out.` },
          { text: `You owed feedback on ${attendee}'s design doc — sent Tuesday, unconfirmed read.` },
        ],
      },
      {
        heading: "New since last 1:1",
        tone: "info",
        items: [
          { text: `${attendee} posted in #onedelivery about a schema change that touches two other workstreams.` },
          { text: "Relevant Confluence page: \"OneDelivery Design Notes\" — last edited 4 days ago." },
        ],
      },
      {
        heading: "Suggested talking points",
        tone: "good",
        items: [
          { text: "Close the loop on the OD2 dependency call." },
          { text: "Ask about bandwidth impact of the absorbed tickets on Q3 commitments." },
          { text: "Flag the May 22 date conversation with Jordan so they aren't blindsided." },
        ],
      },
    ],
    footer: "Add anything else before I finalize the one-pager?",
  };
}

async function runReal({ attendee } = {}) {
  // TODO: wire real calls once MOCK_MODE=false.
  throw new Error("runReal() not implemented yet — set MOCK_MODE=true or implement this skill's real path.");
}

export async function run({ mockMode = true, attendee } = {}) {
  return mockMode ? runMock({ attendee }) : runReal({ attendee });
}
