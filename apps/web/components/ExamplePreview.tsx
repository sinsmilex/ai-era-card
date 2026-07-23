"use client";

import { beacon } from "@/lib/beacon";
import { cardTheme as t } from "./cardTheme";

// Compact static preview of the example card's OG image, linking to it.
// The card is the emotional hook (C18); showing it inline lets it work
// without burying the install command above it. Clicks fire preview_click.
export function ExamplePreview({
  href,
  imageSrc,
  slug,
}: {
  href: string;
  imageSrc: string;
  slug: string;
}) {
  return (
    <a
      href={href}
      onClick={() => beacon("preview_click", slug)}
      style={{
        display: "block",
        maxWidth: 440,
        borderRadius: 12,
        overflow: "hidden",
        border: `1px solid ${t.chipBg}`,
        lineHeight: 0,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt="Example AI Era Card — 1.4B tokens, L4 Tower"
        width={1200}
        height={630}
        style={{ width: "100%", height: "auto", display: "block" }}
      />
    </a>
  );
}
