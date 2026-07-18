# AI Era Card — product strategy & roadmap

Written 2026-07-19. This is the shared strategy for all agents/humans
working on the repo. If you're about to build a feature, check which phase
it belongs to and whether its gate has been passed. AGENTS.md covers the
codebase; this file covers *why and what next*.

## The one-sentence direction

**From a share-card toy to the identity layer of the AI era** — the thing a
developer links to prove "I actually build with AI," the way a GitHub
profile proves "I actually write code."

Everything below is staged so that each step is cheap, testable, and only
unlocks the next when real usage justifies it. We explicitly refuse to
build ahead of validation.

## What we know (and what we don't)

Known, validated externally:
- People *already* share AI usage stats manually (ccusage screenshots,
  wrapped clones going viral, official Claude Reflect exists because the
  demand was proven). The share moment is real.
- The niche we occupy — any-day snapshot with a permanent URL — is empty.
  Local stats (ccusage), annual wrapped (Reflect), team analytics
  (WakaTime) are all taken; none of them is a *shareable identity object*.
- "AI fluency" is becoming a hiring signal. A verifiable usage history has
  a plausible path to career value — that's the long-term moat if we get
  there.

Not yet known (the whole roadmap exists to answer these, in order):
1. Will strangers actually run `npx aieracard`? (acquisition)
2. Will they share the result unprompted? (virality)
3. Will they ever come back to make a second card? (retention)
4. Will they want a persistent identity (profile/territory), not just a
   snapshot? (depth)

## Gamification: the decision

Verdict: **status markers tied to real work — yes; game systems — no.**

Reasoning: gamification works when it amplifies a motivation the user
already has, and reads as cringe when it manufactures one. Our audience
(senior/AI-native devs) is allergic to XP bars and quests, but demonstrably
motivated by: GitHub contribution graphs, streaks, Strava-style
comparison, "top N%" claims, and milestone rounds ("crossed 1B tokens").
Those all attach status to work they already did — no behavior change
required, which is this product's founding principle.

Do (in phase order):
- **Milestones** ("1B Tokens Club", "365 active days", "10 models"):
  each crossing is a *new share moment* — this is the viral loop restart
  mechanic, not decoration. Cheap: computed from the payload at render.
- **Percentiles** ("top 3% by tokens this month"): the single strongest
  share hook — but mathematically dishonest below ~500 snapshots, so it's
  gated on volume, not on build effort.
- **Streaks**: already on the card. Keep.
- **Deltas** ("+240M since your last card"): turns a one-shot toy into a
  repeatable ritual. Needs no accounts — CLI can keep a local pointer to
  your previous snapshot.

Don't (ever, without new evidence):
- Points/XP/levels/quests/achievement popups. Manufactured motivation,
  wrong audience.
- Daily-login mechanics. The product's promise is "don't change your
  habits" — nagging contradicts the founding principle.

## The map: staged, grown out of the card — never a separate cold start

The original "Million Dollar Homepage / Token City" idea fails as a v1
because an empty world is worse than no world (and 2026 already has a pile
of literal MDH-for-agents clones — pixel grids bought by AI agents — that's
a occupied, memed-out format). But as a *late-stage evolution of the card*
it's our strongest differentiator: territory earned by real work, not
bought. The mosaic on today's card is already a deterministic,
stats-seeded pattern — deliberately, so it can become this.

- **Territory baseline (now).** The card and OG image render a deterministic
  stepped building silhouette from aggregate-only stats. Its level comes from
  all-time context tokens (including cache tokens where reported), with broad
  headroom bands: Foundation (<25M), Studio (25–150M), Foundry (150–750M),
  Tower (750M–2.5B), Citadel (2.5–7.5B), Arcology (7.5–20B), Landmark
  (20–100B), and Apex (100B+). This is a status marker, not XP; the same
  deterministic geometry is the personal territory seed that a future atlas
  will place on a shared plot.
