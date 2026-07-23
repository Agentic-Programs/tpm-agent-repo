---
name: meeting-prep
mode: Manage
cadence: on-demand, tied to calendar
mcp_servers: [ms365, slack, atlassian, memory]
---

# Meeting Prep / Briefing

## When to use

- "Prep me for my 1:1 with X", "brief me on my sponsor meeting", "what do
  I need to know before the Y sync" — anything naming a specific meeting
  or person.
- Also triggered as a suggested follow-up from `daily-focus-digest` when
  it flags a meeting as needing prep.
- Not for a recurring status rollup across many threads — that's
  `weekly-status-report`. This skill is scoped to one meeting.

## Context

**Inputs:**
1. `memory` MCP — anything stored from previous `meeting-prep` runs with
   the same attendee/topic (open items, prior commitments). This is what
   makes prep useful on the second and third run, not just the first.
2. `ms365` — the calendar event itself (attendees, description,
   any linked doc), plus recent email thread with the same attendee.
3. `slack` — recent channel/DM activity involving the attendee, last
   ~14 days, filtered to the relevant project if the event title or
   memory gives one.
4. `atlassian` — Confluence pages recently edited by, or mentioning, the
   attendee or the relevant project (CQL search). This is background
   context only — surface it as a pointer ("relevant page: X, edited N
   days ago"), don't dump the page content into the brief.

**What "done" looks like:** a one-page brief the human could skim in the
elevator on the way to the meeting — not a transcript of everything said
since last time.

## Workflow steps

1. Identify the attendee(s) and topic from the calendar event. If
   ambiguous (generic title, multiple possible people), ask rather than
   guess — a wrong brief is worse than no brief.
2. Check `memory` for anything stored from the last prep on this
   attendee/topic — specifically, open items that were never marked
   resolved.
3. Pull recent email + Slack activity involving the attendee since the
   last prep (or last 14 days if this is the first prep). Do a quick
   Confluence search for the same window — surface at most 1-2 relevant
   pages, not every match.
4. Classify what's new: separate "still open from last time" from
   "genuinely new since then" — don't re-surface something already
   resolved.
5. Draft 2-4 suggested talking points, ordered by what's most likely to
   need the human's input or decision, not just most recent.
6. Write the output, then **write back to `memory`** what was open at the
   end of this brief, so the next run can pick up the thread.
7. Ask if there's anything to add before finalizing — this is a one-page
   doc, not a final report, so a quick correction pass is expected.

## Gotchas

- **Memory drift.** If `memory` has stale items marked open that were
  actually resolved in a channel the agent doesn't have access to, it'll
  keep resurfacing them. If the human says "that's done," update memory
  immediately rather than letting it recur next time.
- **Don't brief on assumptions about org structure.** If you can't tell
  from calendar/Slack whether someone is the attendee's manager, peer, or
  report, don't guess it in the brief — it changes tone and is an easy
  place to be embarrassingly wrong.
- **1:1s often reference things from far outside the visible data window**
  (a conversation from months ago). Don't imply completeness — if memory
  only goes back to when this skill started being used, say so rather
  than presenting a partial history as the full picture.

## Output contract

Write to `output/meeting-prep-<attendee-slug>-YYYYMMDD.md`, same shared
schema as `daily-focus-digest`:

```markdown
# Briefing — <meeting title> with <attendee>

**Prepped:** <timestamp> · Last synced <n> days ago

## 🟡 Open from last time
- <item>

## 🔵 New since last 1:1
- <item>

## 🟢 Suggested talking points
1. <point>

<one line inviting a correction before finalizing>
```
