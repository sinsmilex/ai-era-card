# AI Era Card — growth research (target: 10,000 users)

A shared, adversarial working doc. **Two agents (Claude + Cursor) plus the
founder edit this.** The goal is not to collect ideas — it's to *pressure-
test* them until only the strong ones survive. AGENTS.md = how the code
works; ROADMAP.md = staged plan; this file = the open questions and the
debate that resolves them.

## How to use this doc (protocol)

Every idea is an **entry** with this shape:

> **[ID] Claim** — one sentence.
> **Rationale** — why it might work.
> **Challenge (author: Claude/Cursor)** — the strongest attack on it.
> **Verdict** — SHIP / TEST / PARK / KILL, + the one metric that decides.

Rules: (1) No idea graduates to ROADMAP without a Verdict of SHIP or a
passed TEST. (2) When you add an entry, you MUST write the Challenge
yourself — steelman the opposing view before the other agent does. (3)
The other agent's job is to break it further or upgrade the verdict. (4)
Cite evidence (a stat, a code path, a competitor) over opinion. (5) Keep
the founder's constraints sacred: local-first privacy, no habit change,
no dashboard, no proxy/credits.

Owner tags: **[C]** = Claude authored, **[X]** = Cursor authored,
**[F]** = founder. Sign challenges.

---

## 0. Audit — where we actually are (Claude, 2026-07-21)

**Product state: shipped and healthy.** Live QA of prod (via browser,
real HTTP): card page 200, all 4 embed surfaces (OG / badge SVG / story /
twitter) 200, `/api/stats` 401 without auth, 404 on missing slug, zero
console errors. CI green on `main`. ~6.8k LOC, clean structure. `aieracard`
live on npm (540 downloads last 7d — but that's mostly our own dev/CI
installs, not signal yet). Four usage sources (Claude Code, Codex, Cursor,
OpenRouter), era ranks + milestones + territory building, LinkedIn/README/
story share paths, per-surface analytics.

**The uncomfortable finding: the product is not the bottleneck.
Acquisition is.** We have polished everything a user sees *after* they
run `npx aieracard`. But the funnel's first step is `npx aieracard`, and
that step is where 10k lives or dies.

**The central strategic tension (everything below orbits this):**
Our privacy promise ("parsing happens on YOUR machine") *requires* a CLI —
a website can't read local logs. But a CLI *caps our reachable market* to
developers who (a) have Node, (b) will paste `npx <unknown-package>` into
a terminal, (c) trust it enough to upload. That's a fraction of a fraction.
**For 10k users, the CLI gate is the number-one problem, and it's in
tension with the founding privacy principle.** This doc's most important
job is to resolve that tension.

---

## 1. User behavior — the funnel, honestly

Funnel today (each arrow loses people):

```
sees a shared card
  → clicks through to /s/[slug]
    → lands on "make your own" → homepage
      → reads "npx aieracard"
        → has Node + a terminal open
          → pastes an unknown npx command
            → survives the trust moment ("is this malware?")
              → has ≥1 supported tool with local logs
                → sees the JSON, confirms upload
                  → gets their card
                    → SHARES it (loop restarts)  ← the only step that grows us
```

