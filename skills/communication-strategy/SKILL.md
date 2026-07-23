---
name: communication-strategy
mode: Manage
cadence: on-demand + weekly rollup
mcp_servers: [ms365, memory]
depends_on: [stakeholder-mapping]
scope: per-program
---

# Communication Strategy

## When to use

- "Who do I need to reach out to?", "communication strategy", "who's
  overdue for a check-in" — a synthesis pass across the stakeholder map,
  not a per-person action by itself.
- Requires `stakeholder-mapping` to have real data — with zero
  stakeholders logged, this skill has nothing to synthesize (see Gotchas).
- The three concrete actions this skill coordinates — setup meeting, send
  email, capture meeting notes — are documented here but triggered
  per-stakeholder, not as part of the digest run itself. In the web app
  they're buttons on each stakeholder row; conversationally, the human
  can ask for any of them by name ("draft an email to Jordan").

## Context

**Inputs:**
1. `stakeholder-mapping`'s current data for the active program — name,
   influence, interest, `lastContact`, `preferredChannel`.
2. `memory` — prior `communication-strategy` runs, so "who's overdue" can
   note whether someone's been overdue for one week or four, not just
   flag them fresh each time.

**The prioritization logic** (already implemented for real — not mocked
— in `webapp/backend/src/skills/communicationStrategy.js`, since it only
needs stakeholder data the human already entered, not an external tool
call):

- Compute days since `lastContact` (a blank `lastContact` counts as
  infinitely overdue).
- Compare against a threshold that scales with influence: high-influence
  stakeholders go overdue after 5 days of silence, medium after 10, low
  after 20. The reasoning: a quiet sponsor is a bigger problem, faster,
  than a quiet low-influence stakeholder.
- Bucket into Overdue / Due soon / On cadence.

**What "done" looks like:** a short list of who needs outreach this week,
ordered by actual urgency — not a status report on every stakeholder
regardless of whether they need anything right now.

## Workflow steps

**Running the digest:**
1. Pull current stakeholder data for the active program.
2. Apply the influence-scaled staleness thresholds above.
3. Group into the three buckets, most urgent first.
4. Offer the three per-stakeholder actions as the natural next step for
   anyone in "Overdue" — don't just report the problem, point at the fix.

**Setup meeting (per stakeholder, on request):**
1. Draft a subject, proposed times, and a short agenda seeded from
   context that's already known (program name, days since last contact).
2. Show the draft. **Do not create a real calendar event or send an
   invite** — this stays a draft until the human explicitly says to send
   it, and sending it is a `ms365` write-scope action not yet wired in
   the reference implementation (see `mcp/README.md`'s ms365 section).

**Send email (per stakeholder, on request):**
1. Draft a subject and body, templated from what's known about the
   relationship (last contact date, program context).
2. Same rule as meetings: draft only, never auto-send.

**Capture meeting notes (per stakeholder, after a real conversation):**
1. Take freeform notes as input.
2. Split into general notes vs. detected action items — a simple heuristic
   works fine here (a line starting with "Action:", "TODO:", or
   "Follow-up:" is an action item; everything else is general context).
   Don't over-engineer this into full NLP; the human can always re-tag
   something manually.
3. Update the stakeholder's `lastContact` to today — this is what keeps
   the whole system's staleness math honest going forward.
4. If action items were detected, point at `risk-action-tracker` as
   where they belong rather than silently discarding them or inventing a
   third place to store them.

## Gotchas

- **This skill is only as good as the stakeholder data behind it.** An
  empty or stale stakeholder map produces a technically-correct but
  useless "no one's overdue" — that's a data problem, not a logic
  problem, and the fix is nudging the human back to `stakeholder-mapping`,
  not tuning the thresholds.
- **The staleness thresholds are a starting default, not policy.** A
  sponsor going quiet two days before a launch decision is a different
  situation than the same gap mid-program — use judgment on genuinely
  time-critical windows rather than applying the threshold mechanically,
  same principle as `risk-action-tracker`'s staleness rule.
- **Don't let "capture notes" become a dumping ground that never gets
  acted on.** If the same action item keeps appearing uncaptured in
  `risk-action-tracker` after being flagged here, that's a sign the
  hand-off between the two skills isn't actually happening, not that the
  detection is failing.
- **Drafting is not sending, even after the human approves wording.**
  Approval of the text is not the same as authorization to transmit it —
  keep those as two distinct steps per `context/steering-identity.md`.

## Output contract

Write to `output/<program>/communication-strategy-YYYYMMDD.md`, same
shared schema as the other five skills:

```markdown
# Communication Strategy

**Snapshot:** <timestamp> · <n> stakeholders tracked

## 🔴 Overdue — reach out now
- <name> (<role>) — last contact <n>d ago · influence: <level> · preferred: <channel>

## 🟡 Due soon
- <name> (<role>) — ...

## 🟢 On cadence
- <name> (<role>) — ...

<offer: draft a meeting, draft an email, or capture notes for anyone overdue>
```
