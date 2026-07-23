import { parseArgs } from "node:util";
import { writeFile } from "node:fs/promises";
import * as p from "@clack/prompts";
import { snapshotPayloadSchema, type SnapshotPayload } from "@aieracard/schema";
import {
  collectClaudeCode,
  claudeCodeProjectsDir,
  type ClaudeCodeResult,
} from "./collectors/claudeCode.js";
import {
  collectOpenRouter,
  validateOpenRouterKey,
  type OpenRouterResult,
} from "./collectors/openrouter.js";
import { collectCursorCsv, type CursorResult } from "./collectors/cursorCsv.js";
import {
  collectCursorApi,
  resolveCursorCookie,
} from "./collectors/cursorApi.js";
import { collectCodex, codexSessionsRoots, type CodexResult } from "./collectors/codex.js";
import { buildPayload, CLI_VERSION } from "./merge.js";

const DEFAULT_ENDPOINT = "https://ai-era-card.vercel.app";

const { values: args } = parseArgs({
  options: {
    yes: { type: "boolean", default: false },
    force: { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
    "json-out": { type: "string" },
    "openrouter-key": { type: "string" },
    "cursor-csv": { type: "string" },
    "cursor-cookie": { type: "string" },
    "no-claude-code": { type: "boolean", default: false },
    "no-openrouter": { type: "boolean", default: false },
    "no-cursor": { type: "boolean", default: false },
    "no-codex": { type: "boolean", default: false },
    handle: { type: "string" },
    endpoint: { type: "string" },
    open: { type: "boolean", default: false },
    help: { type: "boolean", default: false },
  },
});

function fmtTokens(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function fmtUsd(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

const RANKS = [
  { level: 1, name: "Foundation", minTokens: 0 },
  { level: 2, name: "Studio", minTokens: 25_000_000 },
  { level: 3, name: "Foundry", minTokens: 150_000_000 },
  { level: 4, name: "Tower", minTokens: 750_000_000 },
  { level: 5, name: "Citadel", minTokens: 2_500_000_000 },
  { level: 6, name: "Arcology", minTokens: 7_500_000_000 },
  { level: 7, name: "Landmark", minTokens: 20_000_000_000 },
  { level: 8, name: "Apex", minTokens: 100_000_000_000 },
] as const;

function eraTitle(totalTokens: number): string {
  const rank = RANKS.findLast((candidate) => totalTokens >= candidate.minTokens)!;
  return `L${rank.level} · ${rank.name.toUpperCase()}`;
}

function renderTextCard(payload: SnapshotPayload): string {
  const { aggregate, display, sources } = payload;
  const sourceNames = {
    claudeCode: "Claude Code",
    codex: "Codex",
    cursor: "Cursor",
    openrouter: "OpenRouter",
  };
  const sourceEntries = Object.entries(sources).map(([source, stats]) => ({
    name: sourceNames[source as keyof typeof sourceNames],
    tokens: stats.totalTokens ?? 0,
  }));
  const totalSourceTokens = sourceEntries.reduce((sum, source) => sum + source.tokens, 0);
  const primarySource = [...sourceEntries].sort((a, b) => b.tokens - a.tokens)[0];
  const primaryShare =
    totalSourceTokens > 0 && primarySource
      ? primarySource.tokens / totalSourceTokens
      : 0;
  const barWidth = 20;
  const filled = Math.round(primaryShare * barWidth);
  const sourceBar = `${"█".repeat(filled)}${"░".repeat(barWidth - filled)}`;
  const rank = RANKS.findLast(
    (candidate) => aggregate.totalTokens >= candidate.minTokens
  )!;
  const mosaic = `${"▓".repeat(rank.level)}${"▒".repeat(8 - rank.level)}`;
  const innerWidth = 62;
  const line = (text: string) => `│ ${text.slice(0, innerWidth).padEnd(innerWidth)} │`;
  const compute =
    aggregate.totalCostUsd != null
      ? `${fmtUsd(aggregate.totalCostUsd)} compute`
      : "compute not reported";

  return [
    `┌${"─".repeat(innerWidth + 2)}┐`,
    line(`AI ERA CARD · ${display.handle || "anonymous"}`),
    line(`${eraTitle(aggregate.totalTokens)} · ${mosaic}`),
    line(`${fmtTokens(aggregate.totalTokens)} tokens`),
    line(`${compute} · ${aggregate.distinctModels.length} models`),
    line(`${aggregate.totalActiveDays} active days · ${aggregate.longestStreakDays}-day streak`),
    line(`Sources: ${sourceEntries.map((source) => source.name).join(" · ")}`),
    line(
      `Usage: ${sourceBar}${primarySource ? ` ${primarySource.name} ${Math.round(primaryShare * 100)}%` : ""}`
    ),
    line("Self-reported · not a game score"),
    `└${"─".repeat(innerWidth + 2)}┘`,
  ].join("\n");
}

function bail(message: string): never {
  p.cancel(message);
  process.exit(1);
}

async function main() {
  if (args.help) {
    console.log(`aieracard v${CLI_VERSION}

Generate a shareable card from your AI tool usage.
Parses usage logs locally and uploads ONLY aggregate numbers.

Usage: npx aieracard [options]

Options:
  --dry-run              build and print the payload, upload nothing
  --json-out <file>      also write the payload to a local file
  --yes                  skip optional source prompts
  --force                skip the upload confirmation (implies --yes)
  --openrouter-key <k>   OpenRouter API key (or OPENROUTER_API_KEY env)
  --cursor-cookie <t>    Cursor web session token (auto-detected if omitted)
  --cursor-csv <path>    usage CSV export (fallback if the API path fails)
  --no-claude-code       skip Claude Code logs
  --no-codex             skip OpenAI Codex CLI logs
  --no-openrouter        skip OpenRouter
  --no-cursor            skip Cursor
  --handle <name>        display name on the card (unverified)
  --endpoint <url>       backend base URL (default: ${DEFAULT_ENDPOINT})
  --open                 open the card URL in your browser`);
    return;
  }

  const interactive = !args.yes && !args.force && process.stdout.isTTY;

  p.intro("aieracard — your AI era, on one card");
  p.log.info(
    "Privacy: everything is parsed locally. Only aggregate numbers\n(tokens, costs, model names, dates) ever leave this machine —\nnever prompts, code, file paths, or project names."
  );

  // --- Claude Code ---
  let claudeCode: ClaudeCodeResult | null = null;
  if (!args["no-claude-code"]) {
    const s = p.spinner();
    s.start(`Scanning Claude Code logs (${claudeCodeProjectsDir()})`);
    claudeCode = await collectClaudeCode();
    if (claudeCode) {
      s.stop(
        `Claude Code: ${fmtTokens(claudeCode.source.totalTokens)} tokens across ` +
          `${claudeCode.source.sessionCount} sessions (${claudeCode.filesParsed} log files)`
      );
    } else {
      s.stop("Claude Code: no local logs found — skipping");
    }
  }

  // --- Codex CLI ---
  let codex: CodexResult | null = null;
  if (!args["no-codex"]) {
    const s = p.spinner();
    s.start(`Scanning Codex logs (${codexSessionsRoots().join(", ")})`);
    codex = await collectCodex();
    if (codex) {
      s.stop(
        `Codex: ${fmtTokens(codex.source.totalTokens)} tokens across ` +
          `${codex.source.sessionCount} sessions (${codex.filesParsed} log files)`
      );
    } else {
      s.stop("Codex: no local session logs found — skipping");
    }
  }

  // --- OpenRouter ---
  let openrouter: OpenRouterResult | null = null;
  if (!args["no-openrouter"]) {
    let key = args["openrouter-key"] ?? process.env.OPENROUTER_API_KEY ?? "";
    if (!key && interactive) {
      const answer = await p.password({
        message:
          "OpenRouter API key (optional — Enter to skip; used read-only for /credits and /activity)",
        mask: "*",
        validate: () => undefined,
      });
      if (!p.isCancel(answer) && answer) key = answer;
    }
    if (key) {
      const s = p.spinner();
      s.start("Validating OpenRouter key");
      if (await validateOpenRouterKey(key)) {
        s.message("Fetching OpenRouter usage");
        try {
          openrouter = await collectOpenRouter(key);
          for (const w of openrouter?.warnings ?? []) {
            p.log.warn(`OpenRouter: ${w}`);
          }
          if (openrouter) {
            const spend =
              openrouter.source.totalCostUsd != null
                ? `$${openrouter.source.totalCostUsd} all-time spend (not rolled into card total)`
                : "spend unknown";
            s.stop(
              `OpenRouter: ${fmtTokens(openrouter.source.totalTokens)} tokens (last 30 days), ${spend}`
            );
          } else {
            s.stop("OpenRouter: no usage found — skipping");
          }
        } catch (e: any) {
          openrouter = null;
          s.stop(`OpenRouter: ${e.message} — skipping`);
        }
      } else {
        s.stop(
          "OpenRouter: key invalid or not a management key — skipping"
        );
      }
    }
  }

  // --- Cursor ---
  let cursor: CursorResult | null = null;
  if (!args["no-cursor"] && !args["cursor-csv"]) {
    // All-time usage via the dashboard API. The session token is resolved
    // locally (flag → env → Cursor's own auth store) and sent only to
    // cursor.com — never to our server.
    const cookie = await resolveCursorCookie(args["cursor-cookie"]);
    if (cookie) {
      const s = p.spinner();
      s.start("Cursor: fetching all-time usage from cursor.com");
      try {
        const result = await collectCursorApi(cookie, (fetched, total) =>
          s.message(`Cursor: ${fetched}/${total} usage events`)
        );
        if (result) {
          cursor = result;
          for (const warning of result.warnings) {
            p.log.warn(`Cursor: ${warning}`);
          }
          s.stop(
            `Cursor: ${fmtTokens(result.source.totalTokens ?? 0)} tokens, ` +
              `${result.source.requestCount} events since ${result.source.dateRange.from}` +
              (result.email ? ` (${result.email})` : "")
          );
        } else {
          s.stop("Cursor: no usage found — skipping");
        }
      } catch (e: any) {
        s.stop(
          interactive
            ? `Cursor API failed (${e.message}) — falling back to CSV`
            : `Cursor API failed (${e.message})`
        );
        if (!interactive) {
          bail(
            "Cursor was not included. Re-run interactively (without --yes or --force) to provide a CSV, " +
              "pass --cursor-csv <path>, or explicitly opt out with --no-cursor."
          );
        }
      }
    } else if (args["cursor-cookie"] !== undefined) {
      p.log.error("Cursor: could not resolve a session token from the given value");
    }
  }
  if (!args["no-cursor"] && !cursor) {
    let csvPath = args["cursor-csv"] ?? "";
    if (!csvPath && interactive) {
      const answer = await p.text({
        message:
          "Cursor usage CSV (optional — Enter to skip).\n  Export it from cursor.com/dashboard → Usage → Export CSV, then paste the file path:",
        placeholder: "C:\\Users\\you\\Downloads\\cursor-usage.csv",
      });
      if (!p.isCancel(answer) && answer) csvPath = answer.trim().replace(/^"|"$/g, "");
    }
    if (csvPath) {
      try {
        cursor = await collectCursorCsv(csvPath);
        for (const w of cursor.warnings) p.log.warn(`Cursor CSV: ${w}`);
        p.log.success(
          `Cursor: ${cursor.source.requestCount} requests` +
            (cursor.source.totalCostUsd != null
              ? `, $${cursor.source.totalCostUsd}`
              : "")
        );
      } catch (e: any) {
        p.log.error(`Cursor CSV: ${e.message} — skipping`);
      }
    }
  }

  if (!claudeCode && !openrouter && !cursor && !codex) {
    bail(
      "No usage sources found or supplied. Nothing to build a card from.\nTry Claude Code, Codex CLI, --openrouter-key, or --cursor-csv."
    );
  }

  // --- Handle ---
  let handle: string | null = args.handle ?? null;
  if (!handle && interactive) {
    const answer = await p.text({
      message: "Display name on the card (optional — Enter to skip):",
      placeholder: "anonymous",
    });
    if (!p.isCancel(answer) && answer) handle = answer.trim().slice(0, 40);
  }

  // --- Build + validate locally against the shared schema ---
  const payload: SnapshotPayload = buildPayload({
    claudeCode,
    openrouter,
    cursor,
    codex,
    handle,
  });
  const parsed = snapshotPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    bail(`Internal error: payload failed schema validation:\n${parsed.error.message}`);
  }

  // --- Preview: the exact bytes that would leave this machine ---
  const json = JSON.stringify(payload, null, 2);
  p.log.step("This is EVERYTHING that will be uploaded — nothing else:");
  console.log(json);

  if (args["json-out"]) {
    await writeFile(args["json-out"], json, "utf8");
    p.log.success(`Payload written to ${args["json-out"]}`);
  }

  if (args["dry-run"]) {
    console.log(renderTextCard(payload));
    p.outro("Dry run — nothing was uploaded.");
    return;
  }

  if (!args.force) {
    const ok = await p.confirm({
      message: "Upload these aggregate numbers and create your card?",
    });
    if (p.isCancel(ok) || !ok) {
      p.outro("Cancelled — nothing was uploaded.");
      return;
    }
  }

  // --- Upload ---
  const endpoint = (args.endpoint ?? DEFAULT_ENDPOINT).replace(/\/$/, "");
  const s = p.spinner();
  s.start("Uploading");
  let res: Response;
  try {
    res = await fetch(`${endpoint}/api/snapshots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: json,
    });
  } catch (e: any) {
    s.stop("Upload failed");
    bail(`Could not reach ${endpoint}: ${e.message}`);
  }
  if (!res.ok) {
    s.stop("Upload failed");
    const body = await res.text().catch(() => "");
    bail(`Server returned ${res.status}: ${body.slice(0, 300)}`);
  }
  const { url } = (await res.json()) as { slug: string; url: string };
  s.stop("Card created");
  p.log.success(`Your permanent card URL:\n  ${url}`);
  console.log(renderTextCard(payload));

  if (args.open) {
    const { exec } = await import("node:child_process");
    const cmd =
      process.platform === "win32"
        ? `start "" "${url}"`
        : process.platform === "darwin"
          ? `open "${url}"`
          : `xdg-open "${url}"`;
    exec(cmd);
  }
  p.outro("Share it. Flex responsibly.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
