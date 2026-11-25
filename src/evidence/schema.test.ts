import { describe, expect, it } from "vitest";
import baseline from "../../fixtures/lab/baseline.json";
import { labRunSchema } from "./schema";

describe("versioned lab boundary", () => {
  it("retains actual zero and missing as different values", () => {
    const input = structuredClone(baseline);
    delete (input.samples[0]!.metrics as { tbt?: number }).tbt;
    const run = labRunSchema.parse(input);
    expect(run.samples[0]!.metrics.cls).toBe(0);
    expect(run.samples[0]!.metrics.tbt).toBeUndefined();
  });
  it.each([
    { schemaVersion: 2 },
    { environment: {} },
    { revision: "main" },
    { samples: Array(101).fill(baseline.samples[0]) },
    { samples: [baseline.samples[0], baseline.samples[0]] },
    { samples: [{ ...baseline.samples[0], metrics: { lcp: -1 } }] },
    { samples: [{ ...baseline.samples[0], metrics: { tbt: Infinity } }] },
    { samples: [{ ...baseline.samples[0], metrics: { inp: 100 } }] },
  ])("rejects invalid evidence %j", (patch) => {
    expect(labRunSchema.safeParse({ ...baseline, ...patch }).success).toBe(
      false,
    );
  });
});
