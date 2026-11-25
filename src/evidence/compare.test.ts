import { describe, expect, it } from "vitest";
import baseline from "../../fixtures/lab/baseline.json";
import candidate from "../../fixtures/lab/candidate.json";
import { compareMetric } from "./compare";

describe("lab comparisons", () => {
  it("uses the median, retains outliers and exposes an informational delta", () => {
    expect(compareMetric(baseline, candidate, "lcp")).toMatchObject({
      status: "informational",
      delta: 300,
      percent: 30,
      unit: "ms",
      baseline: {
        median: 1000,
        min: 900,
        max: 9000,
        samples: [900, 1000, 1100, 1000, 9000],
      },
    });
  });
  it("does not invent a percentage for zero baseline", () => {
    expect(compareMetric(baseline, candidate, "cls")).toMatchObject({
      status: "informational",
      delta: 0,
      percent: null,
    });
  });
  it("computes even medians without mutating input", () => {
    const run = structuredClone(baseline);
    run.samples.push({
      ...run.samples[0]!,
      sourceId: "six",
      metrics: { lcp: 2000, cls: 0, tbt: 100 },
    });
    expect(compareMetric(run, run, "lcp").baseline?.median).toBe(1050);
    expect(run.samples[0]!.metrics.lcp).toBe(900);
  });
  it.each([0, 1, 4])("withholds deltas with %i candidate samples", (count) => {
    const result = compareMetric(
      baseline,
      { ...candidate, samples: candidate.samples.slice(0, count) },
      "lcp",
    );
    expect(result.status).toBe("incomplete");
    expect(result).not.toHaveProperty("delta");
  });
  it("withholds a partial metric even when five other values exist", () => {
    const run = structuredClone(candidate);
    run.samples.push({
      ...run.samples[0]!,
      sourceId: "missing",
      metrics: { lcp: 1, cls: 0, tbt: 0 },
    });
    delete (run.samples[5]!.metrics as { lcp?: number }).lcp;
    expect(compareMetric(baseline, run, "lcp")).toMatchObject({
      status: "incomplete",
      reason: "missing_metric",
    });
  });
  it.each([
    "browserVersion",
    "runner",
    "locale",
    "settingsFingerprint",
    "toolVersion",
  ] as const)("excludes changed %s but retains raw samples", (field) => {
    const run = structuredClone(candidate);
    run.environment[field] = "different";
    const result = compareMetric(baseline, run, "tbt");
    expect(result).toMatchObject({
      status: "not_comparable",
      reason: "environment_mismatch",
      candidate: { median: 100 },
    });
    expect(result).not.toHaveProperty("delta");
  });
  it("excludes a different viewport", () => {
    const run = structuredClone(candidate);
    run.environment.viewport.width = 800;
    expect(compareMetric(baseline, run, "lcp").status).toBe("not_comparable");
  });
  it("does not pair renamed scenarios", () => {
    expect(
      compareMetric(
        baseline,
        { ...candidate, scenario: { ...candidate.scenario, id: "other" } },
        "lcp",
      ),
    ).toMatchObject({ reason: "scenario_mismatch" });
  });
  it("is independent of input object key order", () => {
    const reversed = Object.fromEntries(
      Object.entries(candidate.environment).reverse(),
    );
    expect(
      compareMetric(baseline, { ...candidate, environment: reversed }, "lcp")
        .status,
    ).toBe("informational");
  });
});
