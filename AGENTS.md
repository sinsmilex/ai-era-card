# AI Era Card — project context for AI assistants

Read this before touching the codebase. It captures product decisions and
their reasoning, not just "what" — the "why" is what keeps future changes
consistent with the original scope.

## What this is

A share-card generator for AI tool usage. Not a profile, not a dashboard,
not the "Token City" world-map idea from the original concept doc — this is
the deliberately narrow validation slice: `npx aieracard` parses your local
AI-tool usage, shows you exactly what it's about to upload, and gives you a
**permanent URL** to a stats card (dark theme, generative "city blocks"
mosaic seeded from your numbers) that unfurls nicely when shared.

**Market context that shaped the scope:** local usage stats are already
owned by `ccusage`; the once-a-year "wrapped" format is already owned by
Anthropic's own Claude Reflect; team analytics is owned by WakaTime. The
open niche was "shareable snapshot, any day, permanent link" — not another
dashboard. Don't add a dashboard.

**Explicitly deferred to phase 2** (do not build unless asked): the map/world
visualization, user accounts, snapshot history per person, team features,
monetization (subscriptions, cosmetics). The current architecture already
supports phase 2 without rework — every snapshot's full payload sits in
Postgres, so a future `/map` page just reads the same rows differently.

## Architecture

pnpm monorepo:

- `packages/schema` — the **privacy contract**, enforced in code, not just
  policy. `snapshotPayloadSchema` (zod) is the literal set of fields that
  are allowed to leave a user's machine: token counts, cost totals, active
  days/streaks, canonical model ids, an optional self-typed handle. It
  cannot represent prompts, code, file paths, or project names — there is
  no field for them. Both the CLI and the API route validate against this
  same schema, so drift between "what we promise" and "what we accept" is
  structurally impossible.
- `apps/cli` (`aieracard` on npm) — collects usage from three sources, all
  parsed **locally**:
  - **Claude Code**: reads `~/.claude/projects/**/*.jsonl` directly. No
    cost field in the logs — cost is computed from a static per-model
    pricing table (`src/pricing/modelPricing.ts`, mirrors ccusage's
    numbers). Streaming can rewrite the same message across multiple JSONL
    lines — the collector dedupes on `messageId:requestId`.
  - **Cursor**: the interesting one. There's no public API for individual
    (non-Enterprise) accounts. `src/collectors/cursorApi.ts` calls Cursor's
    own dashboard endpoints (`cursor.com/api/dashboard/get-aggregated-usage-events`,
    `get-filtered-usage-events`) — **undocumented, can break without
    notice**. Auth is Cursor's own `WorkosCursorSessionToken` web-session
    cookie, resolved automatically by scanning Cursor's local
    `state.vscdb` for a JWT with `type === "session"` (not just
    longest-lived — there's also a long-expiry non-session token in there
    that looks tempting but 401s). The all-time query has to be split at
    two hardcoded dates (2025-08-01, 2026-05-14) because Cursor's backend
    can't serve a single window spanning both — verified empirically, the
    API error message names the exact split points. `userId` in the
    request body causes a 500; omit it. CSV export
    (`src/collectors/cursorCsv.ts`) is the documented fallback, used
    automatically if the API path throws.
  - **OpenRouter**: official REST API, `/credits` (all-time spend) +
    `/activity` (30-day windowed token/model breakdown — the payload marks
    this `windowDays: 30` explicitly rather than implying all-time).
  - The CLI always shows the exact JSON before uploading and requires
    confirmation (`--dry-run` skips upload entirely; `--force` skips the
    confirmation prompt for scripting).
