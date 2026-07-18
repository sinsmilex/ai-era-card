import Link from "next/link";
import { cardTheme as t } from "@/components/cardTheme";

const EXAMPLE = "https://ai-era-card.vercel.app/s/mmi5GrqvJt";

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
            marginBottom: 28,
          }}
        >
          <code
            style={{
              fontFamily: t.mono,
              fontSize: 16,
              color: t.text,
              background: t.panel,
              border: `1px solid ${t.chipBg}`,
              borderRadius: t.panelRadius,
              padding: "14px 18px",
            }}
          >
            npx aieracard
          </code>
          <a
            href={EXAMPLE}
            style={{
              fontFamily: t.mono,
              fontSize: 14,
              color: t.link,
              textDecoration: "none",
            }}
          >
            See an example →
          </a>
        </div>

        <p style={{ fontSize: 14, color: t.muted, margin: "0 0 48px" }}>
          Reads Claude Code, Codex, and Cursor usage on your machine. Optional
          OpenRouter key. Shows the exact JSON before upload.{" "}
          <Link href="/privacy" style={{ color: t.link }}>
            Privacy contract
          </Link>
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
