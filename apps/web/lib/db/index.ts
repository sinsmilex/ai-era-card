import type { SnapshotPayload } from "@aieracard/schema";

export interface SnapshotRecord {
  slug: string;
  createdAt: string;
  payload: SnapshotPayload;
}

export interface SnapshotStore {
  insert(rec: SnapshotRecord & { ipHash: string | null }): Promise<void>;
  getBySlug(slug: string): Promise<SnapshotRecord | null>;
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
