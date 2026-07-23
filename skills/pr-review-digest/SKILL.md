---
name: pr-review-digest
mode: Observe
cadence: daily
mcp_servers: [github]
---

# GitHub PR / Code Review Digest

## When to use

- "Who has tasks slipping right now?", "PR digest", "what's blocked on
  review" — anything about the state of open pull requests across the
  repos this program depends on.
- This is an Observe skill: it reports state, it doesn't make judgment
  calls about priority the way `risk-action-tracker` does. If a stuck PR
  is program-blocking enough to need escalation, that's a hand-off to
  `risk-action-tracker` (log it as a risk), not something this skill
  decides on its own.

## Context

**Inputs:**
1. `github` MCP — open PRs across the repos configured for this program
   (see `tracked_repos` below), their review status, and CI check status.
   Read-only: `pull_requests:read`, `contents:read` are all this skill
   needs.

**Configuration this skill needs from you:** a list of tracked repos.
Keep that list in this skill's own front matter or a small
`tracked-repos.json` alongside it once you have more than a couple — don't
hardcode repo names inside the workflow steps below, since that list will
change more often than the skill logic does.

**What "done" looks like:** three buckets by urgency — blocking a
workstream, stale, healthy — not a flat list of every open PR.

## Workflow steps

1. List open PRs across all tracked repos.
2. For each, pull: age (days open), review state (approved / changes
   requested / no reviews), and CI check status.
3. Classify "blocking a workstream": zero reviews after >2 business days
   on a repo tagged as critical-path, OR failing CI checks on a PR that's
   already merged-adjacent (targets a branch other PRs depend on).
4. Classify "stale": approved but unmerged >3 days, or any PR untouched
   (no comments, no new commits) >5 days regardless of review state.
5. Everything else is "healthy" — reviewed within a reasonable SLA, no
   flags. Don't list every healthy PR individually; a count is enough.
6. Suggest a Slack ping to the relevant owners for blocking items only —
   draft it, don't send it.

## Gotchas

- **"Critical-path" repo tagging is a judgment call you make once, not
  something this skill infers.** Don't guess which repos matter most from
  commit volume or repo name — ask, or maintain the tracked-repos list
  explicitly.
- **A PR with zero reviews isn't automatically a problem** — check
  whether it was opened as a draft first; drafts aren't awaiting review.
- **CI flakiness looks identical to a real failing check from the API.**
  If a check has failed and then passed on retry within the same PR
  recently, don't report it as currently failing — check the latest run,
  not just "has this ever failed."
- **Rate limits.** Scanning many repos daily can hit GitHub API rate
  limits on a personal token faster than expected — if the digest starts
  coming back partial, that's the first thing to check, not a bug in the
  classification logic.

## Output contract

Write to `output/pr-review-digest-YYYYMMDD.md`, same shared schema:

```markdown
# PR Digest — <n> tracked repos

**Scanned:** <timestamp> · <n> open PRs · <n> flagged

## 🔴 Blocking a workstream
- <PR> <repo> — <why it's blocking>

## 🟡 Stale (>3 days, no activity)
- <PR> <repo> — <detail>

## 🟢 Healthy
- <n> other open PRs reviewed within SLA, no action needed.

<draft ping offer for blocking items, if any>
```
