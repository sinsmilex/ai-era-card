import Link from "next/link";
import { cardTheme as t } from "@/components/cardTheme";
import { HomeCommand } from "@/components/HomeCommand";
import { ExamplePreview } from "@/components/ExamplePreview";
import { appUrl } from "@/lib/format";

const EXAMPLE_SLUG = "mmi5GrqvJt";
const EXAMPLE = `${appUrl()}/s/${EXAMPLE_SLUG}`;

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        background: `radial-gradient(1200px 600px at 80% -10%, #1a2430 0%, transparent 55%),
          radial-gradient(900px 500px at -10% 80%, #152018 0%, transparent 50%),
          ${t.bg}`,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.35,
          backgroundImage:
            "linear-gradient(rgba(230,237,243,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(230,237,243,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse at 50% 30%, black 20%, transparent 70%)",
        }}
      />

      <div
        style={{
          position: "relative",
          maxWidth: 720,
          margin: "0 auto",
          padding: "min(18vh, 140px) 24px 80px",
        }}
      >
        <p
          style={{
            fontFamily: t.mono,
            fontSize: 12,
            letterSpacing: 3,
            color: t.accent,
            margin: "0 0 20px",
          }}
        >
          AI ERA CARD
        </p>

        <h1
          style={{
            fontFamily: t.mono,
            fontSize: "clamp(40px, 8vw, 64px)",
            fontWeight: 500,
            letterSpacing: -1.5,
            lineHeight: 1.05,
            color: t.text,
            margin: "0 0 20px",
          }}
        >
          Your AI usage,
          <br />
          one permanent card.
        </h1>

        <p
          style={{
            fontSize: 18,
            lineHeight: 1.55,
            color: t.muted,
            maxWidth: 480,
            margin: "0 0 36px",
          }}
        >
          Local parse. Aggregate numbers only. A shareable URL that unfurls
          when you post it — any day, not once a year.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <HomeCommand />
        </div>

        <p
          style={{
            fontSize: 13,
            color: t.muted,
            margin: "0 0 28px",
            fontFamily: t.mono,
          }}
        >
          Requires Node 18.17+ and a supported local AI tool.
        </p>

        <ExamplePreview
          href={EXAMPLE}
          imageSrc={`${EXAMPLE}/opengraph-image`}
          slug={EXAMPLE_SLUG}
        />

        <p style={{ fontSize: 14, color: t.muted, margin: "20px 0 48px" }}>
          Reads Claude Code, Codex, and Cursor usage on your machine. Optional
          OpenRouter key. Shows the exact JSON before upload.{" "}
          <Link href="/privacy" style={{ color: t.link }}>
            Privacy contract
          </Link>
          {" · "}
          <a
            href="https://github.com/sinsmilex/ai-era-card"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: t.link }}
          >
            Source on GitHub
          </a>
          .
        </p>

        <ol
          style={{
            margin: 0,
            padding: 0,
            listStyle: "none",
            display: "grid",
            gap: 18,
            color: t.muted,
            fontSize: 15,
            lineHeight: 1.5,
          }}
        >
          <li>
            <span style={{ color: t.accent, fontFamily: t.mono }}>01</span>
            {"  "}
            Collect locally — Claude Code + Codex JSONL, Cursor session API
            (CSV fallback), optional OpenRouter.
          </li>
          <li>
            <span style={{ color: t.accent, fontFamily: t.mono }}>02</span>
            {"  "}
            Preview aggregates only — never prompts, paths, or project names.
          </li>
          <li>
            <span style={{ color: t.accent, fontFamily: t.mono }}>03</span>
            {"  "}
            Get a permanent card URL built for sharing.
          </li>
        </ol>
      </div>
    </main>
  );
}
