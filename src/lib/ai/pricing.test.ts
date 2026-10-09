import { describe, expect, it } from "vitest";

import { estimateCostUsd } from "./pricing";

describe("estimateCostUsd", () => {
  it("prices a typical tailored application on Opus 5.5", () => {
    // 2.5k fresh input, 4k cached profile read, 3k output
    const cost = estimateCostUsd("claude-opus-5-5", {
      input_tokens: 2_500,
      output_tokens: 3_000,
      cache_read_input_tokens: 4_000,
      cache_creation_input_tokens: 0,
    });
    expect(cost).toBeCloseTo(0.0708, 4);
  });

  it("prices Haiku scoring at a fraction of a cent", () => {
    expect(estimateCostUsd("claude-haiku-5-5", { input_tokens: 6_000, output_tokens: 800 })).toBeCloseTo(0.001, 4);
  });

  it("prices unknown models as Opus so the budget errs high", () => {
    const usage = { input_tokens: 1_000_000, output_tokens: 0 };
    expect(estimateCostUsd("claude-mystery", usage)).toBe(estimateCostUsd("claude-opus-5-5", usage));
  });
});
