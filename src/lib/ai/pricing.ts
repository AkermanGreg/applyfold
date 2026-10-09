/** Models by job. Opus writes what a recruiter reads; Haiku handles high-volume scoring. */
export const MODELS = {
  draft: "claude-opus-5-5",
  fast: "claude-haiku-5-5",
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

type Rates = { input: number; output: number; cacheRead: number; cacheWrite: number };

/** USD per million tokens (Oct 2026 list prices; cache write = 5-minute TTL, 1.25x input). */
const RATES: Record<ModelId, Rates> = {
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125 },
};

export type TokenUsage = {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
};

export function estimateCostUsd(model: string, usage: TokenUsage): number {
  // Unknown model (e.g. a fallback answered): price it as Opus so the budget errs high.
  const rates = RATES[model as ModelId] ?? RATES["claude-opus-5-5"];
  const cost =
    usage.input_tokens * rates.input +
    usage.output_tokens * rates.output +
    (usage.cache_read_input_tokens ?? 0) * rates.cacheRead +
    (usage.cache_creation_input_tokens ?? 0) * rates.cacheWrite;
  return cost / 1_000_000;
}
