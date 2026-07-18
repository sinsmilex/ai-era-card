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

## Deployed

- Production: **https://ai-era-card.vercel.app**
- Vercel project `ai-era-card`, team `sin-smile`, root directory `apps/web`
- Neon Postgres attached via Vercel Marketplace integration (`DATABASE_URL`
  env var wired automatically)
- First real card (Claude Code + Cursor combined, all-time):
  https://ai-era-card.vercel.app/s/mmi5GrqvJt

## Known gaps / in-progress work

- **Upstash Redis not yet installed** — rate limiting is still the
  in-memory fallback in production. Marketplace terms need accepting by
  the account owner (one click, browser-only — an AI agent can't do this,
  it's an account-identity consent action) before `vercel install
  upstash/upstash-kv` can proceed.
- **CLI not yet published to npm.** Name `aieracard` is confirmed
  available. Blocked on `npm login` succeeding — this specific environment
  hits a reproducible npm CLI bug (`Exit handler never called!`) when
  `npm login` runs without a real TTY, so the OAuth browser flow can't
  complete this way. Workaround in progress: an npm **Automation access
  token** (npmjs.com → Access Tokens → Generate New Token → Automation),
  used non-interactively instead of the login flow.
- **git repo initialized, one commit made, not pushed anywhere** — no
  GitHub remote yet, so there's no code backup and Vercel deploys are
  manual (`vercel deploy --prod`) rather than git-triggered.
- **OpenRouter collector unverified against a live account** — written
  against the documented API shape but never run against a real key (the
  Cursor collector needed real-world correction after being written from
  docs alone, so treat OpenRouter with the same suspicion until tested).

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
