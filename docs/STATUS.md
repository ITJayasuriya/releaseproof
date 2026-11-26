# Status

25 November 2026 — daily lab-contract goal implemented; alpha and v1 unfinished.

## Delivered

- Runtime version-1 lab schema: revision/environment provenance, bounded samples,
  unknown-field/version rejection and unique source IDs.
- Informational comparison: raw samples, median/range, five-complete-sample rule,
  scenario/environment mismatch and missing metric states. Zero baseline has no
  percentage. Numeric overflow is incomplete, not an infinite delta.
- Bounded Lighthouse 13.6.0 numeric LCP/CLS/TBT adapter, with explicit unavailable
  reasons and rejection of unsupported versions/units/runtime failures.
- Versioned structural JSON Schema, regeneration/parity test, synthetic fixtures
  and compatibility policy. Runtime source-ID uniqueness cannot be expressed by
  the exported structural schema; the runtime validator remains authoritative.

## Verification and review

Implementation head `ff2a579`: check, 42 domain tests and production build passed.
Local Chromium/WebKit setup and automated axe smoke: 2 passed. These smoke tests
cover the existing setup page, not a product workflow. Local Firefox remains
unrun due to its documented startup issue; Linux CI must cover all three engines.

Ponytail and Thermo-Nuclear branch review applied: closed adapter score-mode
boundary replaced string fallback handling; no generic registry or wrapper layer
added. Review found and fixed overflowing even medians/percentages, with regression
coverage. Lighthouse units verified against installed 13.6.0 audit sources. No
real Lighthouse measurements, human review feedback or statistical claims made.

Original writer chat was verified idle before reclaiming its stale shared-server
PID lock. Recovery retained the day's target of five commits and preserved work.
Two earlier commits plus three recovery commits comprise the day's goal.

## Integration and next action

