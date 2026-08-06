import type { SnapshotPayload } from "./index.js";
import { eraRankTitle } from "./ranks";

const SHARE_SOURCES = [
  { key: "claudeCode", label: "Claude Code" },
  { key: "codex", label: "Codex" },
  { key: "cursor", label: "Cursor" },
  { key: "openrouter", label: "OpenRouter" },
] as const;

/** A compact, paste-ready caption for a public card URL. */
export function buildShareCaption(
  payload: SnapshotPayload,
  url: string,
  fmtTokens: (tokens: number) => string
): string {
  const sources = SHARE_SOURCES.filter(({ key }) => payload.sources[key])
    .sort((a, b) => sourceTokens(payload, b.key) - sourceTokens(payload, a.key))
    .slice(0, 3)
    .map(({ label }) => label)
    .join(" + ");
  const who = payload.display.handle
    ? `${payload.display.handle}'s AI coding card`
    : "My AI coding card";

  return `${who}: ${eraRankTitle(payload.aggregate.totalTokens)} · ${fmtTokens(payload.aggregate.totalTokens)} tokens · ${sources}\n${url}`;
}

function sourceTokens(
  payload: SnapshotPayload,
  key: (typeof SHARE_SOURCES)[number]["key"]
): number {
  const source = payload.sources[key];
  return source?.totalTokens ?? 0;
}