- **Stage T1 — Territory (single-player, no cold start).** The mosaic
  grows into a proper generative "city block" render of *your* stats:
  districts = models/sources, building height = volume, lights = streaks.
  Lives on the card page; the OG image shows it. Ships whenever Phase 1
  proves people come back — it upgrades every existing card
  automatically (OG renders on the fly).
- **Stage T2 — Atlas (the world map).** A zoomable grid of all
  territories. Unlocks at a volume threshold (≥~500–1000 snapshots) —
  below that it's embarrassing, above it it's mesmerizing. Sorting/
  clustering by size/models/date; each territory links to its card. This
  is where network effects start: the map gets better with every user.
- **Stage T3 — Economy (only if T2 shows engagement).** Neighborhoods,
  cosmetic upgrades (paid), claimed coordinates. This is the monetization
  surface — cosmetics attached to a world people actually visit. Do not
  build speculative economy before T2 has traffic.

## Phases and gates

**Phase 0 — Validation sprint (now, ~1–2 weeks).** The product is built;
nothing matters until strangers touch it.
- CI (GitHub Actions: `pnpm test && pnpm -r build`) — a broken `main`
  auto-deploys to prod today.
- OpenRouter live-key dry-run (still unverified against a real account).
- **Codex CLI as a 4th source** (pricing table already covers OpenAI
  models): every added source is a new audience segment for the same
  card. Codex CLI keeps local session logs analogous to Claude Code.
- Minimal measurement: creation count + view counts + referer on card
  pages. We cannot judge any gate without this.
- **Distribution attempts (the actual point):** 2–3 honest launches —
  X/Twitter thread, r/ClaudeAI / r/cursor, maybe Show HN. The founder's
  own 1.4B-token card is the demo asset.
- **Gate 0:** ≥100 cards created by non-founders AND organic (unprompted)
  shares observed. If 2–3 distribution pushes produce nothing → stop and
  rethink the wedge (don't quietly keep polishing).

**Phase 1 — The return loop (only after Gate 0).**
- Deltas ("since your last card") via local CLI state.
- Milestones as share moments (new card auto-badges the crossing).
- Percentiles once volume makes them honest (needs only a SQL query over
  `snapshots.total_tokens` — schema already supports it).
- **Gate 1:** ≥20% of users make a second card within a month.

**Phase 2 — Territory (Stage T1)** — the visual leap. Also the moment to
consider optional accounts (claim your cards under one handle) — accounts
are *pulled in* by territory ownership, never pushed before it.
- **Gate 2:** card→territory page engagement (time on page, repeat
  visits) visibly better than card alone.

**Phase 3 — Atlas (Stage T2)** at the volume threshold. Leaderboards live
here too (they're just a sorted view of the atlas).

**Phase 4 — Economy & career value (Stage T3).** Cosmetics; maybe
verified profiles ("AI fluency" signal for hiring). Revenue experiments
belong here and no earlier — the free card/territory/atlas is the growth
engine and stays free.

## Standing "do not build" list

- Proxy/credits monetization (contradicts "don't change habits") — decided
  and closed in the original scoping.
- A usage *dashboard* (ccusage/WakaTime own that; we are an identity
  object, not an analytics tool).
- Accounts before Phase 2, payments before Phase 4.
- Heavy gamification (see above).
- Anything that adds fields to the payload beyond aggregate numbers —
  the privacy contract is the brand.

## Division of labor

- Strategy/gates/scope calls: human (sinsmile) decides, agents advise.
- Claude (chat sessions): infra (CI, deploys), collectors/integrations,
  measurement, docs, this roadmap's upkeep.
- Cursor (IDE sessions): product surface (web UI, card/territory visuals,
  tests), incremental refactors.
- Both: keep AGENTS.md + this file truthful after every meaningful change;
  small scoped commits; never start a phase whose gate hasn't passed.
