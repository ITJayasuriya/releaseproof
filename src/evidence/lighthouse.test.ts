import { describe, expect, it } from "vitest";
import { readLighthouse } from "./lighthouse";

const report = {
  lighthouseVersion: "13.6.0",
  fetchTime: "2026-11-25T00:00:00Z",
  audits: {
    "total-blocking-time": {
      numericValue: 0,
      numericUnit: "millisecond",
      scoreDisplayMode: "numeric",
    },
    "largest-contentful-paint": {
      numericValue: 1250,
      numericUnit: "millisecond",
      scoreDisplayMode: "numeric",
    },
    "cumulative-layout-shift": {
      numericValue: 0.1,
      numericUnit: "unitless",
      scoreDisplayMode: "numeric",
    },
  },
};

describe("Lighthouse lab adapter", () => {
  it("extracts numeric lab values without substituting an INP value", () => {
    expect(readLighthouse(JSON.stringify(report))).toEqual({
      toolVersion: "13.6.0",
      collectedAt: report.fetchTime,
      metrics: { lcp: 1250, cls: 0.1, tbt: 0 },
      unavailable: {},
    });
  });
  it.each(["12.0.0", "13.7.0", "14.0.0"])(
    "rejects untested version %s",
    (version) => {
      expect(() =>
        readLighthouse(
          JSON.stringify({ ...report, lighthouseVersion: version }),
        ),
      ).toThrow();
    },
  );
  it("leaves absent/error audits missing instead of substituting zero", () => {
    expect(
      readLighthouse(
        JSON.stringify({
          ...report,
          audits: { "total-blocking-time": { scoreDisplayMode: "error" } },
        }),
      ).metrics,
    ).toEqual({});
  });
  it.each(["error", "notApplicable", "manual"])(
    "preserves the reason for an unavailable %s metric",
    (scoreDisplayMode) => {
      const result = readLighthouse(
        JSON.stringify({
          ...report,
          audits: { "total-blocking-time": { scoreDisplayMode } },
        }),
      );
      expect(result.metrics).toEqual({});
      expect(result.unavailable).toEqual({
        lcp: "absent",
        cls: "absent",
        tbt: scoreDisplayMode,
      });
    },
  );
  it.each([
    {
      numericValue: -1,
      numericUnit: "millisecond",
      scoreDisplayMode: "numeric",
    },
    { numericValue: 1, numericUnit: "second", scoreDisplayMode: "numeric" },
    { numericUnit: "millisecond", scoreDisplayMode: "numeric" },
    {
      numericValue: 1,
      numericUnit: "millisecond",
      scoreDisplayMode: "unknown",
    },
  ])("rejects incompatible audit %j", (audit) => {
    expect(() =>
      readLighthouse(
        JSON.stringify({ ...report, audits: { "total-blocking-time": audit } }),
      ),
    ).toThrow();
  });
  it("rejects reports with a runtime failure", () => {
    expect(() =>
      readLighthouse(
        JSON.stringify({ ...report, runtimeError: { code: "NO_FCP" } }),
      ),
    ).toThrow("runtime error");
  });
  it("rejects malformed or oversized JSON", () => {
    expect(() => readLighthouse("{")).toThrow();
    expect(() => readLighthouse(" ".repeat(20 * 1024 * 1024 + 1))).toThrow(
      "20 MiB",
    );
  });
});
