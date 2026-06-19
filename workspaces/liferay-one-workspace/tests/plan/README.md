# Liferay One — Definitive Testing Plan

The source of truth for what must be tested before [LPD-87600 (One Liferay
Platform)](https://liferay.atlassian.net/browse/LPD-87600) goes live in
mid-August 2026.

The plan enumerates every testable element of the workspace — every route, page,
endpoint, cron, subscriber, Object, role, integration, and end-to-end flow — as
a row with a stable ID. Tests reference those IDs, and two scripts keep the plan
honest:

- **`check-plan`** proves the plan covers the code. It enumerates the actual
  code surface and fails if anything ships without a plan row.
- **`check-coverage`** proves tests cover the plan. It scans the test suites for
  plan IDs and reports the percentage complete — our distance to go-live.

## Files

Organized by surface type. Each file is auto-scaffolded from the code, then
hand-curated.

| File | Surface | Source anchor |
| --- | --- | --- |
| [`ui-routes.md`](./ui-routes.md) | Custom-element SPA routes | `route:<group>:<path>` |
| [`site-pages.md`](./site-pages.md) | Site-initializer layout pages | `page:<friendlyURL>` |
| [`custom-rest.md`](./custom-rest.md) | Spring Boot REST endpoints | `rest:<METHOD>:<path>` |
| [`crons-async.md`](./crons-async.md) | Scheduled tasks & subscribers | `cron:<method>` / `subscriber:<Class>` |
| [`headless-objects.md`](./headless-objects.md) | Batch-imported Objects | `object:<Name>` |
| [`roles-permissions.md`](./roles-permissions.md) | Batch-imported roles | `role:<Name>` |
| [`integrations.md`](./integrations.md) | External-system contracts | `integration:<system>` |
| [`flows.md`](./flows.md) | End-to-end & cross-cutting | `spec:<area>#<slug>` (hand-curated) |

## Row schema

Every plan file holds Markdown tables with this exact header:

```
| ID | Requirement | Type | Priority | Status | Source |
```

- **ID** — stable identifier tests reference. Do not hand-edit; generated from
  the Source. Example: `UI-ADMIN-MP-ORDERS`.
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
test('[UI-ADMIN-MP-ORDERS] renders the orders table', async () => { ... });
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
yarn plan:coverage    # tests cover plan?  (progress toward go-live)
yarn plan:scaffold    # reconcile plan after code changes (safe: preserves curation)
```

When `check-plan` reports a **GAP**, new code shipped without a plan row: run
`yarn plan:scaffold` to add it, then curate the new row. When it reports a
**STALE** row, code was removed: `scaffold` drops it on the next run.

`check-coverage` accepts `--list` (show every uncovered item) and `--min <pct>`
(fail under a threshold — wire this into CI as the go-live bar rises).