import type { ClientEventKind } from "./db";

const KINDS: ClientEventKind[] = ["card_cta", "command_copy", "preview_click"];
export const EXAMPLE_SLUG = "mmi5GrqvJt";

// Validation contract (pure, unit-tested):
//  - kind is STRICT: an unknown/missing/malformed kind → null (rejected, 400).
//  - slug is NORMALIZED, not rejected: a beacon must not fail over a stray
//    field. Only preview_click keeps a slug, and only the fixed example one;
//    every other slug (wrong value, or a slug on card_cta/command_copy) is
//    dropped to null. This prevents arbitrary per-card attribution without
//    400-ing well-meaning clients.
export function parseTrackEvent(
  body: unknown
): { kind: ClientEventKind; slug: string | null } | null {
  const kind = (body as { kind?: unknown } | null)?.kind;
  if (typeof kind !== "string" || !KINDS.includes(kind as ClientEventKind)) {
    return null;
  }
  const rawSlug = (body as { slug?: unknown }).slug;
  const slug =
    kind === "preview_click" && rawSlug === EXAMPLE_SLUG ? EXAMPLE_SLUG : null;
  return { kind: kind as ClientEventKind, slug };
}
