# Lab contract v1

`lab-run-v1.json` is the structural JSON Schema generated from
`src/evidence/schema.ts`. Regenerate with `npm run schema:export`, then format
with `npx prettier --write schemas/lab-run-v1.json`. `npm test` detects drift.
Node 24 is required for the generator's native TypeScript import.

The runtime Zod validator is authoritative. JSON Schema cannot express the
cross-record rule that every sample's `sourceId` is unique: consumers must still
call `labRunSchema.parse`. Passing structural validation alone does not establish
comparability, provenance accuracy, or release safety. This is a lab-run contract,
not the future complete packet manifest.

Unknown fields and schema versions fail validation. No migration is needed yet:
there is no previous released contract. A future breaking contract must retain a
reader or explicit rejection for v1 and document migration before release.
