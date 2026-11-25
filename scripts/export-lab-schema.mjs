import { writeFile } from "node:fs/promises";
import { z } from "zod";
import { labRunSchema } from "../src/evidence/schema.ts";

const schema = z.toJSONSchema(labRunSchema);
await writeFile(
  new URL("../schemas/lab-run-v1.json", import.meta.url),
  `${JSON.stringify(schema, null, 2)}\n`,
);
