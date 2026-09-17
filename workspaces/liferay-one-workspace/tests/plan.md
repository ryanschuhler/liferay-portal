# Testing Plan

Every SPA route, REST endpoint, cron, subscriber, service, and converter in the two client extensions under test carries a row with a stable ID. Tests cite those IDs. Two scripts keep the two sides honest:

- **`checkPlan`** — the plan covers the code. It enumerates the real code surface and fails on anything that ships without a row.
- **`checkCoverage`** — the tests cover the plan. It scans the suites for plan IDs and reports how far the suite is from go-live.

## Files

One file per surface, scaffolded from the code and then curated by hand.

| File | Surface | Source anchor |
| --- | --- | --- |
| [`converters.md`](./plan/converters.md) | Spring Boot converters | `converter:<Class>` |
| [`crons.md`](./plan/crons.md) | Spring Boot scheduled tasks | `cron:<method>` |
| [`flows.md`](./plan/flows.md) | End-to-end and cross-cutting journeys | `spec:<area>#<slug>` |
| [`rest.md`](./plan/rest.md) | Spring Boot REST endpoints | `rest:<METHOD>:<path>` |
| [`routes.md`](./plan/routes.md) | Custom-element SPA routes | `route:<group>:<path>` |
| [`services.md`](./plan/services.md) | Spring Boot services | `service:<Class>` |
| [`subscribers.md`](./plan/subscribers.md) | Spring Boot Pub/Sub subscribers | `subscriber:<Class>` |

## Row Schema

Every table uses this header:

```
| ID | Requirement | Type | Priority | Status | Source |
```

- **ID** — generated from the Source. Tests reference it; do not hand-edit it.
- **Requirement** — what "tested" means for this item. Curate freely.
- **Type** — `unit`, `integration`, or `e2e`.
- **Priority** — `P0` gates go-live, then `P1` and `P2`.
- **Status** — `planned` counts toward go-live and needs a test; `deferred` and `n/a` are excluded from the denominator.
- **Source** — the code anchor. `checkPlan` reconciles every prefix against the code except `spec:`, which is curated by hand.

## Linking a Test to the Plan

Put the ID in the test title, so it reaches the test report too:

```ts
test('[ROUTE-ADMIN-MP-ORDERS] renders the orders table', async () => { ... });
```

```java
@DisplayName("[REST-POST-ENTITLEMENTS-GENERATE] generates an entitlement")
```

`checkCoverage` scans for ID-shaped tokens, so any framework works and one test may cite several IDs. The brackets are convention, not syntax — a bare token counts too, so a data-driven table holding `planId: 'OBJ-LICENSEKEY'` needs no extra annotation.

## Commands

From `workspaces/liferay-one-workspace`:

```bash
yarn plan:check       # Does the plan cover the code? (CI gate)
yarn plan:coverage    # Does every item have a test, stubs included?
yarn plan:report      # Real versus pending versus uncovered
yarn plan:scaffold    # Reconcile after a code change; preserves curation
```

`plan:coverage` counts any reference, so a pending stub scores the same as a real test — it answers "is every item tracked?". `plan:report` looks at *which* file covers each item, separates real tests from stubs, and writes per-item traceability to `tests/test-results/plan-report.md`. `checkCoverage` also takes `--list` to name every uncovered item and `--min <pct>` to fail under a threshold.

## What `checkPlan` Reports

- **GAP** — code with no row. Run `yarn plan:scaffold`, then curate the new row.
- **STALE** — a row with no code. `scaffold` drops it on the next run.
- **ORPHAN** — a test tag matching no row, usually a typo or a renamed ID. It counts toward nothing, so it fails the check.
- **DANGLING** — a row's own prose citing an ID that matches no row, usually left behind by a rename. Nothing else catches it, because prose is not a test tag.

Both ID checks fire only on tags whose prefix is a real plan prefix (`ROUTE-`, `REST-`), so unrelated hyphenated tokens are ignored. A wildcard (`ROUTE-ADMIN-*`), an elision (`…-COMPLETE-UPLOAD`), and the leading part of a real ID all read as abbreviations rather than errors.