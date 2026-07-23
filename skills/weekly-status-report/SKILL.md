---
name: weekly-status-report
mode: Manage
cadence: weekly
mcp_servers: [slack, ms365, github, atlassian, word-document-server]
depends_on_outputs: [daily-focus-digest, risk-action-tracker, pr-review-digest]
---

# Weekly Status Report / WBR

## When to use

- "Summarize my week so far", "draft my WBR", "weekly status" — usually
  Wednesday–Friday, per the weekly rhythm.
- This is a **rollup** skill — it reads the outputs other skills already
  produced this week rather than re-deriving everything from raw sources.
  If those outputs don't exist yet for this week, run them first (or this
  skill should trigger them itself — see step 1).

## Context

**Inputs:**
1. This week's dated outputs from `daily-focus-digest`,
   `risk-action-tracker`, and `pr-review-digest` in `output/` — the
   producer/consumer loop from your own weekly-rhythm diagram: outputs
   from earlier skills become inputs here.
2. Prior week's `weekly-status-report` output, for continuity (what was
   Yellow last week, is it still Yellow?).
3. Any manual notes the human adds directly in the session — this skill
   should always leave room for "actually, add this" before finalizing.

**What "done" looks like:** the standard WBR shape — program health,
wins, risks/asks — skimmable by a leader who wasn't in any of this week's
meetings.

## Workflow steps

1. Check `output/` for this week's dated files from the three dependency
   skills. If any are missing, run them first rather than guessing their
   content.
2. Determine overall program health (Green/Yellow/Red) from the risk
   tracker's stalled-items count and the PR digest's blocking-items count
   — don't just carry forward last week's color without checking it
   against this week's data.
3. Pull 2-4 genuine wins — completed items, ahead-of-schedule milestones —
   not routine "no action needed" items padded to look like progress.
4. Pull the risks/asks directly from this week's `risk-action-tracker`
   output, specifically the "stalled — needs escalation" section — don't
   re-derive risk severity independently, that tracker is the source of
   truth for risk state.
5. Compare to last week's report: anything that was Yellow/Red last week
   and is unchanged this week should be called out explicitly as
   "unchanged" — silence on a recurring risk reads as if it resolved.
6. Draft the report, then ask which of three things to do with it: export
   to a Word doc (`word-document-server`), draft a Confluence page
   (`atlassian` — draft only, don't publish/share it), or hold for another
   review pass. **Never auto-export or auto-publish**, per the steering
   rules — all three destinations wait for an explicit yes.

## Gotchas

- **Don't let this skill regenerate data other skills already own.**
  If `risk-action-tracker`'s output says a risk is stalled, report it as
  stalled — don't independently re-assess severity here, that creates two
  sources of truth that can disagree.
- **A Yellow that's been Yellow for three weeks straight is a different
  story than a Yellow that just turned Yellow.** Always check the
  trend against last week's report, not just this week's snapshot.
- **Leadership reads WBRs skimming for red flags first.** Risks/asks
  should never be the last section visually deprioritized — keep it
  prominent even though it's drafted last in the workflow above.

## Output contract

Write to `output/weekly-status-report-YYYYMMDD.md`, same shared schema:

```markdown
# Weekly Status — <program> · <date>

**Period:** <Mon–Fri, in progress or complete> · Rolled up from <n> skill outputs + manual review

## Program health: <Green|Yellow|Red>
- <supporting detail, including trend vs last week>

## 🟢 Wins this week
- <item>

## 🔴 Risks & asks
- <item, pulled from risk-action-tracker>

<publish or hold — ask, don't assume>
```

Word export and Confluence draft, if requested, are separate write
actions the human confirms individually — this markdown file in
`output/` is written unconditionally either way, so there's always a
local copy regardless of what happens downstream.
