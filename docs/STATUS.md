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

Working tree based on `45386a8`: check, 42 domain tests and production build passed.
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

Implementation PR is being opened from `build/lab-evidence-contract`; see
RUN-STATE.json for its URL and exact tested revision. External PR #12 and unrelated
dependency PRs remain untouched. Required CI must pass before merge.
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
