import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { labRunSchema } from "./schema";

const exported = JSON.parse(
  readFileSync(
    new URL("../../schemas/lab-run-v1.json", import.meta.url),
    "utf8",
  ),
);

describe("published lab contract", () => {
  it("matches the runtime validator's structural JSON Schema", () => {
    expect(exported).toEqual(z.toJSONSchema(labRunSchema));
  });
  it("rejects unknown fields at every record boundary", () => {
    const fixture = JSON.parse(
      readFileSync(
        new URL("../../fixtures/lab/baseline.json", import.meta.url),
        "utf8",
      ),
    );
    for (const record of [
      fixture,
      fixture.scenario,
      fixture.environment,
      fixture.environment.viewport,
      fixture.samples[0],
      fixture.samples[0].metrics,
    ]) {
      record.unrecognized = true;
      expect(labRunSchema.safeParse(fixture).success).toBe(false);
      delete record.unrecognized;
    }
    expect(labRunSchema.safeParse(fixture).success).toBe(true);
  });
});
