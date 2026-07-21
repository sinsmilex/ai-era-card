# Launch plan — Gate 0

## Goal

Prove that people create an AI Era Card and share it. This is not a launch
for profiles, a map, or live updates; it is a validation of the share-card
loop.

## Product decisions

- Keep the product voice calm and engineering-led.
- Include a self-reported line on OG/PNG exports and clear privacy text on
  the card page.
- Keep the LinkedIn share-kit for users who already have a network, but do
  not make LinkedIn the founder's primary launch bet: the founder has little
  LinkedIn audience.
- Treat Stories and the README badge as supporting share surfaces, not as
  substitutes for distribution channels that work for a zero-audience
  founder.

## Pre-launch checklist

1. Publish CLI version 0.1.4 to npm, including the Cursor fail-safe.
2. Self-test on Windows with Claude-only, Cursor plus CSV, and both sources
   together.
3. Add CTA telemetry for copy, download, and share intents if time permits.
4. Soft-launch to five to ten developer friends.

## Distribution sequence

1. Ask five to ten friends to run `npx aieracard` and share their cards.
   Their cards provide the first social proof.
2. Fix the remaining friction their feedback reveals.
3. Post to Show HN once the flow is stable and 0.1.4 is live on npm.
4. Post to `r/cursor`, `r/ClaudeAI`, and `r/ChatGPTCoding`, following each
   community's self-promotion rules.
5. Participate in AI-developer circles on X/Twitter through relevant replies
   and a post with a real card.
6. Add the README badge and use the `aieracard` release for GitHub
   visibility.
7. Share in Cursor and Claude Discord communities where appropriate.

LinkedIn remains useful for users with an existing network. The founder can
post there later, but it is not the primary channel for this launch.

## Gate 0 metric

Strangers create cards and shares happen organically. Watch `/api/stats` and
new snapshot slugs for the signal.

## Deferred intentionally

- Profiles
- Live updates
- Atlas/map
- LinkedIn API integration
- Real-time slot counters
- Anti-forgery work
- Many export formats

## Related material

Channel-specific draft posts are in [LAUNCH_POSTS.md](./LAUNCH_POSTS.md).
