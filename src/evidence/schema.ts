import { z } from "zod";

const label = z.string().trim().min(1).max(200);
export const metricKeySchema = z.enum(["lcp", "cls", "tbt"]);
export const metricUnits = { lcp: "ms", cls: "unitless", tbt: "ms" } as const;
export type MetricKey = z.infer<typeof metricKeySchema>;

// Explicit fields make absent provenance invalid instead of an accidental match.
export const environmentSchema = z.strictObject({
  browser: label,
  browserVersion: label,
  runner: label,
  viewport: z.strictObject({
    width: z.number().int().positive().max(16384),
    height: z.number().int().positive().max(16384),
    deviceScaleFactor: z.number().positive().max(8),
  }),
  locale: label,
  theme: z.enum(["light", "dark"]),
  toolVersion: label,
  settingsFingerprint: label,
});

export const labRunSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    revision: z.string().regex(/^[a-f0-9]{40}$/),
    scenario: z.strictObject({ id: label, routeLabel: label, state: label }),
    environment: environmentSchema,
    samples: z
      .array(
        z.strictObject({
          sourceId: label,
          collectedAt: z.iso.datetime(),
          metrics: z.strictObject({
            lcp: z.number().finite().nonnegative().optional(),
            cls: z.number().finite().nonnegative().optional(),
            tbt: z.number().finite().nonnegative().optional(),
          }),
        }),
      )
      .max(100),
  })
  .superRefine((run, ctx) => {
    if (
      new Set(run.samples.map((sample) => sample.sourceId)).size !==
      run.samples.length
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["samples"],
        message: "Sample source IDs must be unique",
      });
    }
  });

export type LabRun = z.infer<typeof labRunSchema>;
export type Environment = z.infer<typeof environmentSchema>;
