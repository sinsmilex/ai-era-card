import type { ClientEventKind } from "./db";

// Fire-and-forget client analytics. Never blocks UI, never throws.
export function beacon(kind: ClientEventKind, slug?: string): void {
  try {
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slug ? { kind, slug } : { kind }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // analytics must never break an interaction
  }
}
