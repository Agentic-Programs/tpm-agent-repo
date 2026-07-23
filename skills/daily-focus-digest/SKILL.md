---
name: daily-focus-digest
mode: Observe
cadence: daily
mcp_servers: [slack, ms365, atlassian]
---

# Daily Focus Digest

## When to use

- The human asks anything shaped like "what do I have to do today?",
  "what's on my plate?", "morning brief", or opens a session with no other
  instruction at the start of the day.
- Do NOT use for a specific meeting's prep — that's `meeting-prep`. This
  skill is the triage pass across everything; `meeting-prep` is the deep
  dive on one meeting once triage has flagged it.

## Context

**Inputs, in priority order:**
1. Calendar — today's events, via `ms365` (Graph API `Calendars.Read`).
2. Inbox — unread + flagged mail from the last 24h, via `ms365`
   (`Mail.Read`). Read subject/sender/snippet only; don't open full bodies
   unless triage genuinely can't classify without more context.
3. Slack — mentions and DMs from the last 24h across channels the bot has
   been invited to, via `slack` (`search:read`, `channels:history`).
4. Jira — tickets assigned to the human that are due today or overdue,
   via `atlassian` (JQL: `assignee = currentUser() AND due <= now() AND
   status != Done`). Read-only for this skill — status changes belong to
   a human decision, not an automatic digest.

**What "done" looks like:** three buckets — Needs response today, Meetings
needing prep, Deferred/no action — plus a single suggested next action at
the end, not a summary paragraph restating the buckets.

## Workflow steps

1. Pull today's calendar events. For each, check whether there's evidence
   in Slack/email that prep is still outstanding (no notes/doc referenced
   in the last 3 days) — mark those "needs prep."
2. Pull unread Slack mentions and DMs from the last 24h. Classify each:
   does it contain a question directed at the human, an ask with a
   deadline, or an FYI with no action needed?
3. Pull flagged/unread email from the last 24h, same classification.
4. Pull Jira tickets assigned to the human, due today or overdue. Treat
   an overdue ticket as "needs response," not "deferred" — silence on an
   overdue ticket is exactly the kind of thing this digest exists to
   surface.
5. Group into the three buckets. Within "Needs response today," order by
   how long it's been waiting, oldest first — that's usually the real
   priority signal, more than who sent it.
6. For each "needs prep" meeting, note what a follow-up `meeting-prep` run
   would need (attendee, topic) so the human can trigger it directly if
   they want it.
7. Write the output file, then ask one direct question about the single
   highest-priority item — don't ask a generic "anything else?".

## Gotchas

- **Time zone drift.** Calendar events from a shared/team calendar may be
  stored in a different time zone than the human's local one — always
  render times in the human's local zone, and say which zone explicitly
  if there's any chance of ambiguity (e.g., a sponsor in another region).
- **Slack search API is eventually consistent.** A message posted in the
  last few minutes may not show up in `search:read` yet — don't treat an
  empty result in the last 5 minutes as "nothing new," treat it as "not
  yet indexed."
- **Don't over-classify FYIs as action items.** A channel post that
  mentions the human's name without a direct question is usually not a
  "needs response" — err toward Deferred unless there's a real ask.
- **Corporate calendars often have back-to-back meetings with zero gaps**
  — flag if there's literally no time free before a "needs prep" meeting,
  since that changes what a reasonable next action even is.

## Output contract

Matches the shared schema across all five skills (see any other
`SKILL.md` for the same block) — `title`, `meta`, `sections[]` each with
`heading` / `tone` (`critical` | `warn` | `info` | `good`) / `items[]`,
and an optional `footer` with the one suggested next action.

Write to `output/daily-focus-digest-YYYYMMDD.md`:

```markdown
# Today — <Weekday, Month D, YYYY> (<timezone>)

**Sources:** Calendar, Outlook inbox, Slack mentions (<n> channels), Jira (assigned)

## 🔴 Needs response today (<n>)
1. <item> — <who, when, why it's waiting>

## 🟡 Meetings today (<n> of <total> need prep)
- <time> — <meeting> — [needs prep: run meeting-prep for <attendee>] | [no prep needed]

## 🟢 Deferred / no action today
- <item>

<one direct question about the top item>
```
