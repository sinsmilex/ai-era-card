import { getStore, type CardSurface } from "./db";

// Fire-and-forget analytics for card surfaces. PII-free by construction:
// referer is reduced to its host, the user agent to a coarse class, and
// failures never break a render.

const BOT_PATTERNS: Array<[RegExp, string]> = [
  [/slack/i, "slack"],
  [/twitterbot/i, "twitter"],
  [/discordbot/i, "discord"],
  [/telegrambot/i, "telegram"],
  [/facebookexternalhit|facebot/i, "facebook"],
  [/linkedinbot/i, "linkedin"],
  [/whatsapp/i, "whatsapp"],
  [/github-camo/i, "github-camo"],
  [/googlebot|bingbot|duckduckbot|yandex/i, "search-engine"],
  [/bot|crawler|spider|preview|fetch/i, "other-bot"],
];

export function classifyUa(ua: string | null): string | null {
  if (!ua) return null;
  for (const [re, name] of BOT_PATTERNS) {
    if (re.test(ua)) return name;
  }
  return /mozilla/i.test(ua) ? "browser" : "other";
}

export function refererHost(referer: string | null): string | null {
  if (!referer) return null;
  try {
    const host = new URL(referer).hostname;
    return host && host.length <= 100 ? host : null;
  } catch {
    return null;
  }
}

export async function track(
  slug: string,
  surface: CardSurface,
  reqHeaders: Headers
): Promise<void> {
  try {
    const store = await getStore();
    await store.recordEvent({
      slug,
      surface,
      refererHost: refererHost(reqHeaders.get("referer")),
      uaClass: classifyUa(reqHeaders.get("user-agent")),
    });
  } catch {
    // analytics must never break a render
  }
}
