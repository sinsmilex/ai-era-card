import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/db";
import { appUrl, fmtTokens } from "@/lib/format";
import { eraPalette, eraRank, shareLine } from "@/lib/eraRank";
import { StatsCard, sourceLabels } from "@/components/StatsCard";
import { CopyLinkButton } from "@/components/CopyLinkButton";

export const runtime = "nodejs";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStore();
  const rec = await store.getBySlug(slug);
  if (!rec) return { title: "Card not found — AI Era Card" };
  const a = rec.payload.aggregate;
  const rank = eraRank(rec.payload);
  const title = `${rank.title} · ${fmtTokens(a.totalTokens)} tokens`;
  const description = `${a.totalActiveDays} active days · ${a.distinctModels.length} models · via ${sourceLabels(rec.payload).join(", ")}`;
  const url = `${appUrl()}/s/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CardPage({ params }: Props) {
  const { slug } = await params;
  const store = await getStore();
  const rec = await store.getBySlug(slug);
  if (!rec) notFound();

  const host = appUrl().replace(/^https?:\/\//, "");
  const url = `${appUrl()}/s/${slug}`;
  const palette = eraPalette(rec.payload);
  const tweet = shareLine(rec.payload, url);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px 56px",
        gap: 28,
        background: `radial-gradient(900px 480px at 70% 0%, ${palette.glow}, transparent 55%), ${palette.bg}`,
        color: palette.ink,
        fontFamily:
          "var(--font-card-mono), ui-monospace, 'Cascadia Code', Consolas, monospace",
      }}
    >
      <StatsCard payload={rec.payload} slug={slug} host={host} />

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: "center",
        }}
      >
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: palette.bg,
            background: palette.accent,
            padding: "10px 18px",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Share on X
        </a>
        <CopyLinkButton
          url={url}
          accent={palette.accent}
          panel={palette.panel}
          ink={palette.ink}
        />
        <a
          href="/"
          style={{
            color: palette.muted,
            padding: "10px 18px",
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          Make your own →
        </a>
      </div>

      <p
        style={{
          color: palette.muted,
          fontSize: 12,
          textAlign: "center",
          maxWidth: 420,
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        Self-reported · {rec.payload.generatedAt} · rank from your tokens,
        not a game score
      </p>
    </main>
  );
}
