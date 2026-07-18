import Link from "next/link";

const mono = "'JetBrains Mono', Consolas, monospace";

export default function Home() {
  return (
    <main
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "80px 24px",
        lineHeight: 1.6,
      }}
    >
      <h1 style={{ fontFamily: mono, fontSize: 32, marginBottom: 8 }}>
        AI Era Card
      </h1>
      <p style={{ color: "#8b949e", fontSize: 18, marginTop: 0 }}>
        Your AI usage — tokens, streaks, models — on one permanent, shareable
        card. Like a year-in-review, except you can make one any day.
      </p>

      <div
        style={{
          background: "#161c22",
          borderRadius: 12,
          padding: "18px 22px",
          margin: "32px 0",
          fontFamily: mono,
          fontSize: 16,
        }}
      >
        npx aieracard
      </div>

      <h2 style={{ fontSize: 18 }}>How it works</h2>
      <ol style={{ color: "#c9d1d9", paddingLeft: 20 }}>
        <li>
          The CLI reads your <b>Claude Code</b> logs locally, optionally pulls
          your <b>OpenRouter</b> stats via API key, and accepts a{" "}
          <b>Cursor</b> usage CSV.
        </li>
        <li>
          It shows you the exact JSON before anything is uploaded —{" "}
          <b>aggregate numbers only</b>. Never prompts, code, file paths, or
          project names.
        </li>
        <li>You get a permanent URL to a card that unfurls beautifully.</li>
      </ol>

      <p style={{ color: "#8b949e" }}>
        <Link href="/privacy" style={{ color: "#58a6ff" }}>
          Read the privacy contract
        </Link>{" "}
        — the full schema of what leaves your machine.
      </p>
    </main>
  );
}
