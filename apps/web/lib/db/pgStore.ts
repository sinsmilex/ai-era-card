import { Pool } from "pg";
import type { SnapshotRecord, SnapshotStore } from "./index";

export class PgStore implements SnapshotStore {
  private constructor(private pool: Pool) {}

  static async create(connectionString: string): Promise<PgStore> {
    const pool = new Pool({ connectionString, max: 3 });
    await pool.query(`
      CREATE TABLE IF NOT EXISTS snapshots (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        slug text UNIQUE NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        schema_version smallint NOT NULL,
        has_claude_code boolean NOT NULL DEFAULT false,
        has_openrouter boolean NOT NULL DEFAULT false,
        has_cursor boolean NOT NULL DEFAULT false,
        has_codex boolean NOT NULL DEFAULT false,
        total_tokens bigint NOT NULL,
        payload jsonb NOT NULL,
        ip_hash text,
        view_count int NOT NULL DEFAULT 0
      );
      ALTER TABLE snapshots ADD COLUMN IF NOT EXISTS has_codex boolean NOT NULL DEFAULT false;
      CREATE INDEX IF NOT EXISTS snapshots_total_tokens_idx ON snapshots (total_tokens DESC);
    `);
    return new PgStore(pool);
  }

  async insert(rec: SnapshotRecord & { ipHash: string | null }): Promise<void> {
    const p = rec.payload;
    await this.pool.query(
      `INSERT INTO snapshots
        (slug, schema_version, has_claude_code, has_openrouter, has_cursor, has_codex, total_tokens, payload, ip_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        rec.slug,
        p.schemaVersion,
        Boolean(p.sources.claudeCode),
        Boolean(p.sources.openrouter),
        Boolean(p.sources.cursor),
        Boolean(p.sources.codex),
        p.aggregate.totalTokens,
        JSON.stringify(p),
        rec.ipHash,
      ]
    );
  }

  async getBySlug(slug: string): Promise<SnapshotRecord | null> {
    const res = await this.pool.query(
      `UPDATE snapshots SET view_count = view_count + 1
       WHERE slug = $1
       RETURNING slug, created_at, payload`,
      [slug]
    );
    if (res.rowCount === 0) return null;
    const row = res.rows[0];
    return {
      slug: row.slug,
      createdAt: new Date(row.created_at).toISOString(),
      payload: row.payload,
    };
  }
}
