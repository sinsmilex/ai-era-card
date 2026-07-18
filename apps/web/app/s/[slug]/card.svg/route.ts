import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/db";
import { buildMosaic } from "@/lib/mosaic";
import { cardTheme as t } from "@/components/cardTheme";
import { appUrl, fmtMonthYear, fmtTokens } from "@/lib/format";

// GitHub README badge: hand-built SVG (shields.io-style), not Satori —
// native <text> keeps it tiny, dependency-free, and readable through
// GitHub's camo image proxy. Embed:
//   [![My AI era](.../s/SLUG/card.svg)](.../s/SLUG)
export const runtime = "nodejs";

const W = 640;
const H = 200;
const SANS =
  "system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO =
  "ui-monospace,'Cascadia Mono','Segoe UI Mono',Menlo,Consolas,monospace";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const store = await getStore();
  const rec = await store.getBySlug(slug);
  if (!rec) {
    return new NextResponse("Not found", { status: 404 });
  }

  const p = rec.payload;
  const a = p.aggregate;
  const host = appUrl().replace(/^https?:\/\//, "");
  const handle = p.display.handle ? ` · ${esc(p.display.handle)}` : "";

  // Mini mosaic: 6×4 grid, top-right.
  const mosaic = buildMosaic(p, 24);
  const cells = mosaic
    .map((c, i) => {
      const x = W - 24 - (6 - (i % 6)) * 15;
      const y = 22 + Math.floor(i / 6) * 15;
      return `<rect x="${x}" y="${y}" width="11" height="11" rx="2" fill="${c.color}"/>`;
    })
    .join("");

  const metrics = [
    { v: String(a.totalActiveDays), l: "active days" },
    { v: String(a.longestStreakDays), l: "day streak" },
    { v: String(a.distinctModels.length), l: "models" },
  ]
    .map((m, i) => {
      const x = 28 + i * 120;
      return (
        `<text x="${x}" y="150" font-family="${MONO}" font-size="22" fill="${t.text}">${esc(m.v)}</text>` +
        `<text x="${x}" y="170" font-family="${SANS}" font-size="11" fill="${t.muted}">${esc(m.l)}</text>`
      );
    })
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="AI Era Card: ${fmtTokens(a.totalTokens)} tokens">
  <rect width="${W}" height="${H}" rx="14" fill="${t.bg}"/>
  ${cells}
  <text x="28" y="38" font-family="${MONO}" font-size="11" letter-spacing="2" fill="${t.muted}">AI ERA CARD${handle}</text>
  <text x="28" y="86" font-family="${MONO}" font-size="42" font-weight="600" fill="${t.text}">${fmtTokens(a.totalTokens)}</text>
  <text x="28" y="110" font-family="${SANS}" font-size="13" fill="${t.muted}">tokens processed · since ${esc(fmtMonthYear(a.firstActivityDate))}</text>
  ${metrics}
  <text x="${W - 24}" y="170" text-anchor="end" font-family="${MONO}" font-size="12" fill="${t.link}">${esc(host)}/s/${esc(slug)}</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // GitHub camo respects this; ~1h staleness is fine for a badge.
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
