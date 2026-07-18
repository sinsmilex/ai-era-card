import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { SnapshotRecord, SnapshotStore } from "./index";

const DATA_DIR = join(process.cwd(), ".data", "snapshots");

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
}
