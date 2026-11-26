import { parseArgs } from "node:util";
import { buildLabPacket } from "../evidence/packet.ts";

try {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      baseline: { type: "string" },
      candidate: { type: "string" },
      out: { type: "string" },
    },
  });
  if (
    positionals.length !== 1 ||
    positionals[0] !== "build" ||
    !values.baseline ||
    !values.candidate ||
    !values.out
  ) {
    throw new Error(
      "Usage: npm run cli -- build --baseline <dir> --candidate <dir> --out <new-dir>",
    );
  }
  const result = await buildLabPacket(
    values.baseline,
    values.candidate,
    values.out,
  );
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
} catch (error) {
  // Never log report payloads or Zod issue values from imported files.
  const messages = [];
  let cause: unknown = error;
  for (let depth = 0; depth < 4 && cause instanceof Error; depth++) {
    messages.push(
      cause instanceof SyntaxError
        ? "Malformed JSON evidence"
        : cause.name === "ZodError"
          ? "Evidence does not match the supported schema"
          : cause.message,
    );
    cause = cause.cause;
  }
  process.stderr.write(`ReleaseProof: ${messages.join(": ")}\n`);
  process.exitCode = 1;
}
