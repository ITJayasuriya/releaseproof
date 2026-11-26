import { afterEach, beforeEach, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { collectionSchema, loadCollection } from "./collection";

let root: string;
let manifest: ReturnType<typeof collectionSchema.parse>;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "releaseproof-"));
  const bytes = await readFile(
    new URL("../../fixtures/lighthouse/numeric.json", import.meta.url),
  );
  await writeFile(join(root, "report.json"), bytes);
  manifest = {
    schemaVersion: 1,
    revision: "a".repeat(40),
    scenario: { id: "home", routeLabel: "/", state: "ready" },
    environment: {
      browser: "Chromium",
      browserVersion: "test",
      runner: "synthetic",
      viewport: { width: 1280, height: 720, deviceScaleFactor: 1 },
      locale: "en",
      theme: "light",
      toolVersion: "13.6.0",
      settingsFingerprint: "synthetic-v1",
    },
    reports: [
      {
        sourceId: "sample-1",
        path: "report.json",
        sha256: createHash("sha256").update(bytes).digest("hex"),
      },
    ],
  };
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});
async function load() {
  await writeFile(join(root, "collection.json"), JSON.stringify(manifest));
  return loadCollection(root);
}
it("binds exact report bytes to declared metadata and preserves real zero", async () => {
  const result = await load();
  expect(result.run.revision).toBe(manifest.revision);
  expect(result.run.samples[0]?.metrics.tbt).toBe(0);
  expect(result.reports[0]?.sha256).toBe(manifest.reports[0]?.sha256);
  expect(result.collectionSha256).toMatch(/^[a-f0-9]{64}$/);
});
it("preserves empty collections as missing evidence", async () => {
  manifest.reports = [];
  expect((await load()).run.samples).toEqual([]);
});
it("preserves unavailable reasons rather than zero", async () => {
  const bytes = JSON.stringify({
    lighthouseVersion: "13.6.0",
    fetchTime: "2026-11-26T00:00:00Z",
    audits: {},
  });
  await writeFile(join(root, "report.json"), bytes);
  manifest.reports[0]!.sha256 = createHash("sha256")
    .update(bytes)
    .digest("hex");
  const result = await load();
  expect(result.run.samples[0]?.metrics).toEqual({});
  expect(result.reports[0]?.unavailable.tbt).toBe("absent");
});
it.each(["sourceId", "path", "sha256"] as const)(
  "rejects reused %s rather than inflating sample count",
  (key) => {
    const original = manifest.reports[0]!;
    manifest.reports.push({
      sourceId: "other",
      path: "other.json",
      sha256: "b".repeat(64),
      [key]: original[key],
    });
    expect(() => collectionSchema.parse(manifest)).toThrow(/Duplicate/);
  },
);
it("rejects altered bytes and reports the file with its underlying cause", async () => {
  await writeFile(join(root, "report.json"), "{}");
  await expect(load()).rejects.toMatchObject({
    message: "Invalid report report.json",
    cause: { message: "SHA-256 mismatch" },
  });
});
it("rejects mismatched declared tool versions", async () => {
  manifest.environment.toolVersion = "12.0.0";
  await expect(load()).rejects.toMatchObject({
    cause: { message: "Declared tool version differs from report" },
  });
});
it("rejects missing, malformed and unsupported reports", async () => {
  await rm(join(root, "report.json"));
  await expect(load()).rejects.toThrow(/Invalid report/);
  for (const text of ["{", '{"lighthouseVersion":"14.0.0"}']) {
    await writeFile(join(root, "report.json"), text);
    manifest.reports[0]!.sha256 = createHash("sha256")
      .update(text)
      .digest("hex");
    await expect(load()).rejects.toThrow(/Invalid report/);
  }
});
it("rejects incompatible manifest versions and undeclared evidence kinds", async () => {
  await writeFile(
    join(root, "collection.json"),
    JSON.stringify({ ...manifest, schemaVersion: 2 }),
  );
  await expect(loadCollection(root)).rejects.toThrow();
  expect(() => collectionSchema.parse({ ...manifest, axe: [] })).toThrow();
});
