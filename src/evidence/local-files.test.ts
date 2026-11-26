import { afterEach, beforeEach, expect, it } from "vitest";
import {
  mkdtemp,
  mkdir,
  rm,
  symlink,
  truncate,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertJsonDepth, JSON_LIMIT, localJsonReader } from "./local-files";
let root: string;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "releaseproof-"));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});
it("reads declared regular files and keeps exact bytes", async () => {
  await writeFile(join(root, "report.json"), '{"n":0}\n');
  const read = await localJsonReader(root);
  expect((await read("report.json")).text).toBe('{"n":0}\n');
  await expect(read("missing.json")).rejects.toThrow();
  await expect(read(".")).rejects.toThrow();
});
it.each(["../outside.json", "/etc/passwd", "a/../b", "a\\b", "a//b"])(
  "rejects unsafe path %s",
  async (path) => {
    await expect((await localJsonReader(root))(path)).rejects.toThrow(
      /relative/,
    );
  },
);
it("rejects file and ancestor symlinks, even within the root", async () => {
  await mkdir(join(root, "data"));
  await writeFile(join(root, "data/a.json"), "{}");
  await symlink(join(root, "data/a.json"), join(root, "alias.json"));
  await symlink(join(root, "data"), join(root, "alias"));
  const read = await localJsonReader(root);
  await expect(read("alias.json")).rejects.toThrow(/Symlink/);
  await expect(read("alias/a.json")).rejects.toThrow(/Symlink/);
  await expect(read("data")).rejects.toThrow(/regular file/);
});
it("bounds per-file bytes before reading and cumulative bytes across reads", async () => {
  const path = join(root, "large.json");
  await writeFile(path, "");
  await truncate(path, JSON_LIMIT + 1);
  await expect((await localJsonReader(root))("large.json")).rejects.toThrow(
    /byte limit/,
  );
  await writeFile(path, " ".repeat(JSON_LIMIT));
  const read = await localJsonReader(root);
  for (let i = 0; i < 5; i++) await read("large.json");
  await expect(read("large.json")).rejects.toThrow(/byte limit/);
});
it("rejects invalid UTF-8 and excessive nesting without counting quoted braces", async () => {
  await writeFile(join(root, "bad.json"), Buffer.from([0xff]));
  await expect((await localJsonReader(root))("bad.json")).rejects.toThrow();
  expect(() => assertJsonDepth("[".repeat(65))).toThrow(/nesting/);
  expect(() =>
    assertJsonDepth(JSON.stringify({ text: '["'.repeat(100) })),
  ).not.toThrow();
});
