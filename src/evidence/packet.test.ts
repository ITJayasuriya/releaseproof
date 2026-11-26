import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import { afterEach, beforeEach, expect, it } from "vitest";
import {
  cp,
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildLabPacket, labPacketSchema } from "./packet";
const exec = promisify(execFile);
const baseline = new URL("../../fixtures/collections/baseline", import.meta.url)
  .pathname;
const candidate = new URL(
  "../../fixtures/collections/candidate",
  import.meta.url,
).pathname;
const cli = new URL("../cli/main.ts", import.meta.url).pathname;
let root: string;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "releaseproof-packet-"));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});
it("runs the real Node CLI, writes reproducible bytes and preserves hashed raw assets", async () => {
  const out = join(root, "packet");
  const { stdout, stderr } = await exec(process.execPath, [
    cli,
    "build",
    "--baseline",
    baseline,
    "--candidate",
    candidate,
    "--out",
    out,
  ]);
  expect(stderr).toBe("");
  const result = JSON.parse(stdout);
  expect(result.comparisons[0]).toMatchObject({
    status: "informational",
    delta: 250,
  });
  expect(result.comparisons[2]).toMatchObject({
    status: "informational",
    delta: 0,
    percent: null,
  });
  const raw = await readFile(join(out, "packet.json"));
  expect(result.packetId).toBe(createHash("sha256").update(raw).digest("hex"));
  const packet = labPacketSchema.parse(JSON.parse(raw.toString()));
  expect(packet.evidence).toEqual({
    axe: "unsupported",
    screenshots: "unsupported",
  });
  for (const name of await readdir(join(out, "assets"))) {
    expect(
      createHash("sha256")
        .update(await readFile(join(out, "assets", name)))
        .digest("hex") + ".json",
    ).toBe(name);
  }
  const second = join(root, "second");
  expect((await buildLabPacket(baseline, candidate, second)).packetId).toBe(
    result.packetId,
  );
});
it("preserves existing output including empty directories", async () => {
  const out = join(root, "existing");
  await mkdir(out);
  await expect(buildLabPacket(baseline, candidate, out)).rejects.toThrow(
    /already exists/,
  );
  await writeFile(join(out, "keep"), "untouched");
  await expect(buildLabPacket(baseline, candidate, out)).rejects.toThrow(
    /already exists/,
  );
  expect(await readFile(join(out, "keep"), "utf8")).toBe("untouched");
  expect(await readdir(root)).toEqual(["existing"]);
});
it("rejects invalid inputs without partial output and surfaces a bounded CLI error", async () => {
  const bad = join(root, "bad");
  await cp(baseline, bad, { recursive: true });
  await writeFile(join(bad, "collection.json"), '{"SECRET_PAYLOAD":oops}');
  try {
    await exec(process.execPath, [
      cli,
      "build",
      "--baseline",
      bad,
      "--candidate",
      candidate,
      "--out",
      join(root, "out"),
    ]);
    throw new Error("Expected nonzero CLI exit");
  } catch (error) {
    expect(error).toMatchObject({
      code: 1,
      stderr: "ReleaseProof: Malformed JSON evidence\n",
    });
  }
  expect(await readdir(root)).toEqual(["bad"]);
});
it("rejects overlapping paths and concurrent cooperating writers", async () => {
  await expect(
    buildLabPacket(baseline, candidate, join(baseline, "out")),
  ).rejects.toThrow(/overlap/);
  const out = join(root, "packet");
  await mkdir(`${out}.releaseproof-lock`);
  await expect(buildLabPacket(baseline, candidate, out)).rejects.toThrow();
  expect(await readdir(root)).toEqual(["packet.releaseproof-lock"]);
});
it("rejects invalid CLI flags without creating output", async () => {
  await expect(
    exec(process.execPath, [cli, "build", "--unknown", "x"]),
  ).rejects.toMatchObject({ code: 1 });
  await expect(exec(process.execPath, [cli, "build"])).rejects.toMatchObject({
    code: 1,
  });
  expect(await readdir(root)).toEqual([]);
});
it("keeps missing and mismatched evidence explicit", async () => {
  const bad = join(root, "changed");
  await cp(candidate, bad, { recursive: true });
  const path = join(bad, "collection.json");
  const manifest = JSON.parse(await readFile(path, "utf8"));
  manifest.environment.runner = "different-runner";
  await writeFile(path, JSON.stringify(manifest));
  expect(
    (await buildLabPacket(baseline, bad, join(root, "mismatch")))
      .comparisons[0],
  ).toMatchObject({ status: "not_comparable", reason: "environment_mismatch" });
  manifest.environment.runner = "synthetic-fixture";
  manifest.reports = [];
  await writeFile(path, JSON.stringify(manifest));
  expect(
    (await buildLabPacket(baseline, bad, join(root, "missing"))).comparisons[0],
  ).toMatchObject({ status: "incomplete", reason: "missing_metric" });
});
