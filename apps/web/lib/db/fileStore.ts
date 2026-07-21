import { appendFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type {
  CardEvent,
  SnapshotRecord,
  SnapshotStore,
  StatsSummary,
} from "./index";

const DATA_DIR = join(process.cwd(), ".data", "snapshots");
const EVENTS_FILE = join(process.cwd(), ".data", "events.jsonl");

export class FileStore implements SnapshotStore {
  async insert(rec: SnapshotRecord & { ipHash: string | null }): Promise<void> {
    await mkdir(DATA_DIR, { recursive: true });
    const { ipHash, ...record } = rec;
    await writeFile(
      join(DATA_DIR, `${rec.slug}.json`),
      JSON.stringify({ ...record, ipHash }, null, 2),
      { encoding: "utf8", flag: "wx" }
    );
  }

  async getBySlug(slug: string): Promise<SnapshotRecord | null> {
    if (!/^[A-Za-z0-9_-]{1,32}$/.test(slug)) return null;
    try {
      const raw = await readFile(join(DATA_DIR, `${slug}.json`), "utf8");
      const { ipHash: _ipHash, ...record } = JSON.parse(raw);
      return record as SnapshotRecord;
    } catch {
      return null;
    }
  }

  async recordEvent(event: CardEvent): Promise<void> {
    await mkdir(join(process.cwd(), ".data"), { recursive: true });
    await appendFile(
      EVENTS_FILE,
      JSON.stringify({ ...event, ts: new Date().toISOString() }) + "\n",
      "utf8"
    );
  }

  async getStats(): Promise<StatsSummary> {
    const now = Date.now();
    const DAY = 86_400_000;

    let totalCards = 0;
    let cardsLast7d = 0;
    try {
      const files = (await readdir(DATA_DIR)).filter((f) =>
        f.endsWith(".json")
      );
      totalCards = files.length;
      for (const f of files) {
        try {
          const rec = JSON.parse(await readFile(join(DATA_DIR, f), "utf8"));
          if (now - new Date(rec.createdAt).getTime() < 7 * DAY) cardsLast7d++;
        } catch {
          // unreadable snapshot — count it in the total only
        }
      }
    } catch {
      // no data dir yet
    }

    const viewsBySurface30d: Record<string, number> = {};
    const refererCounts = new Map<string, number>();
    const dayCounts = new Map<string, number>();
    try {
      const raw = await readFile(EVENTS_FILE, "utf8");
      for (const line of raw.split("\n")) {
        if (!line.trim()) continue;
        let ev: any;
        try {
          ev = JSON.parse(line);
        } catch {
          continue;
        }
        const age = now - new Date(ev.ts).getTime();
        if (age < 30 * DAY) {
          viewsBySurface30d[ev.surface] =
            (viewsBySurface30d[ev.surface] ?? 0) + 1;
          if (ev.refererHost) {
            refererCounts.set(
              ev.refererHost,
              (refererCounts.get(ev.refererHost) ?? 0) + 1
            );
          }
        }
        if (age < 14 * DAY) {
          const day = String(ev.ts).slice(0, 10);
          dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
        }
      }
    } catch {
      // no events yet
    }

    return {
      totalCards,
      cardsLast7d,
      viewsBySurface30d,
      topReferers30d: [...refererCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([host, count]) => ({ host, count })),
      viewsByDay14d: [...dayCounts.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([day, count]) => ({ day, count })),
    };
  }
}
