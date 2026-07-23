export function fmtTokens(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export function fmtUsd(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

// A source's token share as a percent that never reads "0%" for a real,
// non-zero source — a tiny slice (e.g. a little Claude Code next to heavy
// Cursor use) shows a decimal instead of rounding away to zero.
export function fmtShare(share: number): string {
  const pct = share * 100;
  if (pct <= 0) return "0%";
  if (pct >= 10) return `${Math.round(pct)}%`; // 77%
  if (pct >= 1) return `${pct.toFixed(1)}%`; // 2.4%
  if (pct >= 0.1) return `${pct.toFixed(1)}%`; // 0.4%
  return "<0.1%"; // 0.03% → "<0.1%", never "0%"
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function fmtMonthYear(dateOnly: string): string {
  const [y, m] = dateOnly.split("-");
  return `${MONTHS[parseInt(m, 10) - 1]} ${y}`;
}

// ~587K tokens per copy of War and Peace (~2.5 chars/token, ~1.4M chars)
export function warAndPeaceEquivalent(tokens: number): number {
  return Math.max(1, Math.round(tokens / 587_000));
}

export function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
  );
}
