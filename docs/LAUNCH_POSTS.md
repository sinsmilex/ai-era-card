# Launch post drafts (Phase 0 distribution)

Three drafts, one per channel, in recommended firing order. Rules that
shaped them: lead with the artifact (the card), not the product; the
1.4B-token founder card is the demo; privacy is the second beat, always;
no marketing adjectives on Reddit/HN — builder voice only. Space launches
a few days apart so each gets its own referer signal in /api/stats.

Before posting, swap `mmi5GrqvJt` for the freshest card if regenerated.

---

## 1. X/Twitter thread (fire first — cheapest, fastest signal)

**Tweet 1**

> I've burned 1.4 billion tokens building with AI since 2024.
>
> Claude Code + Cursor + Codex, 222 active days, 20 models, $737 of
> compute.
>
> One command turned all of it into a card:
>
> npx aieracard
>
> https://ai-era-card.vercel.app/s/mmi5GrqvJt

**Tweet 2**

> How it works: the CLI reads your local usage logs (Claude Code, Codex),
> your own Cursor session, optionally OpenRouter.
>
> Everything is parsed on your machine. It shows you the exact JSON before
> anything uploads — aggregate numbers only. Never prompts, never code,
> never file paths.

**Tweet 3**

> You get a permanent URL that unfurls into your card anywhere — X, Slack,
> Discord, Telegram.
>
> Plus a GitHub README badge and a Stories-format export.
>
> Ranks are earned from real usage: Foundation → Studio → Foundry → Tower
> → Citadel → Arcology → Landmark → Apex.

**Tweet 4**

> Open source, no account needed, free.
>
> Curious what rank you land at — post your card below 👇
>
> https://github.com/sinsmilex/ai-era-card

---

## 2. r/ClaudeAI (also fits r/cursor with s/Claude Code/Cursor/ in the hook)

**Title options (pick one):**

- I turned my Claude Code usage history into a shareable card — 1.4B
  tokens since 2024, apparently
- Made a CLI that turns your Claude Code / Cursor / Codex usage into a
  permanent share card (all parsing is local)

**Body:**

> Everyone here has seen (or posted) ccusage screenshots. I kept doing it
> too, so I built the prettier version: `npx aieracard` reads your local
> Claude Code JSONL logs (plus Cursor via your own session, Codex, and
> OpenRouter if you have it), and gives you a permanent link to a stats
> card — tokens, active days, streak, models, estimated compute.
>
> Mine came out to 1.4B tokens / 222 active days:
> https://ai-era-card.vercel.app/s/mmi5GrqvJt
>
> Privacy, since that's the obvious question: parsing happens entirely on
> your machine. The CLI prints the exact JSON payload and asks before
> uploading — it's aggregate numbers and model names only. The schema
> literally has no fields for prompts, code, or file paths (it's a zod
> schema, open source, so you can check). `--dry-run` never uploads
> anything.
>
> Free, no account. Would love to see what your numbers look like — and
> whether anyone here outranks Tower.

---

## 3. Show HN (fire last, after the card has survived contact with X/Reddit)

**Title:**

> Show HN: Turn your AI coding usage into a permanent share card (local
> parsing)

**Text:**

> I noticed people keep screenshotting their ccusage output to flex token
> counts, so I built the shareable version.
>
> `npx aieracard` parses AI-tool usage locally — Claude Code and Codex
> from their JSONL logs, Cursor through your own cursor.com session
> (their dashboard API, since individual accounts have no public API),
> OpenRouter by key — and uploads only aggregate numbers after showing
> you the exact payload. You get a permanent URL with an OG image, a
> GitHub README badge (SVG), and a Stories-format export.
>
> The privacy contract is enforced structurally: the upload schema has no
> fields capable of carrying prompts, code, or paths, and the same zod
> schema validates on both the CLI and the API side.
>
> Interesting technical bits: Cursor's usage backend can't serve one
> query spanning their storage migrations, so all-time windows get split
> at two magic dates their error messages name; Codex logs cumulative
> token counters that need diffing; and the whole thing was built by two
> AI agents (Claude Code + Cursor) sharing one repo and a common
> AGENTS.md.
>
> My card: https://ai-era-card.vercel.app/s/mmi5GrqvJt

---

## After each post

- Watch `/api/stats` (Bearer token): referer hosts tell you which channel
  is actually converting views; `totalCards` tells you if views become
  cards. Gate 0 (ROADMAP): ≥100 non-founder cards + organic shares.
- Reply to every comment in the first 2 hours — velocity decides reach on
  all three platforms.
- If a post flops, don't repost the same text elsewhere — each channel got
  its own framing for a reason; iterate the hook instead.
