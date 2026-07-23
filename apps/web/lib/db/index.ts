import type { SnapshotPayload } from "@aieracard/schema";

export interface SnapshotRecord {
  slug: string;
  createdAt: string;
  payload: SnapshotPayload;
}

// One row per event. Deliberately PII-free: referer is host-only (no
// path/query), user agent is reduced to a bot class, no IP is stored.
// Server renders carry a slug (CardSurface); client interactions may not
// (ClientEventKind) — slug is nullable.
export type CardSurface = "page" | "og" | "badge" | "story";
export type ClientEventKind = "card_cta" | "command_copy" | "preview_click";
export type EventKind = CardSurface | ClientEventKind;

export interface CardEvent {
  slug: string | null;
  surface: EventKind;
  refererHost: string | null;
  uaClass: string | null;
}

export interface StatsSummary {
  totalCards: number;
  cardsLast7d: number;
  viewsBySurface30d: Record<string, number>;
  topReferers30d: Array<{ host: string; count: number }>;
  viewsByDay14d: Array<{ day: string; count: number }>;
}

export interface SnapshotStore {
  insert(rec: SnapshotRecord & { ipHash: string | null }): Promise<void>;
  getBySlug(slug: string): Promise<SnapshotRecord | null>;
  recordEvent(event: CardEvent): Promise<void>;
  getStats(): Promise<StatsSummary>;
}

// Postgres (Neon) in production when DATABASE_URL is set; a local JSON file
// store otherwise, so the full flow runs end-to-end with zero external deps.
let store: SnapshotStore | null = null;

export async function getStore(): Promise<SnapshotStore> {
  if (store) return store;
  if (process.env.DATABASE_URL) {
    const { PgStore } = await import("./pgStore");
    store = await PgStore.create(process.env.DATABASE_URL);
  } else {
    const { FileStore } = await import("./fileStore");
    store = new FileStore();
  }
  return store;
}
