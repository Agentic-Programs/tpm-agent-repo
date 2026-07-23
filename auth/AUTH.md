# Auth Setup

How to get each credential, what scope to request, and how to not leak them.
Read the "Before you connect real auth" section in the top-level README
first — it's not boilerplate, it's genuinely relevant to a couple of the
integrations below.

## General rules for every integration

- **Least privilege first.** Every skill in this repo is currently
  read-only. Don't grant write/send scopes "in case you need them later" —
  add them when a skill genuinely needs them, and note in that skill's
  `SKILL.md` why.
- **Env vars, never literals.** `.mcp.json` references `${VAR}` names, not
  actual tokens. The actual values live only in `auth/.env`, which is
  gitignored. If you ever see a raw token string in a file you're about to
  commit, stop and rotate that token — assume it's compromised.
- **Corporate systems still need a longer lead time, even without an app
  registration.** GitHub and a personal Slack workspace you can set up
  yourself in minutes. A corporate Slack workspace, a managed Microsoft
  365 tenant, or an Atlassian Cloud site behind your company's SSO may
  still gate the OAuth/device-code consent behind admin approval, even
  though you're not registering an app yourself for ms365 or Atlassian
  here. Don't leave this until the day before you want the agent working.

## GitHub

1. github.com → Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token.
2. Scope it to the specific repositories `pr-review-digest` should watch —
   not "all repositories."
3. Permissions: Pull requests → Read-only, Contents → Read-only. Nothing
   else.
4. Put the token in `GITHUB_PAT` in `auth/.env`.
5. Rotate on whatever cadence your org requires for PATs — fine-grained
   tokens support an expiration date; set one rather than "no expiration."

## Slack

1. api.slack.com/apps → Create New App → From scratch.
2. Under OAuth & Permissions, add Bot Token Scopes:
   `channels:history`, `channels:read`, `search:read` (only what
   `daily-focus-digest` actually reads — no `chat:write` unless/until you
   add a skill that posts, and even then that tool stays behind the
   confirm-before-send rule in `context/steering-identity.md`).
3. Install the app to your workspace — on a corporate workspace this is
   the step that likely needs admin approval.
4. Copy the Bot User OAuth Token (`xoxb-...`) into `SLACK_BOT_TOKEN`.
5. Invite the bot into each channel it needs to read:
   `/invite @YourAppName`.
6. Find your Team ID (workspace URL settings, or `npm run auth --setup`
   with some community servers) and put it in `SLACK_TEAM_ID`.

## Microsoft 365 (Outlook / Calendar / SharePoint / cloud Excel)

No app registration needed — the `ms365` server ships with its own
pre-registered Microsoft app. First time you use a skill that needs it:

1. The CLI agent will trigger a device-code login: a URL to open and a code
   to enter.
2. Log in with your Microsoft account in the browser. On a corporate
   tenant, this is the step where an admin-consent prompt can appear —
   that's your org's policy gate, not something you can configure around.
3. The token is cached after that; you won't need to log in again until it
   expires.

Optionally set `MS365_MCP_TENANT_ID` in `auth/.env` if you want to
restrict login to a specific org tenant rather than whichever account you
log in with.

## Atlassian (Jira + Confluence)

Also no manual token needed for normal use:

1. First use triggers a browser OAuth login to your Atlassian Cloud site
   via the `mcp-remote` proxy.
2. Log in, approve the requested scopes (read/write on Jira issues and
   Confluence pages — this agent's skills only need read, plus write
   specifically for the Jira-ticket-creation step in
   `risk-action-tracker`, which stays behind the confirm-before-write rule
   regardless of what the token itself is capable of).
3. The session is cached by the proxy after that.

If you ever need headless/CI auth instead (no browser available), the
official server also supports Atlassian API tokens — see Atlassian's own
docs for that path; it's not needed for normal interactive use.

## Local Excel / Word

No credential at all — both run against files on your own disk. The only
prerequisite is having `uv`/`uvx` installed (see `mcp/README.md`). Worth
being deliberate about *which* directory you let these servers write to,
since "no auth" also means "no permission boundary beyond the filesystem" —
point outputs at `output/`, not somewhere with unrelated sensitive files.

## Internal wiki

There's no OAuth app registration flow here because it's not a public
service — this is the one that needs a genuine judgment call, not just a
technical setup step. Two honest options:

- **Ask.** If your org has an internal automation/bot framework for tools
  like this (many do, precisely because ad-hoc scripts holding
  internal session credentials are a known risk), use it instead of
  rolling your own.
- **If you proceed anyway**, keep the credential (session cookie, personal
  API token, whatever the internal system uses) in a local secrets store
  (OS keychain / credential manager), not a plaintext file — reference it
  by path in `INTERNAL_AUTH_CREDENTIAL_PATH`, never inline. Treat it as
  higher-sensitivity than the GitHub/Slack tokens above: it's tied to your
  personal corporate identity, not a scoped app.

## If a credential leaks

Rotate it immediately at the source (GitHub token settings, Slack app
OAuth page, or your internal system's session management — Atlassian and
ms365 sessions can be revoked from your account's connected-apps settings)
— don't just delete it from `.env`. Deleting the local copy doesn't
invalidate a token that's already loose.
