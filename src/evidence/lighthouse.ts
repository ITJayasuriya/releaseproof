import { z } from "zod";
import type { MetricKey } from "./schema";

const auditSchema = z.object({
  numericValue: z.number().finite().nonnegative().optional(),
  numericUnit: z.string().optional(),
  scoreDisplayMode: z.enum(["numeric", "error", "notApplicable", "manual"]),
});
const reportSchema = z.object({
  lighthouseVersion: z.literal("13.6.0"),
  fetchTime: z.iso.datetime(),
  runtimeError: z.unknown().optional(),
  audits: z.object({
    "largest-contentful-paint": auditSchema.optional(),
    "cumulative-layout-shift": auditSchema.optional(),
    "total-blocking-time": auditSchema.optional(),
  }),
});

// This adapter extracts measurements, never infers matching collection conditions.
export function readLighthouse(json: string) {
  if (new TextEncoder().encode(json).length > 20 * 1024 * 1024) {
    throw new Error("Lighthouse JSON exceeds the 20 MiB limit");
  }
  const report = reportSchema.parse(JSON.parse(json));
  if (report.runtimeError !== undefined) {
    throw new Error(
      "Lighthouse runtime error: collect a successful report before comparing",
    );
  }
  const metrics: Partial<Record<MetricKey, number>> = {};
  const unavailable: Partial<
    Record<MetricKey, "absent" | "error" | "notApplicable" | "manual">
  > = {};
  const auditMap = [
    ["lcp", "largest-contentful-paint", "millisecond"],
    ["cls", "cumulative-layout-shift", "unitless"],
    ["tbt", "total-blocking-time", "millisecond"],
  ] as const;
  for (const [key, id, unit] of auditMap) {
    const audit = report.audits[id];
    if (!audit) {
      unavailable[key] = "absent";
      continue;
    }
    if (audit.scoreDisplayMode !== "numeric") {
      unavailable[key] = audit.scoreDisplayMode;
      continue;
    }
    if (audit.numericUnit !== unit || audit.numericValue === undefined) {
      throw new Error(`Unsupported or incomplete Lighthouse audit: ${id}`);
    }
    metrics[key] = audit.numericValue;
  }
  return {
    toolVersion: report.lighthouseVersion,
    collectedAt: report.fetchTime,
    metrics,
    unavailable,
  };
}
