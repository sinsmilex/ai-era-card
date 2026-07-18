# AI Era Card

Your AI usage — tokens, streaks, models — on one permanent, shareable card.
The CLI parses usage logs **locally** and uploads **aggregate numbers only**.

## Structure

- `packages/schema` — zod schema of the upload payload. This file is the
  privacy contract: it cannot represent prompts, code, paths, or project names.
- `apps/cli` — `npx aieracard`. Collects Claude Code (local JSONL), Cursor
  (all-time via your own cursor.com session, CSV export as fallback),
  OpenRouter (API key); previews the exact JSON, uploads on confirmation,
  prints a permanent card URL.
- `apps/web` — Next.js app: `POST /api/snapshots`, card page `/s/[slug]`,
  dynamic OG image (the share unfurl), `/privacy`.

## Develop

```sh
pnpm install
pnpm --filter aieracard build
pnpm --filter web dev            # http://localhost:3000, stores snapshots in apps/web/.data
node apps/cli/dist/index.js --dry-run          # parse only, upload nothing
node apps/cli/dist/index.js --endpoint http://localhost:3000
```

## Deploy

- **Web**: Vercel, root directory `apps/web`. Attach Neon Postgres
  (`DATABASE_URL`) and Upstash KV via the Vercel Marketplace — the
  Marketplace names the vars `KV_REST_API_URL` / `KV_REST_API_TOKEN`
  (not the raw Upstash `UPSTASH_REDIS_REST_*` names; `lib/ratelimit.ts`
  accepts either); set `SNAPSHOT_IP_SALT` (random string) and
  `NEXT_PUBLIC_APP_URL`. Without `DATABASE_URL` the app falls back to a
  local file store (dev only). Deployed at https://ai-era-card.vercel.app,
  git-connected to `main` for auto-deploy.
- **CLI**: published as `aieracard` on npm — `npm publish` from `apps/cli`
  after bumping the version. Default `--endpoint` in `apps/cli/src/index.ts`
  already points at production.

## Test

```sh
pnpm test
```

## Non-goals (MVP)

No accounts, no snapshot history per person, no map/world visualization
(phase 2 — reads the same snapshots), no teams, no payments. The Cursor
collector reads a session JWT from Cursor's local `state.vscdb` for
auth only — it does not parse chat content from that DB.

