---
name: stakeholder-mapping
mode: Manage
cadence: maintained continuously, reviewed weekly
mcp_servers: [memory]
scope: per-program
---

# Stakeholder Mapping

## When to use

- "Add a stakeholder", "who are the stakeholders on program X", "map out
  who I need to manage on this program" — anything about *who* is
  involved in a program, as opposed to *what's happening* (that's the
  other five skills).
- This skill is different in kind from the others: it's not a "run it,
  get a dated digest" skill. It's a persistent record that other skills
  read from — most directly `communication-strategy`, which can't
  function without it.
- Reference implementation: the web app's Stakeholders tab
  (`webapp/backend/src/programs.js` + `webapp/frontend/src/components/StakeholdersPanel.jsx`)
  already implements this as a full CRUD store scoped per program. This
  SKILL.md documents the same behavior for the conversational/CLI
  path, so both surfaces stay consistent.

## Context

**Data model, per stakeholder:**
- `name`, `role`, `team`
- `influence` (high/medium/low) — how much their opinion moves outcomes
- `interest` (high/medium/low) — how much they care about this program
- `preferredChannel` (email/slack/meeting)
- `lastContact` (date) — updated automatically whenever
  `communication-strategy`'s capture-notes action is used, or manually
- `sentiment` (green/yellow/red) — the TPM's own read of the relationship
- `notes` — free text

**Storage:** one record set per program, not global — a stakeholder on
Program A and a same-named person's involvement in Program B are tracked
separately, because their influence/interest/cadence can genuinely differ
by program even if it's literally the same human.

**What "done" looks like:** every stakeholder who actually matters to the
program's success is captured with at minimum a name, role, and an
influence/interest estimate — a stakeholder map with no influence/interest
data isn't actionable, just a contact list.

## Workflow steps

**Adding a stakeholder:**
1. Capture name and role at minimum. Push for influence/interest
   estimates even if the human's first instinct is to skip them — that's
   the data `communication-strategy` actually needs to be useful.
2. Default `preferredChannel` to whatever's most natural for the
   relationship (a sponsor → meeting, a peer eng lead → Slack) rather than
   defaulting everyone to email.
3. Leave `lastContact` blank if there's no real basis for a date — don't
   guess a plausible-sounding one, since `communication-strategy` will
   treat a blank as "never contacted, flag immediately" which is the
   correct conservative default.

**Reviewing the map:**
1. Periodically (weekly is reasonable) ask whether anyone's
   influence/interest has shifted — a stakeholder who was low-interest at
   program kickoff can become high-interest once their team is affected.
   Stale influence/interest data quietly breaks `communication-strategy`'s
   prioritization.
2. Surface the influence × interest grid (2 axes, 3 levels each) as a
   quick visual gut-check — clusters and gaps are more visible in the grid
   than in a list.

## Gotchas

- **Influence and interest are not the same axis as sentiment.** A
  high-influence stakeholder can have green sentiment and a low-influence
  one can have red — don't conflate "important" with "happy," they're
  independent dimensions and both matter.
- **Don't silently downgrade someone's influence because they've gone
  quiet.** Quiet and low-influence look similar in the data but mean
  different things — check with the human before changing an
  influence/interest rating based on inferred behavior rather than an
  explicit reassessment.
- **A stakeholder map that's only updated when someone's added is stale
  by week two.** The map's value comes from `lastContact` staying current,
  which mostly happens as a side effect of `communication-strategy`'s
  capture-notes action, not from manual upkeep — if that action isn't
  being used, the map will drift.

## Output contract

This skill doesn't produce a dated digest the way the other five do —
it maintains live state. If asked to export it, use the same shared
schema so it's consistent with everything else:

```markdown
# Stakeholder Map — <program>

**Snapshot:** <timestamp> · <n> stakeholders

## High influence
- <name> (<role>) — interest: <level> · preferred: <channel> · last contact: <date or "never">

## Medium influence
- ...

## Low influence
- ...
```
