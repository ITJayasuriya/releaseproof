import { labRunSchema, metricKeySchema, metricUnits } from "./schema";
import type { MetricKey } from "./schema";

function summarize(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2
      ? sorted[middle]!
      : sorted[middle - 1]! + (sorted[middle]! - sorted[middle - 1]!) / 2;
  return {
    samples: values,
    median,
    min: sorted[0]!,
    max: sorted[sorted.length - 1]!,
  };
}

export function compareMetric(
  baselineInput: unknown,
  candidateInput: unknown,
  metric: MetricKey,
) {
  const baseline = labRunSchema.parse(baselineInput);
  const candidate = labRunSchema.parse(candidateInput);
  metricKeySchema.parse(metric);
  const left = summarize(
    baseline.samples.flatMap((sample) => sample.metrics[metric] ?? []),
  );
  const right = summarize(
    candidate.samples.flatMap((sample) => sample.metrics[metric] ?? []),
  );
  const evidence = {
    metric,
    unit: metricUnits[metric],
    baseline: left,
    candidate: right,
  };

  if (
    JSON.stringify(baseline.scenario) !== JSON.stringify(candidate.scenario)
  ) {
    return {
      ...evidence,
      status: "not_comparable",
      reason: "scenario_mismatch",
    } as const;
  }
  if (
    JSON.stringify(baseline.environment) !==
    JSON.stringify(candidate.environment)
  ) {
    return {
      ...evidence,
      status: "not_comparable",
      reason: "environment_mismatch",
    } as const;
  }
  if (!left || !right) {
    return {
      ...evidence,
      status: "incomplete",
      reason: "missing_metric",
    } as const;
  }
  // Missing measurements must not be omitted to turn partial runs into a delta.
  if (
    left.samples.length !== baseline.samples.length ||
    right.samples.length !== candidate.samples.length
  ) {
    return {
      ...evidence,
      status: "incomplete",
      reason: "missing_metric",
    } as const;
  }
  if (left.samples.length < 5 || right.samples.length < 5) {
    return {
      ...evidence,
      status: "incomplete",
      reason: "insufficient_samples",
    } as const;
  }
  const delta = right.median - left.median;
  const percent = left.median === 0 ? null : (delta / left.median) * 100;
  if (percent !== null && !Number.isFinite(percent)) {
    return {
      ...evidence,
      status: "incomplete",
      reason: "numeric_range",
    } as const;
  }
  return {
    ...evidence,
    status: "informational",
    delta,
    percent,
  } as const;
}
