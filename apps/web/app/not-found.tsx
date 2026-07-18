import Link from "next/link";
import { cardTheme as t } from "@/components/cardTheme";

export default function NotFound() {
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
        <p
          style={{
            fontFamily: t.mono,
            fontSize: 12,
            letterSpacing: 2,
            color: t.muted,
            marginBottom: 12,
          }}
        >
          404
        </p>
        <h1 style={{ fontFamily: t.mono, fontSize: 28, margin: "0 0 12px" }}>
          Card not found
        </h1>
        <p style={{ color: t.muted, marginBottom: 24 }}>
          That snapshot link doesn&apos;t exist — or was never uploaded.
        </p>
        <Link
          href="/"
          style={{
            fontFamily: t.mono,
            color: t.link,
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          Make your own →
        </Link>
      </div>
    </main>
  );
}
