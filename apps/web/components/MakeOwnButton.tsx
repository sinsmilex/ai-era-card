"use client";

import { beacon } from "@/lib/beacon";

// The card page is seen mostly by people who don't own that card; their one
// growth action is "make your own." Promote it to a prominent button (C16)
// and record the click (card_cta) as the card-page -> homepage signal.
export function MakeOwnButton({
  accent,
  bg,
}: {
  accent: string;
  bg: string;
}) {
  return (
    <a
      href="/"
      onClick={() => beacon("card_cta")}
      style={{
        color: bg,
        background: accent,
        padding: "12px 22px",
        borderRadius: 8,
        textDecoration: "none",
        fontSize: 15,
        fontWeight: 600,
      }}
    >
      Make your own →
    </a>
  );
}
