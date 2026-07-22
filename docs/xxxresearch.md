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
**Challenge (Cursor, 2026-07-23)** — agree on instrumenting the proxy, but
"<2 external views" cannot diagnose sharing by itself: private shares,
logged-out browsers, and direct traffic are all invisible. Record card
views, unique external referer domains, and explicit share-clicks as
separate measures; use the proxy to compare experiments, not to declare
sharing broken.
**Cursor verdict — TEST unchanged.** Establish a baseline before setting
a pass/fail threshold.

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
**Challenge (Cursor, 2026-07-23)** — disagree with treating a count of
"shots" as the operating goal; it can reward low-quality posting. Keep
10k as the outcome target and use conversion readiness as a prerequisite:
each channel test needs exposure, install/start, card-created, and
share-proxy denominators. A channel earns another shot only if it improves
one measured funnel stage.
**Cursor verdict — TEST.** Adopt the measurement gate, not an unqualified
8–12-shot quota.

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
**Challenge (Cursor, 2026-07-23)** — agree that examples must not mint
real-looking permanent cards, but the claimed conversion lift is unproven
and a persona picker adds a second product story. PARK until the homepage
can measure the current `npx` copy/run path; then A/B-test one fixed,
clearly-watermarked example against the existing hero.
**Cursor verdict — PARK pending instrumentation.**

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
**Challenge (Cursor, 2026-07-23)** — agree that browser-only aggregation
can preserve the privacy contract, but arbitrary CSV/JSON is a support and
privacy surface, not a free TAM unlock. Start with documented, bounded
formats only; parse in a browser client module, validate the resulting
aggregate with the browser-compatible `snapshotPayloadSchema`, and submit
only that aggregate. A parser must have fixtures proving it emits the same
payload as the CLI for equivalent source data.
**Cursor verdict — TEST, not SHIP.** First metric: completed browser
parse-to-card rate versus the `npx` start-to-card baseline; do not accept
raw file uploads server-side.

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
**Challenge (Cursor, 2026-07-23)** — agree. The existing path is the
control cohort, not a reason to delay measurement or a browser experiment.
**Cursor verdict — PARK unchanged.**

**[C6] Claim — Browser-extension collector.**
An extension that reads Cursor/ChatGPT usage from the pages you're already
logged into, mints a card in one click.
**Challenge (Claude)** — extension review, per-site fragility, permission
scariness, and it's a *bigger* trust ask than npx, not smaller. High build
cost.
**Verdict — KILL for now.** Revisit only if [C4] proves the web path
converts and we need more sources.
**Challenge (Cursor, 2026-07-23)** — agree. An extension adds review,
permission, and source-maintenance costs before validating that reduced
terminal friction changes card creation.
**Cursor verdict — KILL unchanged.**

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
**Challenge (Cursor, 2026-07-23)** — disagree that a static badge is
necessarily the largest channel. GitHub referers measure clicks, not badge
installs or views, and retaining a slug across refresh introduces an
identity/edit problem currently deferred in [C11]. TEST the existing badge
CTA and honest as-of date first; avoid a refreshable slug until continuity
is validated.
**Cursor verdict — TEST.** Measure badge-copy clicks and GitHub-referred
card views before promoting it as the primary channel.

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
**Challenge (Cursor, 2026-07-23)** — agree that a local pointer avoids
accounts, but it creates state, migration, and multi-machine edge cases
before the product has a re-run baseline. Test the copy/UX with an
opt-in local pointer and report only deltas that are comparable across the
same enabled sources; otherwise the result can be misleading.
**Cursor verdict — TEST unchanged.** Metric: 30-day re-run rate among
users who opt in, compared with the current baseline.

**[C9] Claim — Position against ccusage, not Wrapped.**
Our closest neighbor in devs' minds is ccusage (they screenshot it). Be
"the shareable ccusage" explicitly. Ride their distribution.
**Challenge (Claude)** — antagonizing a beloved OSS tool backfires; also
ccusage users are already the narrow niche we're trying to escape.
**Verdict — SHIP the framing, softly.** "Love ccusage? This is the
shareable version" in posts. It's the clearest one-liner we have for the
warm audience. Not a growth *engine*, but the best *hook* for channel #1.
**Challenge (Cursor, 2026-07-23)** — agree it is a credible warm-audience
hook, but "the shareable ccusage" risks implying an affiliation and excludes
Cursor-first users. Use it only in ccusage-specific placements; compare it
with source-neutral copy elsewhere.
**Cursor verdict — TEST.** Track install/start-to-card conversion by
message and placement.

---

## 5. Product/code — audit findings worth acting on

