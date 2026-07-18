import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/db";
import { appUrl, fmtTokens } from "@/lib/format";
import { StatsCard, sourceLabels } from "@/components/StatsCard";

export const runtime = "nodejs";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStore();
  const rec = await store.getBySlug(slug);
  if (!rec) return { title: "Card not found — AI Era Card" };
  const a = rec.payload.aggregate;
  const title = `${fmtTokens(a.totalTokens)} tokens in the AI era`;
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
  const tweet = `My AI era so far: ${fmtTokens(rec.payload.aggregate.totalTokens)} tokens. ${url}`;

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        gap: 24,
      }}
    >
      <StatsCard payload={rec.payload} slug={slug} host={host} />
      <div style={{ display: "flex", gap: 12 }}>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#e6edf3",
            background: "#161c22",
            padding: "10px 18px",
            borderRadius: 8,
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          Share on X
        </a>
        <a
          href="/"
          style={{
            color: "#8b949e",
            padding: "10px 18px",
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          Make your own →
        </a>
      </div>
      <p style={{ color: "#484f58", fontSize: 12 }}>
        Self-reported stats · generated {rec.payload.generatedAt}
      </p>
    </main>
  );
}
