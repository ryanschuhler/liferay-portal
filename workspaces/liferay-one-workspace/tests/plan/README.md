# Liferay One — Definitive Testing Plan

The source of truth for what must be tested before [LPD-87600 (One Liferay
Platform)](https://liferay.atlassian.net/browse/LPD-87600) goes live in
mid-August 2026.

The plan is currently scoped to the two client extensions under test — the
custom-element SPA and the Spring Boot service. It enumerates every SPA route,
REST endpoint, scheduled cron, and Pub/Sub subscriber as a row with a stable ID,
plus hand-curated cross-cutting flows. Tests reference those IDs, and two scripts
keep the plan honest:

- **`check-plan`** proves the plan covers the code. It enumerates the actual
  code surface and fails if anything ships without a plan row.
- **`check-coverage`** proves tests cover the plan. It scans the test suites for
  plan IDs and reports the percentage complete — our distance to go-live.

## Files

Organized by surface type. Each file is auto-scaffolded from the code, then
hand-curated.

| File | Surface | Source anchor |
| --- | --- | --- |
| [`routes.md`](./routes.md) | Custom-element SPA routes | `route:<group>:<path>` |
| [`rest.md`](./rest.md) | Spring Boot REST endpoints | `rest:<METHOD>:<path>` |
| [`crons.md`](./crons.md) | Spring Boot scheduled tasks | `cron:<method>` |
| [`subscribers.md`](./subscribers.md) | Spring Boot Pub/Sub subscribers | `subscriber:<Class>` |
| [`flows.md`](./flows.md) | End-to-end & cross-cutting journeys | `spec:<area>#<slug>` (hand-curated) |

## Row schema

Every plan file holds Markdown tables with this exact header:

```
| ID | Requirement | Type | Priority | Status | Source |
```

- **ID** — stable identifier tests reference. Do not hand-edit; generated from
  the Source. Example: `ROUTE-ADMIN-MP-ORDERS`.
- **Requirement** — what "tested" means for this item. Curate freely.
- **Type** — `unit`, `integration`, or `e2e`.
- **Priority** — `P0` (gates go-live), `P1`, `P2`.
- **Status** — `planned` (counts toward go-live and needs a test), `deferred`,
  or `n/a` (both excluded from the denominator).
- **Source** — the code anchor. Enumerable prefixes are reconciled against code
  by `check-plan`; `spec:*` anchors are curated by hand and never enumerated.

## How tests link to the plan

A test "covers" a plan item by embedding the item's ID in square brackets —
typically in the test title, so it shows up in test reports too:

```ts
// Playwright / Vitest
test('[ROUTE-ADMIN-MP-ORDERS] renders the orders table', async () => { ... });
```

```java
// JUnit
@DisplayName("[REST-POST-ENTITLEMENTS-GENERATE] generates an entitlement")
```

`check-coverage` scans for ID-shaped tokens, so any framework works and one test
may cover several IDs (list them all in the title). An ID also counts when it
appears as a bare token rather than bracketed — e.g. a data-driven test whose
table holds `planId: 'OBJ-LICENSEKEY'` and builds the title dynamically — so
table-driven suites need no extra annotation.

## Workflow

```bash
# from workspaces/liferay-one-workspace
yarn plan:check       # plan covers code?  (CI gate)
yarn plan:coverage    # tests cover plan?  (every item has a test, incl. stubs)
yarn plan:report      # real vs pending vs uncovered  (true go-live picture)
yarn plan:scaffold    # reconcile plan after code changes (safe: preserves curation)
```

`plan:coverage` counts an item as covered when any test references its ID — a
hard-failing pending stub counts the same as a real test, so it answers "is
every item tracked?". `plan:report` looks at *which* file covers each item and
separates **real** tests from **pending** stubs, so it answers "how close are we
*really*?". It prints a per-surface breakdown and writes a full per-item
traceability report to `tests/test-results/plan-report.md`.

`check-plan` reports three kinds of problem:

- **GAP** — new code shipped without a plan row: run `yarn plan:scaffold` to add
  it, then curate the new row.
- **STALE** — code was removed: `scaffold` drops the row on the next run.
- **ORPHAN** — a test carries a plan-ID-shaped tag (e.g. `[OBJ-LICENSEKY]`) that
  matches no plan item, usually a typo or a tag left behind when a plan ID was
  renamed. Such a tag silently counts toward nothing, so it fails the check. Fix
  the tag to match a real plan ID (or remove it). Only tags whose prefix matches
  a real plan prefix (`ROUTE-`, `REST-`) are flagged, so unrelated hyphenated tokens
  are ignored.

`check-coverage` accepts `--list` (show every uncovered item) and `--min <pct>`
(fail under a threshold — wire this into CI as the go-live bar rises).