Honest per-step intuition (no data yet — instrument, don't guess):
- The **npx trust moment** and the **"do I even have Node"** steps are
  where I'd bet most drop. A curious designer, PM, or non-JS dev who sees
  a beautiful card literally cannot make one.
- The **share step** is the only viral engine. If cards get made but not
  shared, we die slowly regardless of top-of-funnel.

**[C1] Claim** — The single highest-leverage metric to watch is
**share-rate per card created**, not cards created. A card that isn't
shared is a dead end; a shared card is a new top-of-funnel.
**Rationale** — viral coefficient k = (cards per share) × (shares per
card). We obsess over the first; the second is what compounds.
**Challenge (Claude)** — but we can't *measure* organic shares directly
(a screenshot posted to Slack is invisible to us). We can only proxy it
via referers + views-per-card. So "share-rate" is partly unmeasurable,
which means optimizing it is partly flying blind.
**Verdict — TEST.** Instrument views-per-card and referer diversity as
the share proxy. If median card gets <2 external views, sharing is broken
and no top-of-funnel work matters yet.

---

## 2. The 10k question — is it even the right goal?

**[C2] Claim** — 10k *card-creators* in "coming months" is aggressive but
possible **only if one distribution channel goes semi-viral once**; 10k
via steady grind is not realistic for a zero-audience solo launch.
**Rationale** — dev-tool virality is lumpy: a single HN front-page or a
big X account quote-tweeting a card can do 5k in a day; comments-grinding
does ~10–50/day. Math says the grind alone needs ~daily posting for
6+ months. So the real plan is "maximize the number of shots at a viral
moment," not "convert steadily."
**Challenge (Claude)** — "go viral once" is not a strategy, it's a lottery.
Betting the goal on an uncontrollable event is how products die quietly.
**Verdict — reframe the goal.** Target is not "10k users" (outcome we
don't control) but "**take 8–12 quality shots at virality in 60 days
while removing every funnel blocker between a viral moment and a created
card**." If the product converts a spike well, 10k follows one good spike.
If it can't convert a spike, no number of spikes helps — so *conversion
readiness* is the actual pre-work. This reframes §3 as urgent.

---

## 3. The CLI gate — the debate that matters most

This is the crux. Four options, each attacked.

**[C3] Claim — "Web demo card" (fake-data generator on the site).**
Let anyone on the homepage generate a *sample* card by typing a few
numbers or picking a persona ("show me what a 1B-token card looks like").
No install. Purely to seed the share loop and teach the format.
**Rationale** — removes the install gate for the *viral* half of the loop
(seeing/sharing), keeps the CLI for the *real* half (your true data).
Wrapped clones prove people share even fake-ish stats.
**Challenge (Claude)** — dilutes the core value ("*your real* usage") and
risks a feed full of fake cards that cheapen real ones. Could make the
whole thing read as a toy.
**Verdict — TEST, carefully.** Only as a clearly-labeled "example"
explorer, never mintable to a permanent shareable slug. Measures: does
"see an example" → "npx" conversion rise?

**[C4] Claim — "Paste-your-stats" web path (manual, no CLI).**
Cursor users can already export a usage CSV; ccusage users can paste JSON.
Let the *website* accept that paste/upload and mint a real card. CLI stays
the premium/automatic path.
**Rationale** — opens the product to everyone who has stats but won't run
npx (huge: all Cursor dashboard users, all ccusage screenshot-posters).
Privacy intact — they choose what to paste.
**Challenge (Claude)** — breaks "we never see your raw data" cleanliness
if we accept a raw CSV server-side (it may contain more than aggregates);
and manual entry is friction too. Mitigation: parse the CSV *client-side*
in the browser (WASM/JS), send only the same aggregate schema. That keeps
the privacy contract AND opens the funnel.
**Verdict — SHIP-candidate, highest priority.** Client-side CSV/JSON
parse in the browser → same aggregate payload → real card. This is the
single biggest TAM unlock that doesn't violate a principle. Cursor: attack
this or build it.

**[C5] Claim — Keep CLI-only, double down on the dev niche.**
Accept the gate; 10k Node devs who run npx is still a big number; purity
of the story is a marketing asset ("real, local, verifiable").
**Rationale** — the constraint IS the brand. ccusage is CLI-only and
beloved. Simpler to build, no new surface.
**Challenge (Claude)** — caps TAM hard and makes the 10k timeline depend
entirely on repeated virality inside one narrow community that will
saturate fast (r/ClaudeAI is not infinite).
**Verdict — PARK as fallback.** It's the current state; it's fine; it
just probably can't hit 10k alone.

**[C6] Claim — Browser-extension collector.**
An extension that reads Cursor/ChatGPT usage from the pages you're already
logged into, mints a card in one click.
**Challenge (Claude)** — extension review, per-site fragility, permission
scariness, and it's a *bigger* trust ask than npx, not smaller. High build
cost.
**Verdict — KILL for now.** Revisit only if [C4] proves the web path
converts and we need more sources.

---

## 4. Marketing — beyond the launch playbook

LAUNCH_POSTS.md covers the cold-start channels. This is the layer above.

**[C7] Claim — The GitHub README badge is a bigger channel than any post.**
Every dev who badges their profile README is a permanent, compounding ad
seen by every profile visitor (recruiters included). github-readme-stats
has millions of embeds on this exact mechanic.
**Rationale** — it's the only channel with *compounding* rather than
*decaying* reach. A Reddit post decays in 48h; a README badge runs for
years.
**Challenge (Claude)** — devs badge things that update live and feel
"theirs." A static snapshot badge gets added once and forgotten; worse, a
stale "1.4B tokens from July" looks dead by September. Needs the badge to
feel alive (auto-refresh from a re-run, or a "last updated" that ages
gracefully).
**Verdict — SHIP + upgrade.** Badge exists; make it the hero of the share
page and the launch posts ("put your AI era in your README"), and design
for staleness (show the as-of date honestly, or add a `--refresh` re-mint
that keeps the same slug). Metric: % of cards whose slug appears in a
github.com referer.

**[C8] Claim — "Wrapped moment" manufacturing.**
Don't wait for year-end. Manufacture recurring share triggers: monthly
"your AI era in July," milestone crossings ("you just hit 1B"), and
model-launch tie-ins ("your first week with Opus 4.9").
**Challenge (Claude)** — without accounts we can't email "your July is
ready" — the user has to *remember* to re-run. Retention triggers need a
reminder surface we don't have.
**Verdict — TEST.** Cheapest version: the CLI, on run, writes a local
`.aieracard` pointer and, on the *next* run, shows "+240M since your last
card (Mar 3)" — turning re-runs into a delta ritual without accounts or
email. Ship the delta; measure re-run rate.

**[C9] Claim — Position against ccusage, not Wrapped.**
Our closest neighbor in devs' minds is ccusage (they screenshot it). Be
"the shareable ccusage" explicitly. Ride their distribution.
**Challenge (Claude)** — antagonizing a beloved OSS tool backfires; also
ccusage users are already the narrow niche we're trying to escape.
**Verdict — SHIP the framing, softly.** "Love ccusage? This is the
shareable version" in posts. It's the clearest one-liner we have for the
warm audience. Not a growth *engine*, but the best *hook* for channel #1.

---

## 5. Product/code — audit findings worth acting on

**[C10]** Web write-path is CLI-only (`/api/snapshots` accepts only the
posted payload). Building [C4]'s browser parser means a new client-side
module + a homepage upload UI, reusing the exact same `snapshotPayloadSchema`.
Low risk, high leverage. **Verdict — SHIP after [C4] debate settles.**

**[C11]** No accounts = no cross-device identity = no "my cards" history.
ROADMAP correctly defers accounts to Phase 2. But a *lightweight* claim
mechanism (a secret edit-token returned at mint, stored locally) would let
someone update/refresh a card without full auth. **Verdict — PARK** until
delta ([C8]) proves people want continuity.

**[C12]** Cursor endpoints are undocumented and unmonitored — a silent
break drops a whole source. **Verdict — TEST**: a daily cron (GitHub
Action) that runs the collector against a canary and alerts on failure.
Cheap insurance for a launch-critical dependency.

**[C13]** Percentiles/leaderboard need volume to be honest, but the SQL is
trivial (`snapshots.total_tokens` is indexed). The moment we cross ~500
cards, "top X%" becomes the strongest share hook we have. **Verdict —
build the query behind a flag now, light it up at volume.**

---

## 6. Gamification & design — resolved position (from the strategy call)

Settled: **status markers tied to real work = yes; game systems = no.**
Ranks/milestones/streaks/territory already shipped. Next gamification
layer (percentiles, deltas, leaderboard) is *volume-gated, not build-
gated* — building it before Gate 0 is inventory, not progress. Design:
**recognizability > uniqueness** pre-launch (one system, seeded variety),
not a theme zoo. See ROADMAP §Gamification for the full reasoning. Open
sub-question for Cursor below.

**[C14] Claim — one new palette is fine; a customization system is not,
pre-launch.** **Challenge (Cursor: your move)** — is there a *cheap*
design lever that materially lifts share-rate (e.g. the card animating on
first load, or an auto-generated "one-liner brag" caption users can
copy)? Argue for the highest-share-lift design change under 1 day of work.

---

## 7. Open debates seeded for Cursor (attack or extend)

1. **[C4] client-side CSV/JSON web path** — biggest TAM unlock. Break it
   or build it. If you build: where does the browser parser live, and does
   it truly keep the payload identical to the CLI's?
2. **[C2] goal reframe** — do you accept "conversion-readiness + N shots"
   over "10k users" as the operative goal? If not, what's your acquisition
   model that hits 10k on merit?
3. **[C8] delta ritual** — cheapest retention mechanic without accounts.
   Agree it's the first Phase-1 thing to ship? Counter-proposal?
4. **[C14]** — the sub-1-day design lever with the highest share-lift.
5. **New entries** — add [X#] claims with your own Challenge written in.
   I'll attack them next pass.

## 8. Decision log (promote here when a verdict is final)

- (none yet — first entries above await Cursor's challenges)
