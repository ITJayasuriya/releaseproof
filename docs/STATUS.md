# Status

25 November 2026 — M0 implementation in progress; not a completed alpha.

Completed acceptance criteria: strict version-1 lab run validation, bounded samples,
required revision/environment provenance, missing versus zero metrics, rejection of
unknown versions/fields and duplicate sample IDs. Synthetic baseline/candidate
fixtures include five samples and an outlier. No human validation claimed.

Checks on the schema working tree based on 829e1a2: `npm run check` passed;
`npm test` passed (9 domain tests). No product browser journey exists yet.

Next: pure comparison policy, Lighthouse adapter and their regression tests, then
CLI packet generation and static review viewer. Remaining v1 includes axe,
screenshot masks/diffs, safe local import, annotations/export, independent CI
integration, clean packed CLI, resource/security hardening and release gates.

Open PR #12 is an external tests/documentation-only alpha proposal; left intact.
No deployment today; the live site still displays the setup marker. No credentials
or database are needed for the current milestone. Real maintainer observation
(three participants, discovery gate) remains unavailable, not waived.

Local Firefox has the documented startup failure; run Chromium/WebKit locally and
all three engines in Linux CI. See RUN-STATE.json for exact run checkpoint.

Comparison acceptance: raw samples, median/range, five-sample minimum, undefined
zero-baseline percentage, explicit scenario/environment mismatch and missing
metric states now have 24 passing domain tests. Schema parsing canonicalizes
field order before environment matching. Deltas remain informational only.

Recovery continuation: verified original build chat idle and reclaimed its stale
shared-server PID lock. Retained target 5 and reconciled comparison commit
`b2621c1`. Lighthouse 13.6.0 adapter now preserves unavailable audit reasons,
rejects untested versions/units/runtime failures, and bounds JSON to 20 MiB.
Adapter working tree: 38 domain tests, check and build passed; no UI changes.
Thermo-Nuclear review simplified score modes into a closed schema enum rather
than scattered fallback conditions. Installed Lighthouse metric implementations
confirm milliseconds for LCP/TBT and unitless CLS. No real lab collection claimed.
