import { createHash } from "node:crypto";
import { z } from "zod";
import { labRunSchema } from "./schema.ts";
import { readLighthouse } from "./lighthouse.ts";
import { localJsonReader } from "./local-files.ts";

export const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
export const collectionSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    revision: labRunSchema.shape.revision,
    scenario: labRunSchema.shape.scenario,
    environment: labRunSchema.shape.environment,
    reports: z
      .array(
        z.strictObject({
          sourceId: z.string().trim().min(1).max(200),
          path: z.string().min(1).max(1024),
          sha256: sha256Schema,
        }),
      )
      .max(100),
  })
  .superRefine((collection, ctx) => {
    for (const key of ["sourceId", "path", "sha256"] as const) {
      if (
        new Set(collection.reports.map((report) => report[key])).size !==
        collection.reports.length
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["reports"],
          message: `Duplicate report ${key}`,
        });
      }
    }
  });

export async function loadCollection(directory: string) {
  const read = await localJsonReader(directory);
  const manifest = await read("collection.json");
  const collection = collectionSchema.parse(JSON.parse(manifest.text));
  const samples = [];
  const reports = [];
  // Sequential reads keep the byte budget and peak memory predictable.
  for (const reference of collection.reports) {
    try {
      const { bytes, text } = await read(reference.path);
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      if (sha256 !== reference.sha256) throw new Error("SHA-256 mismatch");
      const report = readLighthouse(text);
      if (report.toolVersion !== collection.environment.toolVersion) {
        throw new Error("Declared tool version differs from report");
      }
      samples.push({
        sourceId: reference.sourceId,
        collectedAt: report.collectedAt,
        metrics: report.metrics,
      });
      reports.push({
        sourceId: reference.sourceId,
        sha256,
        unavailable: report.unavailable,
        bytes,
      });
    } catch (cause) {
      throw new Error(`Invalid report ${reference.path}`, { cause });
    }
  }
  const run = labRunSchema.parse({
    schemaVersion: collection.schemaVersion,
    revision: collection.revision,
    scenario: collection.scenario,
    environment: collection.environment,
    samples,
  });
  return {
    run,
    reports,
    collectionSha256: createHash("sha256").update(manifest.bytes).digest("hex"),
  };
}
