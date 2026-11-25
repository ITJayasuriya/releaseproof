# Evidence compatibility and lab comparison policy

25 November 2026. These are internal alpha contracts, not a released CLI API.

| Input                                | Accepted today                                                     | Rejection / missing behavior                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Normalized lab run                   | schemaVersion 1; `schemas/lab-run-v1.json` plus runtime validation | Unknown fields/versions, duplicate sample source IDs, invalid provenance or negative/non-finite metrics fail |
| Lighthouse JSON                      | Exactly 13.6.0; numeric LCP, CLS and TBT audit subset              | Other versions, wrong units, malformed numeric audits, runtime failures and JSON above 20 MiB fail           |
| axe / screenshots / complete packets | Not implemented                                                    | No supported reader; do not treat absent evidence as a pass                                                  |

The adapter takes a JSON string; callers must bound file reads before loading it.
It also checks UTF-8 size before parsing. Standard Lighthouse metadata and other
audits are ignored, never executed or rendered. Audit modes `error`, `manual` and
`notApplicable`, and absent audits, produce no number and retain an explicit
unavailable reason. Unknown modes fail. Valid zero is preserved. LCP/TBT require
`millisecond`; CLS requires `unitless`. TBT is lab total blocking time, not INP.

`readLighthouse` extracts measurements and collection time; it does not establish
that reports share a browser, runner or measurement configuration. Integration
must bind each report to collected revision/scenario/environment provenance and
verify that binding. Caller-supplied metadata alone is not verified provenance.
That integration, safe filesystem loading and complete packet schema remain next
milestone work. No public packet import UI exists yet.

`compareMetric` runtime-validates both lab runs. Scenario ID, route label and state
must match, followed by all environment fields (browser/version, runner, viewport,
device scale, locale, theme, tool version and settings fingerprint). A mismatch
returns `not_comparable` with raw available samples and suppresses the delta.
Missing metrics return `incomplete`, even if five other samples are available.
Fewer than five complete samples per revision also return `incomplete`.

Comparable results contain original samples, median, minimum, maximum and an
informational median difference in original units. A zero baseline yields no
percentage. A percentage outside the finite numeric range returns `incomplete`
with reason `numeric_range`, retaining raw summaries and withholding deltas. Five samples is a review rule, not statistical confidence; overlapping
ranges and noisy runs still need human interpretation and repeat collection.
There is no release safety badge or automatic performance CI threshold.

## Fixture provenance and reproduction

`fixtures/lighthouse/numeric.json` is an original synthetic minimal report subset
under this repository's MIT license, not a real measured Lighthouse run. Its
values test a valid zero, milliseconds and unitless extraction. Tests mutate it
to exercise missing/error audits, incompatible units/versions, invalid numbers,
runtime failure, malformed JSON and the byte limit. The installed Lighthouse
13.6.0 metric audit sources were inspected to confirm units. Full collected LHR
fixtures and independent integration are still required before releasing support.

Run `npm run check`, `npm test`, `npm run build`. Schema regeneration instructions
and JSON Schema's cross-record limitations are in `schemas/README.md`.
