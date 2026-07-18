# Embed & distribution surfaces

Every place a card can live is a standing acquisition channel: embed →
someone sees it → clicks through → makes their own card. This doc ranks
the surfaces by (audience fit × effort) and records platform gotchas.
Companion to docs/ROADMAP.md (this is the "how cards travel" layer of
Phase 0–1).

## Tier 0 — already works: link unfurl via OG image

One OG endpoint covers every chat/social platform that unfurls links.
Verified live: og:title/description/url/image (1200×630 PNG) +
twitter:card=summary_large_image are all emitted on `/s/[slug]`.

| Platform | Mechanism | Status / gotcha |
|---|---|---|
| X/Twitter | twitter:card | ✅ live |
| Slack | OG | ✅ live — teams pasting cards into #ai channels is a core loop |
| Discord | OG | ✅ live |
| Telegram | OG | ✅ live; preview cache is sticky — use @WebpageBot to force re-scrape after design changes |
| LinkedIn | OG | ✅ ratio 1.91:1 ok; re-scrape via Post Inspector; note LinkedIn *suppresses external-link posts* in feed ranking — see Tier 2 |
| Facebook | OG | ✅ (FB invented OG); Sharing Debugger to refresh |
| WhatsApp / iMessage | OG | ✅ |
| Notion / Medium / Ghost | OG bookmark card | partial — full embed needs oEmbed (Tier 1) |

Maintenance rule: any OG design change → re-validate on LinkedIn Post
Inspector + FB Sharing Debugger + Telegram @WebpageBot; caches differ.

## Tier 1 — build next: embeddable artifacts (the compounding channel)

**1. GitHub README badge/widget (top priority — our exact audience).**
A dynamic SVG endpoint, e.g. `/s/[slug]/card.svg` (Satori renders SVG
natively — same pipeline as the OG PNG). Devs paste it into their profile
README like github-readme-stats (proven mechanic, millions of embeds):

```md
[![My AI era](https://ai-era-card.vercel.app/s/SLUG/card.svg)](https://ai-era-card.vercel.app/s/SLUG)
```

- Every README embed is a *permanent* backlink shown to every profile
  visitor — compounding distribution, zero marginal cost.
- Gotcha: GitHub proxies images through camo with caching — set
  `Cache-Control: max-age=3600` and accept ~1h staleness; keep the SVG
  small (<50KB), no external fonts (embed as path outlines or use
  system-safe stacks).
- Same embed works in GitLab READMEs, npm package pages, dev.to posts,
  personal sites, email signatures.

**2. Multi-format image export: `?format=story|square|wide`.**
One param on the image endpoint, three Satori layouts:
- `story` 1080×1920 — Instagram/TikTok Stories. **No link unfurl exists
  on Instagram at all — a story-sized image is the only way in**, and
  wrapped-style content is natively a Stories format (Spotify Wrapped is
  Stories-first). Add a "Download for Stories" button on the card page.
- `square` 1080×1080 — Instagram feed, Threads, Mastodon.
- `wide` 1200×630 — the existing OG (default).
LinkedIn bonus: image posts rank far better than link posts there, so
"Download as image → post natively + link in first comment" is the
correct LinkedIn playbook; the card page should say so next to the button.

**3. oEmbed endpoint + `/s/[slug]/embed` iframe.**
`/api/oembed?url=...` + `<link rel="alternate" type="application/json+oembed">`
makes cards auto-expand as rich embeds in Notion, Medium, WordPress,
Ghost, Obsidian-publish blogs. The iframe route is a chrome-less card
render for portfolios. Cheap: both reuse existing components.

## Tier 2 — platform-native plays (after Phase 0 gate)

- **Telegram inline bot**: `@aieracard_bot` inline query → posts the card
  image+link into any chat without leaving it. Cheap to run (Bot API +
  our image endpoint), good fit for RU/dev Telegram culture. Later: Mini
  App wrapping the card page.
- **Slack app (unfurl enrichment / slash command)**: only if teams start
  asking; plain OG unfurl already covers 90% of the Slack value.
- **LinkedIn "position/certification" hack**: users can add the card URL
  as a certification/license entry ("AI Era Card — 1.4B tokens") — free
  profile real estate; document it in a "share your card" guide rather
  than building anything.
- **Zoom/Meet virtual background export** (`?format=bg` 1920×1080):
  novelty, near-zero cost once multi-format exists; conference-season fun.

## Tier 3 — the map, later (Phase 2+)

When territories exist (ROADMAP Stage T1/T2), the same surfaces upgrade:
- README badge becomes a **live territory widget** (your city grows in
  your profile README — the strongest version of the badge).
- Story export becomes a territory flyover frame.
- The atlas gets its own OG per region ("this neighborhood of the AI
  era"). Don't build any of this before territories ship.

## Sequencing recommendation

Phase 0 (with distribution sprint): GitHub SVG badge + `format=story`
export — both directly amplify the launch posts.
Phase 1: oEmbed + iframe + square format + share-guide page.
Tier 2 items strictly on demand signals. Every embed must carry the
site URL — the loop is the point, not the pixels.
