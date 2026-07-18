"use client";

import { cardTheme as t } from "@/components/cardTheme";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: t.bg,
        color: t.text,
        textAlign: "center",
      }}
    >
      <div>
        <h1 style={{ fontFamily: t.mono, fontSize: 28, margin: "0 0 12px" }}>
          Something broke
        </h1>
        <p style={{ color: t.muted, marginBottom: 24 }}>
          Try again — if it keeps happening, the deploy may be mid-rollout.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            fontFamily: t.mono,
            fontSize: 14,
            color: t.text,
            background: t.panel,
            border: "none",
            borderRadius: t.panelRadius,
            padding: "10px 18px",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    </main>
  );
}
