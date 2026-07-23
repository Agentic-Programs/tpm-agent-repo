---
name: risk-action-tracker
mode: React
cadence: on-demand + weekly rollup
mcp_servers: [slack, ms365, atlassian, excel, memory]
---

# Action Item & Risk Tracker

## When to use

- "Log a risk on program X", "top 3 launch risks this week", "log this
  decision", "what's slipping" — both writes (logging a new item) and
  reads (status of the existing register).
- This is the one skill in the set classified `React` rather than
  `Observe`/`Manage` — logging a risk or escalating a stalled item is
  closer to a decision than a synthesis, so treat new entries and status
  changes as things worth a beat of judgment, not pure mechanical rollup.

## Context

**Inputs:**
1. `memory` MCP — the register itself lives here as the source of truth
   across sessions (risk/action ID, owner, status, due date, opened date)
   **for items that don't have a Jira ticket yet**. Once an item is synced
   to Jira (see below), Jira becomes the system of record for that item's
   status — memory keeps a pointer to the ticket, not a competing status.
   This skill reads and writes to the same memory store `meeting-prep`
   uses, but under its own namespace — don't let the two collide.
2. `slack` / `ms365` — used only to check for evidence of recent
   movement on an existing item (has the owner posted an update?), not to
   discover new risks from scratch — new risks come from the human
   explicitly logging them, or from another skill flagging one (e.g.
   `pr-review-digest` finding a PR blocking a workstream).
3. `atlassian` — for items synced to Jira, pull current status directly
   from the ticket rather than inferring it from Slack activity.
4. `excel` — used only when the human asks for a snapshot export; not
   part of the regular read/write loop.

**What "done" looks like:** a register where every open item has a clear
owner and a status that's actually current, sorted so the stalled items
are impossible to miss.

## Workflow steps

**Logging a new item:**
1. Capture: description, owner, program/workstream, and — critically —
   ask for the owner if it wasn't given. An item with no owner is not
   actually tracked, it's just written down.
2. Assign an ID (`R-###` for risks, `A-###` for action items, incrementing
   from the last one in memory).
3. Write it to `memory` with status "new," opened date = today.
4. Confirm back to the human what was logged, including the ID, so they
   can reference it later.

**Status check / rollup:**
1. Pull all open items from `memory`.
2. For each, check days-open. Anything open >5 days with no logged update
   gets flagged "stalled — needs escalation," regardless of how it's
   currently marked — staleness is itself the signal, not a separate
   judgment call.
3. Where possible, check Slack/email for owner activity that might update
   status (e.g., owner posted "shipped the fix") — if found, note it as a
   suggested status change and ask before updating memory, don't
   auto-resolve.
4. Group into stalled / on-track / new-this-week, stalled first.
5. For genuinely stalled items, draft (don't send) an escalation note as
   a suggested next action.

**Syncing to Jira (on request, or offered for stalled items):**
1. For an item without a linked ticket, draft the Jira issue (project,
   summary, description, issue type) and show it before creating anything
   — this is a write action and stays behind the confirm-before-write
   rule.
2. On confirmation, create the ticket via `atlassian` and write the
   ticket key back into that item's `memory` entry as its new status
   pointer.
3. From then on, status checks for that item read from Jira, not from
   inferred Slack activity — don't keep both a memory-status and a
   Jira-status for the same item.

**Exporting to Excel (on request only):**
1. Assemble the current register (all sections, not just stalled) into
   rows: ID, description, owner, status, opened date, days open.
2. Write via `excel` to a local file — confirm the filename/path first
   rather than guessing where the human wants it.

## Gotchas

- **An item with a vague owner ("the team") isn't actually assigned.**
  Push for a named individual at log time — it's much harder to fix after
  the fact than to ask once up front.
- **"5 days stalled" is a default, not a universal threshold** — a risk
  two days before a launch date is stale a lot faster than that. Use
  judgment on genuinely time-critical items rather than applying the
  threshold mechanically.
- **Don't silently resolve items.** Even when Slack activity strongly
  suggests something shipped, confirm before marking resolved — a
  register that's wrong in the optimistic direction is more dangerous
  than one that's a little behind.
- **This skill's memory namespace and `meeting-prep`'s must stay
  separate** — a stalled program risk and an open item from a 1:1 are
  different kinds of "open," and conflating them will make both outputs
  noisy.
- **Once an item has a Jira ticket, memory's copy of its status goes
  stale the moment someone updates the ticket directly in Jira** (not
  through this skill). Always re-pull from Jira for synced items rather
  than trusting a cached status in memory — the ticket key in memory is a
  pointer, not a cache of the current state.

## Output contract

Write to `output/risk-action-tracker-YYYYMMDD.md`, same shared schema:

```markdown
# Risk & Action Register — <program>

**Snapshot:** <timestamp> · <n> open items, <n> stalled >5 days

## 🔴 Stalled — needs escalation
- <ID> · <description> — owner: <name> · open <n> days · <last update or "no update">

## 🟢 On track
- <ID> · <description> — owner: <name> · <status>

## 🔵 New this week
- <ID> · <description> — needs owner assignment if blank

<offer: create Jira tickets for stalled items and/or export this snapshot to Excel>
```
