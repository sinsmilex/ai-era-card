import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/db";
import { track } from "@/lib/track";
import { buildBuilding, buildingBounds } from "@/lib/mosaic";
import { eraPalette, eraRank } from "@/lib/eraRank";
import { appUrl, fmtMonthYear, fmtTokens } from "@/lib/format";

// GitHub README badge: hand-built SVG (shields.io-style, not Satori) —
// native <text> keeps it tiny, dependency-free, and readable through
// GitHub's camo image proxy. Shares rank/palette/building with the card.
// Embed:
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
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const store = await getStore();
  const rec = await store.getBySlug(slug);
  if (!rec) {
    return new NextResponse("Not found", { status: 404 });
  }
  await track(slug, "badge", req.headers);

  const p = rec.payload;
  const a = p.aggregate;
  const palette = eraPalette(p);
  const rank = eraRank(p);
  const host = appUrl().replace(/^https?:\/\//, "");
  const handle = p.display.handle ? ` · ${esc(p.display.handle)}` : "";

  // Territory building, bottom-right, same geometry as the card.
  const CELL = 15;
  const blocks = buildBuilding(p);
  const b = buildingBounds(blocks);
  const bw = (b.maxX - b.minX + 1) * CELL;
  const bh = (b.maxY - b.minY + 1) * CELL;
  const bx = W - 26 - bw;
  const by = H - 30 - bh;
  const building = blocks
    .map(
      (bl) =>
        `<rect x="${bx + (bl.x - b.minX) * CELL}" y="${by + (bl.y - b.minY) * CELL}" width="${CELL - 4}" height="${CELL - 4}" rx="2" fill="${bl.color}"/>`
    )
    .join("");

  // Rank pill after the header line.
  const headerText = `AI ERA CARD${handle}`;
  const pillX = 28 + headerText.length * 8.2 + 14;
  const pillW = rank.title.length * 7.4 + 20;

  const metrics = [
    { v: String(a.totalActiveDays), l: "active days" },
    { v: String(a.longestStreakDays), l: "day streak" },
    { v: String(a.distinctModels.length), l: "models" },
  ]
    .map((m, i) => {
      const x = 28 + i * 118;
      return (
        `<text x="${x}" y="150" font-family="${MONO}" font-size="22" fill="${palette.ink}">${esc(m.v)}</text>` +
        `<text x="${x}" y="170" font-family="${SANS}" font-size="11" fill="${palette.muted}">${esc(m.l)}</text>`
      );
    })
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="AI Era Card: ${rank.title}, ${fmtTokens(a.totalTokens)} tokens">
  <rect width="${W}" height="${H}" rx="14" fill="${palette.bg}"/>
  ${building}
  <text x="28" y="39" font-family="${MONO}" font-size="11" letter-spacing="2" fill="${palette.muted}">${esc(headerText)}</text>
  <rect x="${pillX}" y="26" width="${pillW}" height="19" rx="9.5" fill="${palette.accent}"/>
  <text x="${pillX + pillW / 2}" y="39" text-anchor="middle" font-family="${MONO}" font-size="11" font-weight="700" fill="${palette.bg}">${esc(rank.title)}</text>
  <text x="28" y="88" font-family="${MONO}" font-size="42" font-weight="600" fill="${palette.ink}">${fmtTokens(a.totalTokens)}</text>
  <text x="28" y="112" font-family="${SANS}" font-size="13" fill="${palette.muted}">tokens processed · since ${esc(fmtMonthYear(a.firstActivityDate))}</text>
  ${metrics}
  <text x="${W - 26}" y="${H - 10}" text-anchor="end" font-family="${MONO}" font-size="11" fill="${palette.accent}">${esc(host)}</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
