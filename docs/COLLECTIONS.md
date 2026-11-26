# Development lab packets

This is a source-checkout CLI on Node 24, not a published npm package or complete
alpha viewer. From the repository root:

```sh
npm run cli -- build \
  --baseline fixtures/collections/baseline \
  --candidate fixtures/collections/candidate \
  --out /tmp/releaseproof-example
```

Choose a new output directory with an existing parent. The checked-in fixtures
are **synthetic**, not real performance evidence: five samples per side, LCP
median 1270 → 1520 ms, CLS unchanged, TBT zero on both sides (percentage undefined).
Stdout contains the packet ID and informational metric comparisons; failure exits
nonzero. No command, browser, URL, plugin or HTML from a report is executed.

## Collection contract

Each input directory has `collection.json`. Use the checked-in manifests as the
exact version-1 example. Required fields: `schemaVersion`, full lowercase 40-digit
Git `revision`, `scenario` (id, routeLabel, state), `environment` and `reports`.
Environment fields are the shared lab contract in `src/evidence/schema.ts`.
Each report declares `sourceId`, relative `path` and lowercase SHA-256 of its exact
bytes. Only Lighthouse **13.6.0** is supported in this development slice. Every
report must agree with the declared tool version. Other tools/unknown fields and
unsupported versions fail rather than silently disappearing.

IDs, paths and hashes must be unique within a collection. Duplicate bytes cannot
inflate the five-sample rule. Distinct hashes do not prove independent samples:
collect five real runs, rather than editing copies to satisfy the count. Empty
report lists and absent/error measurements remain incomplete, never zero.

SHA-256 binds exact report and manifest bytes, but does **not** authenticate a
revision, runner, browser or collection procedure. All environment/revision
labels are caller declarations (`caller_declared_hash_bound`). The future CI
collector must record actual conditions. Environment comparison uses the strict
shared contract; fewer than five complete samples or mismatched conditions
suppress informational deltas. TBT is a lab metric; no field INP is inferred.

## Output and recovery

`packet.json` is a versioned `releaseproof-lab` envelope with normalized runs,
unavailable reasons, adapter version, collection/report hashes and explicit
unsupported axe/screenshot states. `assets/<sha256>.json` preserves exact original
report and collection bytes. The packet ID is SHA-256 of `packet.json`, including
its trailing newline. Asset references use hashes, never imported paths. No
creation timestamp is inserted, so identical input bytes produce identical IDs.
The runtime schemas live in `src/evidence/collection.ts` and `packet.ts`; packet
import still needs relational/hash verification before the viewer can trust it.

Output cannot overlap either input. A sibling lock serializes cooperating CLI
builders. All files are written to a sibling staging directory before rename.
Existing output, including an empty directory or symlink, is rejected. Failures
clean owned staging and lock directories. Abrupt termination can leave
`<out>.releaseproof-lock` and `<out>.staging-*`: verify the builder has exited,
then remove only those remnants and retry with a new output directory. Never
remove another active builder's lock.

Use stable directories owned by the invoking user. Do not modify input trees or
output parents during a build. Path/symlink checks are not an OS sandbox against
another local process racing directory replacement. Publish only reviewed,
secret-free raw evidence: packets copy originals without redaction.

## Resource bounds and current limits

- Declared inputs only; at most 100 reports plus one manifest per collection.
- 20 MiB per JSON, 100 MiB read per collection, 100 MiB serialized packet/assets.
- Strict UTF-8, regular files, no symlinks (including ancestors), absolute paths,
  backslash paths or traversal segments; JSON nesting at most 64 levels.
- Reads are sequential and byte counts are checked during reads as well as before
  them. Two collections can occupy up to 200 MiB of raw input before the combined
  output cap is evaluated; decoded strings/validation add overhead. This is a
  bounded local CLI, not a streaming processor for arbitrary-sized artifacts.
- No axe/screenshot adapter, viewer packet import, annotations, packed installation
  or npm publication is supplied by this slice. Serve the future viewer via HTTP;
  no `file://` loading promise is made.

`npm test` includes real Node CLI subprocess tests for deterministic packets,
hashed assets, zero/missing/incompatible evidence, invalid input privacy,
no-overwrite behavior and cooperating writer locks. Browser setup smoke tests
remain foundation checks; they do not validate an unimplemented packet viewer.