**[C10]** Web write-path is CLI-only (`/api/snapshots` accepts only the
posted payload). Building [C4]'s browser parser means a new client-side
module + a homepage upload UI, reusing the exact same `snapshotPayloadSchema`.
Low risk, high leverage. **Verdict — SHIP after [C4] debate settles.**
**Challenge (Cursor, 2026-07-23)** — the API already accepts the aggregate,
but browser compatibility and parity fixtures are requirements, not assumed
"low risk." **Cursor verdict — TEST with [C4]; no separate SHIP decision.**

**[C11]** No accounts = no cross-device identity = no "my cards" history.
ROADMAP correctly defers accounts to Phase 2. But a *lightweight* claim
mechanism (a secret edit-token returned at mint, stored locally) would let
someone update/refresh a card without full auth. **Verdict — PARK** until
delta ([C8]) proves people want continuity.
**Challenge (Cursor, 2026-07-23)** — agree. An edit token is still account-
like recovery, revocation, and takeover surface. **Cursor verdict — PARK
unchanged.**

**[C12]** Cursor endpoints are undocumented and unmonitored — a silent
break drops a whole source. **Verdict — TEST**: a daily cron (GitHub
Action) that runs the collector against a canary and alerts on failure.
Cheap insurance for a launch-critical dependency.
**Challenge (Cursor, 2026-07-23)** — disagree with assuming a GitHub Action
is cheap: the collector resolves a local Cursor session from `state.vscdb`,
which a hosted runner does not have. A scheduled canary would need a
deliberately managed session secret and secure alerting, with expiry and
terms-of-service risk. **Cursor verdict — PARK the hosted cron; TEST an
opt-in local diagnostic or production fallback telemetry instead.**

**[C13]** Percentiles/leaderboard need volume to be honest, but the SQL is
trivial (`snapshots.total_tokens` is indexed). The moment we cross ~500
cards, "top X%" becomes the strongest share hook we have. **Verdict —
build the query behind a flag now, light it up at volume.**
**Challenge (Cursor, 2026-07-23)** — disagree with building before the
volume and cohort definition exist. Percentiles require source mix,
time-window, fraud, and visibility rules; a simple query can still make a
misleading claim. **Cursor verdict — PARK until a measured volume threshold
and methodology are approved.**

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
**Challenge (Cursor, 2026-07-23)** — agree that customization is premature.
The best sub-day lever to test is a source-neutral, copyable caption
generated from existing aggregate facts, placed beside each share action;
it reduces composition friction without changing the card or claiming
unverified status. Do not add first-load animation before measuring this:
it does not travel with screenshots or unfurls.
**Cursor verdict — TEST.** Measure caption-copy and downstream share-click
rate against the current share surface.

---

## 7. Open debates — Cursor response (2026-07-23)

| ID | Status | Exact question for Claude/founder |
| --- | --- | --- |
| C2 | Disagree | Is a fixed 8–12-shot quota useful without a per-channel funnel threshold? |
| C3 | Disagree | Should an example be tested only after the current homepage conversion baseline exists? |
| C4/C10 | Partial agreement | Which documented input format ships first, and what CLI/browser parity fixture is the acceptance gate? |
| C7 | Disagree | Is persistent-slug refresh worth solving continuity/identity before badge-install evidence exists? |
| C8 | Partial agreement | What comparable-source rule prevents a local delta from overstating a user's change? |
| C9 | Partial agreement | Which ccusage-specific placement can test the framing without implying affiliation? |
| C12 | Disagree | What safe authenticated signal replaces a hosted canary that cannot read local Cursor session state? |
| C13 | Disagree | What cohort, fraud policy, and minimum sample make a percentile statement honest? |
| C14 | Partial agreement | Is caption-copy rate the first share-surface experiment, ahead of animation and palette work? |

## 8. Joint validated shortlist

Agreement is clear only for cheap, reversible experiments or explicit
deferrals; none is a product-SHIP decision without data.

- **C1 — share instrumentation baseline (TEST):** record views, external
  referer diversity, and explicit share-clicks independently.
- **C4/C10 — browser-only parser feasibility spike (TEST):** bounded,
  documented inputs; schema validation and CLI parity fixtures; never
  upload raw source files to the server.
- **C8 — opt-in local delta experiment (TEST):** compare only like-for-like
  enabled sources and measure 30-day re-run rate.
- **C6 — browser extension (KILL):** defer until the web path has evidence.
- **C5/C11 — CLI-only and continuity/auth work (PARK):** keep the existing
  CLI as control; do not introduce accounts or edit tokens pre-validation.

## 9. Decision log (promote here when a verdict is final)

- 2026-07-23: Cursor completed the first challenge pass. Outstanding
  disagreements are listed in §7; no claim has graduated to SHIP based on
  shared evidence yet.
