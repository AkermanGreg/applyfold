import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { gte, sql } from "drizzle-orm";
import type { z } from "zod";

import { db, schema } from "@/db";
import { requireServerEnv, serverEnv } from "@/lib/env";

import { estimateCostUsd, MODELS, type TokenUsage } from "./pricing";

export class AiBudgetExceededError extends Error {
  constructor() {
    super("The monthly AI budget is used up. Try again next month.");
    this.name = "AiBudgetExceededError";
  }
}

export class AiOutputError extends Error {
  constructor(
    message: string,
    public readonly stopReason: string | null,
  ) {
    super(message);
    this.name = "AiOutputError";
  }
}

let client: Anthropic | undefined;
const anthropic = () => (client ??= new Anthropic({ apiKey: requireServerEnv("ANTHROPIC_API_KEY") }));

function monthStartUtc(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** Global kill switch: refuse new AI work once this month's estimated spend hits the ceiling. */
export async function assertWithinBudget() {
  const [row] = await db()
    .select({ spent: sql<number>`coalesce(sum(${schema.aiUsage.costUsd}), 0)` })
    .from(schema.aiUsage)
    .where(gte(schema.aiUsage.createdAt, monthStartUtc()));
  if (Number(row?.spent ?? 0) >= serverEnv().AI_MONTHLY_BUDGET_USD) throw new AiBudgetExceededError();
}

async function recordUsage(input: { userId: string | null; purpose: string; model: string; usage: TokenUsage }) {
  const { usage } = input;
  await db()
    .insert(schema.aiUsage)
    .values({
      userId: input.userId,
      purpose: input.purpose,
      model: input.model,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      cacheReadTokens: usage.cache_read_input_tokens ?? 0,
      cacheWriteTokens: usage.cache_creation_input_tokens ?? 0,
      costUsd: estimateCostUsd(input.model, usage),
    });
}

type StructuredRequest<T extends z.ZodType> = {
  purpose: string;
  userId: string | null;
  tier: keyof typeof MODELS;
  /** Stable instructions first; the last block gets the cache breakpoint. */
  system: Anthropic.TextBlockParam[];
  content: Anthropic.ContentBlockParam[];
  schema: T;
  effort?: "low" | "medium" | "high";
  maxTokens?: number;
};

/**
 * One structured call: budget check → request → schema-validated output → usage logged.
 * Drafting uses Opus with the server-side refusal fallback; scoring uses Haiku (no fallback
 * exists for Haiku, so a refusal surfaces as an error the caller can show).
 */
export async function generateStructured<T extends z.ZodType>(request: StructuredRequest<T>): Promise<z.infer<T>> {
  await assertWithinBudget();
  const model = MODELS[request.tier];
  const system = request.system.map((block, index) =>
    index === request.system.length - 1 ? { ...block, cache_control: { type: "ephemeral" as const } } : block,
  );
  const common = {
    model,
    max_tokens: request.maxTokens ?? 8_000,
    system,
    messages: [{ role: "user" as const, content: request.content }],
  };

  const response =
    request.tier === "draft"
      ? await anthropic().beta.messages.parse({
          ...common,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          output_config: { format: betaZodOutputFormat(request.schema), effort: request.effort ?? "medium" },
        })
      : await anthropic().messages.parse({
          ...common,
          output_config: { format: zodOutputFormat(request.schema), effort: request.effort ?? "low" },
        });

  await recordUsage({ userId: request.userId, purpose: request.purpose, model: response.model, usage: response.usage });

  if (response.stop_reason === "refusal") {
    throw new AiOutputError("The model declined this request.", response.stop_reason);
  }
  if (response.stop_reason === "max_tokens" || response.parsed_output == null) {
    throw new AiOutputError("The model's answer was incomplete. Please try again.", response.stop_reason);
  }
  return response.parsed_output as z.infer<T>;
}
