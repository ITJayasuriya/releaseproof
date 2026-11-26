import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import {
  basename,
  dirname,
  isAbsolute,
  relative,
  resolve,
  sep,
} from "node:path";
import { z } from "zod";
import { loadCollection, sha256Schema } from "./collection.ts";
import { compareMetric } from "./compare.ts";
import { COLLECTION_LIMIT } from "./local-files.ts";
import { labRunSchema, metricKeySchema } from "./schema.ts";

const normalizedCollectionSchema = z.strictObject({
  run: labRunSchema,
  collectionSha256: sha256Schema,
  provenance: z.literal("caller_declared_hash_bound"),
  reports: z
    .array(
      z.strictObject({
        sourceId: z.string().min(1).max(200),
        sha256: sha256Schema,
        unavailable: z.partialRecord(
          metricKeySchema,
          z.enum(["absent", "error", "notApplicable", "manual"]),
        ),
      }),
    )
    .max(100),
});
export const labPacketSchema = z.strictObject({
  schemaVersion: z.literal(1),
  kind: z.literal("releaseproof-lab"),
  adapterVersion: z.literal(1),
  evidence: z.strictObject({
    axe: z.literal("unsupported"),
    screenshots: z.literal("unsupported"),
  }),
  baseline: normalizedCollectionSchema,
  candidate: normalizedCollectionSchema,
});

function contains(root: string, path: string) {
  const rel = relative(root, path);
  return (
    rel === "" ||
    (!isAbsolute(rel) && !rel.startsWith(`..${sep}`) && rel !== "..")
  );
}

// A complete staging tree is renamed only after every input and write succeeds.
export async function buildLabPacket(
  baselineDirectory: string,
  candidateDirectory: string,
  outputDirectory: string,
) {
  const baselineRoot = await realpath(baselineDirectory);
  const candidateRoot = await realpath(candidateDirectory);
  const output = resolve(
    await realpath(dirname(resolve(outputDirectory))),
    basename(resolve(outputDirectory)),
  );
  for (const root of [baselineRoot, candidateRoot]) {
    if (contains(root, output) || contains(output, root)) {
      throw new Error("Output must not overlap either input directory");
    }
  }
  // Serial collections bound combined peak input memory; output enforces one packet budget.
  const baseline = await loadCollection(baselineRoot);
  const candidate = await loadCollection(candidateRoot);
  function normalize(collection: typeof baseline) {
    return {
      run: collection.run,
      collectionSha256: collection.collectionSha256,
      provenance: "caller_declared_hash_bound" as const,
      reports: collection.reports.map(({ sourceId, sha256, unavailable }) => ({
        sourceId,
        sha256,
        unavailable,
      })),
    };
  }
  const packet = labPacketSchema.parse({
    schemaVersion: 1,
    kind: "releaseproof-lab",
    adapterVersion: 1,
    evidence: { axe: "unsupported", screenshots: "unsupported" },
    baseline: normalize(baseline),
    candidate: normalize(candidate),
  });
  const json = JSON.stringify(packet, null, 2) + "\n";
  const packetId = createHash("sha256").update(json).digest("hex");
  const assets = new Map<string, Buffer>();
  for (const collection of [baseline, candidate]) {
    assets.set(collection.collectionSha256, collection.collectionBytes);
    for (const report of collection.reports)
      assets.set(report.sha256, report.bytes);
  }
  const total =
    Buffer.byteLength(json) +
    [...assets.values()].reduce((sum, bytes) => sum + bytes.length, 0);
  if (total > COLLECTION_LIMIT) throw new Error("Packet exceeds 100 MiB limit");
  // Sibling lock serializes cooperating builders. Input/output parents must be stable.
  const lock = `${output}.releaseproof-lock`;
  await mkdir(lock);
  let staging: string | undefined;
  try {
    try {
      await lstat(output);
      throw new Error("Output already exists; choose a new directory");
    } catch (error) {
      if (!(
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ))
        throw error;
    }
    staging = await mkdtemp(`${output}.staging-`);
    await mkdir(resolve(staging, "assets"));
    for (const [hash, bytes] of assets)
      await writeFile(resolve(staging, "assets", `${hash}.json`), bytes, {
        flag: "wx",
      });
    await writeFile(resolve(staging, "packet.json"), json, { flag: "wx" });
    await rename(staging, output);
    staging = undefined;
  } finally {
    if (staging) await rm(staging, { recursive: true, force: true });
    await rm(lock, { recursive: true });
  }
  return {
    packetId,
    output,
    comparisons: metricKeySchema.options.map((key) =>
      compareMetric(packet.baseline.run, packet.candidate.run, key),
    ),
  };
}
