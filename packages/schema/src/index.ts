import { z } from "zod";

// This file IS the privacy contract. Every field that can leave the user's
// machine is enumerated here: aggregate numbers, date-only strings, and
// canonical model ids. No file paths, no project names, no prompt or code
// content can be represented in this schema.

export const SCHEMA_VERSION = 1;

export const LIMITS = {
  maxTotalTokens: 1e11,
  maxCostUsd: 100_000,
  maxModels: 50,
  maxModelNameLength: 80,
  maxHandleLength: 40,
  minDate: "2022-01-01",
} as const;

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD")
  .refine((d) => d >= LIMITS.minDate, "date too far in the past");

const tokens = z.number().int().nonnegative().max(LIMITS.maxTotalTokens);
const costUsd = z.number().nonnegative().max(LIMITS.maxCostUsd);
const count = z.number().int().nonnegative().max(10_000_000);

const modelName = z.string().min(1).max(LIMITS.maxModelNameLength);
const models = z.array(modelName).max(LIMITS.maxModels);

export const claudeCodeSourceSchema = z.object({
  tokensIn: tokens,
  tokensOut: tokens,
  cacheReadTokens: tokens,
  cacheCreationTokens: tokens,
  totalTokens: tokens,
  estimatedCostUsd: costUsd.nullable(),
  costConfidence: z.enum(["estimated", "partial"]),
  sessionCount: count,
  projectCount: count,
  activeDays: count,
  longestStreakDays: count,
  firstActivityDate: dateOnly,
  lastActivityDate: dateOnly,
  models,
});

export const openRouterSourceSchema = z.object({
  // Tokens/requests/models are last-30-day (/activity). totalCostUsd is
  // all-time spend from /credits — nullable if that endpoint fails.
  // Aggregate card totals intentionally omit this cost (mixed windows).
  totalTokens: tokens,
  totalCostUsd: costUsd.nullable(),
  requestCount: count,
  activeDays: count,
  windowDays: z.literal(30),
  models,
});

export const cursorSourceSchema = z.object({
  totalTokens: tokens.nullable(),
  totalCostUsd: costUsd.nullable(),
  requestCount: count,
  activeDays: count,
  dateRange: z.object({ from: dateOnly, to: dateOnly }),
  models,
});

export const aggregateSchema = z.object({
  totalTokens: tokens,
  totalCostUsd: costUsd.nullable(),
  totalActiveDays: count,
  longestStreakDays: count,
  distinctModels: models,
  sourceCount: z.number().int().min(1).max(3),
  firstActivityDate: dateOnly,
  lastActivityDate: dateOnly,
});

export const snapshotPayloadSchema = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    generatedAt: dateOnly,
    cliVersion: z.string().max(20),
    sources: z
      .object({
        claudeCode: claudeCodeSourceSchema.optional(),
        openrouter: openRouterSourceSchema.optional(),
        cursor: cursorSourceSchema.optional(),
      })
      .refine(
        (s) => s.claudeCode || s.openrouter || s.cursor,
        "at least one source is required"
      ),
    aggregate: aggregateSchema,
    display: z.object({
      handle: z
        .string()
        .max(LIMITS.maxHandleLength)
        .regex(/^[\p{L}\p{N} _.-]*$/u, "handle contains invalid characters")
        .nullable(),
    }),
  })
  .strict();

export type ClaudeCodeSource = z.infer<typeof claudeCodeSourceSchema>;
export type OpenRouterSource = z.infer<typeof openRouterSourceSchema>;
export type CursorSource = z.infer<typeof cursorSourceSchema>;
export type Aggregate = z.infer<typeof aggregateSchema>;
export type SnapshotPayload = z.infer<typeof snapshotPayloadSchema>;