Implementation [PR #13](https://github.com/ITJayasuriya/releaseproof/pull/13) merged as
`919f87aa98fe661f0f58c0dd20be5bbf1846acab`
from `build/lab-evidence-contract`, tested at
`ff2a579696cf53c5d6154578546a1fdf41d2ab54`. Required quality CI passed:
check, 42 domain tests, build and 3 Linux browser setup smoke tests. Run: https://github.com/ITJayasuriya/releaseproof/actions/runs/45608039615.
Owner directly approved the merge and gave standing authorization to merge
necessary reviewed PRs after required checks without asking again. The merge
respected normal branch protection; the merged source tree equals the tested
head. The daily implementation goal is complete; alpha/v1 gates remain open.
No deployment needed for this domain-only work. Live setup remains at
https://isuru-releaseproof.pages.dev; it has no product workflow yet.

Next: safe bounded filesystem inputs and report-to-provenance binding, packet
manifest/CLI generation, then static summary/raw sample viewer to complete M1.
Remaining v1: axe observations, screenshot masks/diffs, local import,
annotations/exports, independent CI integration, packed CLI install, resource and
security hardening, accessible browser journeys, release/publisher verification.

Three-maintainer discovery observation and real pilot evidence remain unavailable.
Proceed with synthetic engineering work without claiming demand validation.
Deadline remains 5 January 2027; interruption and recovery did not complete an
extra delivery day or move the deadline. No credential blocker for current work.

## PR readiness and next scheduled implementation

The owner requested maintenance after completing the daily product goal. Keep the
five product commits and commit target unchanged; dependency integration and
handoff documentation are separate maintenance, not an extra delivery day.

- PR #1 (checkout) merged as `ef815d4` after fresh required quality run
  [45623790958](https://github.com/ITJayasuriya/releaseproof/actions/runs/45623790958).
- PR #2 (setup-node) merged as `29fbc70` after fresh required quality run
  [45624296377](https://github.com/ITJayasuriya/releaseproof/actions/runs/45624296377).
  Its adjacent workflow-line conflict was resolved in an isolated worktree using a
  normal merge commit, preserving both reviewed pins; no force push. That temporary
  worktree was removed. Both CI runs cover install, check, 42 domain tests, build
  and all three Linux browser setup smoke tests. Both action definitions use Node
  24 and retain our required inputs. No registry authentication or publishing is
  configured in this workflow. No product UI or deployment changed.
- PR #3 (TypeScript 7): hold. Its `npm ci` failed with ERESOLVE because
  `typescript-eslint@8.73.0` requires TypeScript `>=4.8.4 <6.1.0`. Keep 6.0.3
  until compatible tooling is verified; do not force dependency resolution.
- PR #12 (external alpha proposal): hold as submitted. It changes only docs and
  browser tests, falsely marks M1 complete, has no CI checks and targets UI that
  does not exist. Its invalid-input test can skip the error assertions. A useful
  revision needs actual implementation, fixture-driven behavior tests and honest
  milestone status; it must not close #7 until the alpha gate is satisfied.

Tomorrow's first unit is bounded filesystem loading plus an explicit collection
manifest that binds raw report hashes to revision, scenario and environment. Read
only declared local inputs, reject traversal and escaping symlinks, and enforce
byte/file limits before parsing. Preserve unavailable metric reasons. Prove valid
zero, missing evidence, malformed/version errors and unsafe paths with fixtures.
Then build the normalized packet writer and CLI with atomic output that preserves
existing files on failure, followed by the static summary and raw sample table.
Do not claim verified provenance from caller-supplied labels alone.

Before writing tomorrow: read RUN-STATE and check the writer lock, use current
main, keep the existing lockfile and run the required checks. Final handoff is
committed through a separate documentation PR so the local checkout can be clean. There is no need to
create another schedule or change the deadline.

## 26 November — collection implementation in progress

Daily target selected once: three coherent commits. Bounded declared-file reader
implemented with 20 MiB JSON/100 MiB collection limits, strict UTF-8, nesting cap,
regular-file enforcement and rejection of traversal and symlink inputs. Nine
boundary tests passed, including cumulative resource limits. No UI/deployment
changed. Next: manifest/hash binding and atomic packet output. Alpha remains open.

Collection contract now binds report byte hashes to a strict versioned revision,
scenario and environment declaration. Duplicate IDs, paths and hashes are rejected
rather than counted as additional samples. Report tool-version disagreement,
malformed/unsupported reports and altered bytes fail explicitly; unavailable
metric reasons survive normalization. All 61 domain tests and check passed.
Hashes verify bytes, not independent measurements or truth of caller metadata.

Development lab packet CLI now works from Node 24 (`npm run cli -- build ...`):
normalized schema-versioned packet, raw report/manifest assets under SHA-256 names,
deterministic ID, explicit unsupported axe/screenshots, staged directory output,
cooperating builder lock and no overwrite of existing output. Two five-sample
synthetic fixture collections exercise the real CLI. See [COLLECTIONS.md](COLLECTIONS.md)
for contract, exact command, recovery and stable-directory limitations.

Ponytail/Thermo-Nuclear branch review kept filesystem reads, collection validation,
packet writing and CLI errors in focused modules with no adapter registry or new
dependency. Fixed parse errors that could echo raw JSON contents; subprocess
regression proves secret-like malformed input is not echoed. Hash duplication is
rejected rather than counted as independent sampling. No independent reviewer or
real performance measurements claimed.

Check, 67 domain/integration tests and build pass on this branch. Local
Chromium/WebKit setup+axe: 2 passed after retry with permission to bind the test
port (initial sandbox EPERM was not a product failure). Local Firefox unrun.
Required Linux CI and PR integration are next. PRs #3/#12 heads remain unchanged
and retain their prior blockers. Issues #4–#9 remain open; this is partial M1 work.
Next: static summary/raw sample viewer and strict packet import/hash verification,
then axe and screenshot workflows. Full remaining v1 scope above still applies.
No npm publication or deployment; public setup page has not been replaced.
