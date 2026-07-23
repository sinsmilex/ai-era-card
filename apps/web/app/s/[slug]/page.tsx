import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/db";
import { track } from "@/lib/track";
import { appUrl, fmtTokens } from "@/lib/format";
import { eraPalette, eraRank, linkedInShareLine, shareLine } from "@/lib/eraRank";
import { StatsCard } from "@/components/StatsCard";
import { sourceLabels } from "@/lib/sourceStats";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { CopyTextButton } from "@/components/CopyTextButton";
import { MakeOwnButton } from "@/components/MakeOwnButton";

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
  await track(slug, "page", await headers());

  const host = appUrl().replace(/^https?:\/\//, "");
  const url = `${appUrl()}/s/${slug}`;
  const palette = eraPalette(rec.payload);
  const tweet = shareLine(rec.payload, url);
  const linkedInPost = linkedInShareLine(rec.payload, url);
  const badgeMarkdown = `[![My AI era](${url}/card.svg)](${url})`;

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

      <MakeOwnButton accent={palette.accent} bg={palette.bg} />

      <p
        style={{
          color: palette.muted,
          fontSize: 12,
          textAlign: "center",
          maxWidth: 500,
          lineHeight: 1.5,
          margin: "-12px 0 0",
        }}
      >
        Self-reported aggregate statistics. Only token counts, dates, and model
        IDs leave your machine—never prompts, code, or paths.{" "}
        <a href="/privacy" style={{ color: palette.accent }}>
          Read the privacy contract.
        </a>
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: "center",
        }}
      >
        <CopyLinkButton
          url={url}
          accent={palette.accent}
          panel={palette.panel}
          ink={palette.ink}
        />
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
      </div>

      <section
        aria-label="Share on LinkedIn"
        style={{
          width: "100%",
          maxWidth: 680,
          background: palette.panel,
          border: `1px solid ${palette.accentSoft}`,
          borderRadius: 12,
          padding: "18px 20px",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: palette.ink }}>
          Share on LinkedIn
        </div>
        <p
          style={{
            color: palette.muted,
            fontSize: 12,
            lineHeight: 1.5,
            margin: "6px 0 14px",
          }}
        >
          Post the image natively, then add this card&apos;s link in the first
          comment.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <CopyTextButton
            text={linkedInPost}
            label="Copy post text"
            accent={palette.accent}
            panel={palette.bg}
            ink={palette.ink}
          />
          <a
            href={`${url}/opengraph-image`}
            download={`ai-era-card-${slug}.png`}
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
            Download image
          </a>
        </div>
      </section>

      <section
        aria-label="Add to GitHub README"
        style={{
          width: "100%",
          maxWidth: 680,
          padding: "0 20px",
        }}
      >
        <div style={{ fontSize: 12, color: palette.muted, marginBottom: 10 }}>
          Add to GitHub README
        </div>
        <CopyTextButton
          text={badgeMarkdown}
          label="Copy README badge"
          accent={palette.accent}
          panel={palette.panel}
          ink={palette.ink}
        />
      </section>
    </main>
  );
}
