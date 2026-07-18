# AI Era Card

Your AI usage — tokens, streaks, models — on one permanent, shareable card.
The CLI parses usage logs **locally** and uploads **aggregate numbers only**.

## Structure

- `packages/schema` — zod schema of the upload payload. This file is the
  privacy contract: it cannot represent prompts, code, paths, or project names.
- `apps/cli` — `npx aieracard`. Collects Claude Code (local JSONL),
  OpenRouter (API key), Cursor (dashboard CSV export); previews the exact
  JSON, uploads on confirmation, prints a permanent card URL.
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
  (`DATABASE_URL`) and Upstash Redis (`UPSTASH_REDIS_REST_URL`,
  `UPSTASH_REDIS_REST_TOKEN`) via the Vercel Marketplace; set
  `SNAPSHOT_IP_SALT` (random string) and `NEXT_PUBLIC_APP_URL`.
  Without `DATABASE_URL` the app falls back to a local file store (dev only).
- **CLI**: set the production URL as the default endpoint in
  `apps/cli/src/index.ts`, then `npm publish` from `apps/cli`
  (check the name `aieracard` is still free on npm).

## Non-goals (MVP)

No accounts, no snapshot history per person, no map/world visualization
(phase 2 — reads the same snapshots), no teams, no payments, no Cursor
SQLite parsing (its local DB contains chat content; the dashboard CSV does not).
