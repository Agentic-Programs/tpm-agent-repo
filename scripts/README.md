# scripts/

Custom bridges for sources with no MCP server — a common gap for
internal-only systems. Nothing lives here yet; this documents the pattern
to follow when you add something.

## The 3-tier fallback pattern

Try each tier in order, fall through on failure:

1. **Official API**, if one exists and you can get a token for it. Fastest,
   most stable, least likely to break when the source system's UI changes.
2. **Browser automation** (Playwright), for internal pages behind
   corporate SSO that don't expose an API — drive a real logged-in browser
   session rather than replaying raw HTTP requests.
3. **Last-resort scrape/CDP**, only when 1 and 2 aren't viable — treat this
   tier as fragile by design and expect to maintain it more often.

## Contract every bridge script should follow

Regardless of which tier it uses, a bridge script should:

- Take structured args in, return structured JSON out (not raw
  HTML/markdown) — let the skill's prompt do the formatting into the
  shared output contract, don't bake formatting into the scraper.
- Fail loudly and specifically. `raise` with what broke (auth expired?
  selector changed? rate limited?) rather than returning empty/partial
  data silently — silent partial data is worse than an error, because it
  looks like a complete answer.
- Never write credentials to disk in plaintext. Read from the path in
  `auth/.env`, don't hardcode.
- Live in its own subdirectory here (`scripts/<source-name>/`) with its
  own README covering what tier it uses and why, and what breaks first
  when the source system changes.

## Known gaps as of this writing

- **Internal wiki / knowledge base** — if it has no public API, needs
  tier 2 or 3.
- **Internal data platform / warehouse** — likely tier 1 if you can get a
  service credential, otherwise tier 2.
- **Internal ticketing system** — check for an internal API first before
  assuming you need browser automation.

None of the five skills in `skills/` currently depend on these — they're
listed here so the gap is documented, not hidden, for whenever you extend
the skill set.
