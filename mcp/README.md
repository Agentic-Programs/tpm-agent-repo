# MCP Servers

What each entry in `.mcp.json` does, why it's there, and how to install it.
Verified against current docs as of July 2026 — MCP server packages move
fast, so if a command below fails, run `claude mcp add --help` or check the
linked source before assuming this file is wrong.

Copy `.mcp.json` into your project root (`cp mcp/.mcp.json ./.mcp.json`) once
you've filled in `auth/.env`, or register servers individually with the
`claude mcp add` commands below — either approach works, the file is just
faster once you have more than one or two.

---

## github — PR / code review digest

**What it's for:** `pr-review-digest` skill. Read-only use here (list PRs,
reviews, checks) even though the server can also write.

**Server:** GitHub's official remote MCP server — replaced Anthropic's
archived reference implementation. No local install needed.

**Install:**
```bash
claude mcp add --transport http github https://api.githubcopilot.com/mcp/ \
  --header "Authorization: Bearer ${GITHUB_PAT}"
```

**Auth:** GitHub Personal Access Token (fine-grained, repo:read +
pull_requests:read scope only — see `auth/AUTH.md`).

**Gotcha:** remote OAuth support for GitHub is limited in many MCP clients
as of this writing — use PAT auth, not the OAuth flow, even though the
server supports it in other clients.

---

## slack — daily focus digest, meeting prep signal

**What it's for:** `daily-focus-digest` and `meeting-prep` skills — reading
mentions, DMs, and channel threads.

**Server:** community-maintained `@slack/mcp-server` npm package. (Slack's
own first-party MCP server also exists but is aimed at a hosted Connectors
UI, not stdio-based MCP clients — if your setup supports it, using Slack's
official OAuth connector is the more maintained path and worth checking
first.)

**Install:** no separate install — `npx` fetches it on first run per the
`.mcp.json` entry above.

**Auth:** Slack Bot Token (`xoxb-...`) from a Slack app you create at
api.slack.com/apps, scoped to the specific channels this agent needs to
read (see `auth/AUTH.md`). The bot must be invited into each channel —
`/invite @YourAppName` — it can't read a channel's history otherwise.

**Gotcha:** enterprise Slack workspaces (which is almost certainly what
you're on at work) often restrict app creation to workspace admins —
you may need IT/admin approval before this server can authenticate at all.
Budget for that lead time.

---

## ms365 — calendar, mail, SharePoint, cloud Excel

**What it's for:** `daily-focus-digest` (calendar + inbox), `meeting-prep`
(event details, attendees, SharePoint context), `risk-action-tracker`
(cloud Excel export target), and the web app's stakeholder communication
actions (drafting meetings/emails from the Stakeholders tab).

**Server:** `@softeria/ms-365-mcp-server` — a single well-maintained
package covering Outlook, Calendar, OneDrive, Excel, SharePoint, and Teams
through the Microsoft Graph API, with 200+ tools. This replaces needing a
separate hand-rolled Graph API server per service — one server, one auth
flow, covers mail/calendar/SharePoint/Excel all at once.

**Install:** nothing to install ahead of time — `npx` fetches it per the
`.mcp.json` entry above. First run triggers a device-code login (open a
URL, enter a code) using the package's own pre-registered Microsoft app —
**you do not need to register your own Azure AD app** for this, unlike
most Graph API integrations.

**Auth:** device-code flow on first use; the tool caches the token after
that. `--org-mode` (already in the config above) is required for
SharePoint/Teams access — without it, only personal mail/calendar/OneDrive
work.

**Gotcha:** on a managed corporate tenant, your org's admin may still need
to have consented to this app before *any* user can complete the
device-code login for work-account scopes (SharePoint especially) — if
login fails with a consent/approval error, that's your tenant's policy,
not a config mistake on your end. `--preset` flags (e.g. `--preset mail`)
narrow which of the 200+ tools load, worth doing once you know which
Graph surfaces each skill actually needs, to keep context usage down.

**On write scopes:** everything above only needs read permissions today
— the web app's "Setup meeting" and "Send email" actions currently
generate a draft (subject, body, proposed times) and stop there, they
don't call ms365 at all yet. Wiring them to actually create a draft
calendar event or draft email would need `Calendars.ReadWrite` /
`Mail.ReadWrite` respectively — deliberately **not** `Mail.Send`, since
creating a draft the human still has to hit send on is a meaningfully
smaller blast radius than granting send access outright.

---

## atlassian — Jira & Confluence

**What it's for:** `risk-action-tracker` (sync stalled risks/actions to
Jira as tickets), `weekly-status-report` and `meeting-prep` (pull/publish
Confluence pages), `daily-focus-digest` (assigned Jira tickets due today).

**Server:** Atlassian's own official remote MCP server — covers Jira,
Confluence, Jira Service Management, Bitbucket, and Compass through one
connection. Accessed via the `mcp-remote` proxy since it's a remote
server, same pattern as the GitHub entry above but with `npx mcp-remote`
doing the connection instead of a direct `http` block.

**Install:** nothing ahead of time — `npx` fetches `mcp-remote` on first
run per the config above.

**Auth:** OAuth 2.1 — first run opens a browser for you to log into your
Atlassian Cloud site. No token to generate or store in `.env` for normal
use; the proxy caches the session. (API token auth is also supported for
headless/CI use if you need it later — see Atlassian's own docs if so.)

**Gotcha:** the endpoint is `/v1/mcp` (Streamable HTTP), not `/v1/sse` —
the older SSE endpoint stopped being supported after June 30, 2026.
Access is scoped to whatever the logged-in user can already see in Jira
and Confluence — this server can't see more than your own account can.

---

## excel — local spreadsheet read/write

**What it's for:** `risk-action-tracker`'s Excel export — a local
snapshot of the register that doesn't require anything to be in
SharePoint/OneDrive first.

**Server:** `excel-mcp-server` (Python/openpyxl-based) — creates, reads,
and writes `.xlsx` files on disk, no Microsoft account or cloud storage
involved.

**Install:** requires `uv`/`uvx` (Python package runner) — `pipx install
uv` or see astral.sh/uv if you don't have it. Then nothing further;
`uvx excel-mcp-server` per the config above fetches and runs it.

**Auth:** none — purely local file access, scoped to whatever directory
you point it at.

---

## word-document-server — local Word doc generation

**What it's for:** `weekly-status-report`'s Word export — turning the WBR
into an actual `.docx` a leader can open, without needing SharePoint.

**Server:** `office-word-mcp-server` — creates and edits `.docx` files
with real formatting (headings, styled text, lists), not just plain text
dumped into a document.

**Install:** same `uv`/`uvx` prerequisite as the excel server above.

**Auth:** none — local file access only.

---

## memory — cross-session continuity

**What it's for:** letting the agent recall context between sessions
without you re-explaining ("what did Alex and I discuss last time" should
work without you pasting last week's notes back in). This is what your
deck called out as the difference between a skill and a document — a
skill persists.

**Server:** `@modelcontextprotocol/server-memory` — official reference
server, knowledge-graph based.

**Install:** no separate install — fetched via `npx` per the config above.

**Auth:** none — local-only, no external service.

---

## Not yet wired: proprietary internal data platforms

Jira, Confluence, SharePoint, and local Excel/Word are now covered above.
What's still genuinely uncovered is anything proprietary to a specific
employer — an internal data warehouse, a homegrown ticketing system that
isn't Jira, that kind of thing. See `scripts/README.md` for the fallback
pattern to build a bridge for whatever that turns out to be at your next
org, if anything.
