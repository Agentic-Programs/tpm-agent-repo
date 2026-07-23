# TPM Agent Console — Web App

This is the real, buildable version of the console — skill cards, chat
rail, run history — split into an actual frontend + backend so there's a
concrete app to wire real integrations into, instead of a single-file
mockup.

## Run it

Two terminals:

```bash
# Terminal 1 — backend
cd webapp/backend
cp .env.example .env
npm install
npm run dev            # http://localhost:8787

# Terminal 2 — frontend
cd webapp/frontend
cp .env.example .env
npm install
npm run dev             # http://localhost:5173
```

Open http://localhost:5173. It works immediately with **zero credentials**
— `MOCK_MODE=true` (the default in `backend/.env.example`) makes every
skill return realistic canned data instantly.

## How this maps to the rest of the repo

- `webapp/backend/src/skills/*.js` — one module per skill, each mirroring
  the matching `skills/*/SKILL.md` at the repo root. The mock data in each
  file is deliberately similar to that SKILL.md's own example so the two
  stay in sync as you build.
- `webapp/backend/src/mcpClient.js` — reads `../../mcp/.mcp.json` (the
  same file `mcp/README.md` documents) and can call real MCP tools once
  you flip `MOCK_MODE=false`. Each skill module has a `runReal()` stub
  with a TODO showing roughly which tool calls go where — that's
  intentionally unfinished; filling it in per skill is the actual
  integration work.
- `webapp/backend/src/outputWriter.js` — writes to the same top-level
  `output/` directory the CLI-only workflow uses, in the same dated
  filename format. The web app and a future CLI can share one output
  folder without conflicting.
- Run history is a flat JSON file (`output/history.json`) for now — swap
  for SQLite if it needs to survive across machines or get queried, but a
  JSON file is genuinely fine for single-user local use.

## Suggested build order

1. Get one skill's `runReal()` working end to end (Daily Focus Digest has
   the smallest tool surface — Slack + Microsoft 365 only).
2. Flip `MOCK_MODE=false` only once that one skill works; the others will
   throw their "not implemented" error until you port them too, which is
   a much better failure mode than pretending they work.
3. Everything else — the chat routing, the output contract, the history
   log, the frontend — stays as-is; the port is purely inside each skill
   module.
