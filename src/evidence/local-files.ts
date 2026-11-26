import { constants } from "node:fs";
import { open, realpath, lstat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

export const JSON_LIMIT = 20 * 1024 * 1024;
export const COLLECTION_LIMIT = 100 * 1024 * 1024;

// One reader owns a collection's cumulative budget; inputs are never discovered.
export async function localJsonReader(directory: string) {
  const root = await realpath(directory);
  let total = 0;
  return async (name: string) => {
    if (
      isAbsolute(name) ||
      name.includes("\\") ||
      name.split("/").some((part) => !part || part === "." || part === "..")
    ) {
      throw new Error("Expected a relative file path without traversal");
    }
    const path = resolve(root, name);
    const rel = relative(root, path);
    if (rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
      throw new Error("File escapes collection root");
    }
    // Reject all symlinks, including ancestor links, rather than following aliases.
    let ancestor = root;
    for (const part of name.split("/")) {
      ancestor = resolve(ancestor, part);
      if ((await lstat(ancestor)).isSymbolicLink()) {
        throw new Error("Symlink inputs are unsupported");
      }
    }
    const handle = await open(
      path,
      constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
    );
    try {
      const stat = await handle.stat();
      if (!stat.isFile()) throw new Error("Input must be a regular file");
      if (stat.size > JSON_LIMIT || total + stat.size > COLLECTION_LIMIT) {
        throw new Error("Input exceeds JSON or collection byte limit");
      }
      const chunks: Buffer[] = [];
      let size = 0;
      for (;;) {
        const chunk = Buffer.alloc(64 * 1024);
        const { bytesRead } = await handle.read(chunk);
        size += bytesRead;
        total += bytesRead;
        if (size > JSON_LIMIT || total > COLLECTION_LIMIT) {
          throw new Error("Input exceeds JSON or collection byte limit");
        }
        if (!bytesRead) break;
        chunks.push(chunk.subarray(0, bytesRead));
      }
      const bytes = Buffer.concat(chunks);
      const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      assertJsonDepth(text);
      return { bytes, text };
    } finally {
      await handle.close();
    }
  };
}

// Bound nesting before JSON.parse or a validator traverses untrusted structures.
export function assertJsonDepth(text: string) {
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (const char of text) {
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === "{" || char === "[") {
      if (++depth > 64) throw new Error("JSON nesting exceeds 64 levels");
    } else if (char === "}" || char === "]") depth--;
  }
}