- `apps/web` — Next.js. `POST /api/snapshots` validates + rate-limits +
  inserts; `/s/[slug]` renders the card; `opengraph-image.tsx` is a second,
  independent Satori-based render of the same data (Satori only supports a
  flexbox CSS subset, so it can't reuse the DOM component) — the OG image
  *is* the viral mechanic, since that's what X/Slack/Discord actually
  render on unfurl. Both renderers share `components/cardTheme.ts` so they
  don't visually drift apart.
- Storage: Postgres (Neon, via Vercel Marketplace) when `DATABASE_URL` is
  set, else a local JSON-file store (`apps/web/lib/db/fileStore.ts`) — lets
  the whole flow run with zero external services for local dev.
- Rate limiting: Upstash Redis when configured, else an in-memory fallback
  (resets on cold start — fine for dev, not yet wired for prod as of this
  writing).

## Deployed — fully live as of 2026-07-19

- Production: **https://ai-era-card.vercel.app** — git-connected to
  `github.com/sinsmilex/ai-era-card` (`main` branch), every push to `main`
  auto-deploys.
- CLI: **`npx aieracard`** is live on the public npm registry
  (`aieracard@0.1.0`), verified end-to-end from a clean machine — default
  `--endpoint` already points at production.
- Vercel project `ai-era-card`, team `sin-smile`, root directory `apps/web`.
- Neon Postgres attached via Vercel Marketplace (`DATABASE_URL`).
- Upstash KV attached via Vercel Marketplace (`KV_REST_API_URL` /
  `KV_REST_API_TOKEN` — **note the Marketplace names these `KV_REST_API_*`,
  not `UPSTASH_REDIS_REST_*`**; `lib/ratelimit.ts` accepts either name).
  Rate limiting is real (Redis-backed sliding window) in production now,
  not the in-memory fallback.
- First real card (Claude Code + Cursor combined, all-time):
  https://ai-era-card.vercel.app/s/mmi5GrqvJt

**Two agents may be working on this repo concurrently** (this file has
been edited by more than one AI session already — check `git log` for
recent context before assuming you have the full picture). Keep commits
small and scoped; re-read this file's "Deployed" section before starting
work, since it's updated as things ship, and treat it as more current than
your own memory of a previous session.

## Known gaps / next up

- **OpenRouter collector unverified against a live account** — written
  against the documented API shape but never run against a real key (the
  Cursor collector needed real-world correction after being written from
  docs alone — split-date windows, dropping `userId`, session-vs-other JWT
  selection — none of which was in the docs; treat OpenRouter with the
  same suspicion until someone runs `--dry-run` with a real
  `OPENROUTER_API_KEY`).
- **No CI.** Nothing runs typecheck/build on push or PR — a broken commit
  to `main` auto-deploys straight to production. Cheapest fix: a GitHub
  Actions workflow running `pnpm -r build` (covers `tsc --noEmit` for
  schema/cli plus `next build` for web).
- **No automated tests.** The JSONL/CSV parsers were validated by hand
  against real logs and a live account, not by a test suite — a future
  refactor has no safety net. `apps/cli/src/collectors/*` are the highest-
  value targets (pure functions, easy to fixture).
- **Undocumented Cursor endpoints can break silently.** No monitoring; if
  Cursor changes `get-aggregated-usage-events`/`get-filtered-usage-events`,
  the CLI just falls back to CSV without anyone finding out until a user
  reports it. Not launch-blocking, but worth a cheap daily check eventually.
- **No custom domain, no analytics, no error tracking (Sentry etc.)** —
  fine pre-launch, worth revisiting once real users show up.
- **Phase 2 (map/world) not started** — deliberately. Don't start it
  before the card format itself has been validated by real shares.

## Conventions worth preserving

- Every number that reaches a user (CLI output, card, OG image) is
  formatted through `fmtTokens`/`fmtUsd`/etc. — never raw floats.
- The mosaic (`apps/web/lib/mosaic.ts`) is deterministic: same payload →
  same pattern, via a seeded PRNG from the aggregate stats. Don't swap in
  `Math.random()` — the point is a stats-derived "territory," and it's the
  seed of the eventual phase-2 map.
- Cost fields are `number | null`, never coerced to `0` — a `null` cost
  means "we don't know," and displaying `$0` would misrepresent that.
- Anything that could carry PII/content (project names, file paths,
  prompts) simply has no field in the schema — enforce new privacy
  guarantees the same way, not with a runtime "don't log this" comment.
