import { Pool } from "pg";
import type {
  CardEvent,
  SnapshotRecord,
  SnapshotStore,
  StatsSummary,
} from "./index";

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
      CREATE TABLE IF NOT EXISTS card_events (
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        slug text,
        surface text NOT NULL,
        referer_host text,
        ua_class text,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      -- client interactions (homepage) carry no slug; drop the old NOT NULL.
      ALTER TABLE card_events ALTER COLUMN slug DROP NOT NULL;
      CREATE INDEX IF NOT EXISTS card_events_created_idx ON card_events (created_at DESC);
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

  async recordEvent(event: CardEvent): Promise<void> {
    await this.pool.query(
      `INSERT INTO card_events (slug, surface, referer_host, ua_class)
       VALUES ($1, $2, $3, $4)`,
      [event.slug, event.surface, event.refererHost, event.uaClass]
    );
  }

  async getStats(): Promise<StatsSummary> {
    const [cards, cards7d, surfaces, referers, byDay] = await Promise.all([
      this.pool.query(`SELECT count(*)::int AS n FROM snapshots`),
      this.pool.query(
        `SELECT count(*)::int AS n FROM snapshots WHERE created_at > now() - interval '7 days'`
      ),
      this.pool.query(
        `SELECT surface, count(*)::int AS n FROM card_events
         WHERE created_at > now() - interval '30 days'
         GROUP BY surface`
      ),
      this.pool.query(
        `SELECT referer_host AS host, count(*)::int AS n FROM card_events
         WHERE created_at > now() - interval '30 days' AND referer_host IS NOT NULL
         GROUP BY referer_host ORDER BY n DESC LIMIT 10`
      ),
      this.pool.query(
        `SELECT to_char(created_at::date, 'YYYY-MM-DD') AS day, count(*)::int AS n
         FROM card_events
         WHERE created_at > now() - interval '14 days'
         GROUP BY 1 ORDER BY 1`
      ),
    ]);
    return {
      totalCards: cards.rows[0].n,
      cardsLast7d: cards7d.rows[0].n,
      viewsBySurface30d: Object.fromEntries(
        surfaces.rows.map((r) => [r.surface, r.n])
      ),
      topReferers30d: referers.rows.map((r) => ({ host: r.host, count: r.n })),
      viewsByDay14d: byDay.rows.map((r) => ({ day: r.day, count: r.n })),
    };
  }
}
