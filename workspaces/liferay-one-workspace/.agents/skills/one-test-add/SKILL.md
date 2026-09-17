---

allowed-tools: [Bash, Glob, Grep, Read, Edit, Write]
description: Add a Playwright test to the Liferay One workspace at the right tier, following the established patterns. Use when the user asks to write, add, or scaffold a test for an endpoint, a route, or a UI flow.
name: one-test-add

---

# Add a One Workspace Test

Route the behavior to the cheapest tier that can prove it, then copy the seeded pattern for that tier. Consult [`tests/TEST_PLAN.md`](../../tests/TEST_PLAN.md) for the prioritized backlog and [`tests/README.md`](../../tests/README.md) for conventions. Run the result with the `one-test` skill.

## 1. Choose the Tier

- An endpoint's contract, its validation branches, or OAuth2 scope enforcement (`/o/one/v1`, headless) → **Playwright integration**, `tests/integration/specs`.
- A whole UI flow through the browser → **Playwright e2e**, `tests/e2e/specs` (last resort).

Decision heuristic: provable without a browser → integration; otherwise e2e.

## 2. Copy the Matching Pattern

### Playwright integration

The `apiTest`/`APIHelpers` harness (`integration/fixtures/apiTest.ts`) is the template; `springBootReady.spec.ts` is the bare-`request` example.

- Import `apiTest as test` from `../fixtures/apiTest`; the `api` fixture (`APIHelpers`) wraps auth + JSON for the `/o/one/v1` Spring Boot endpoints behind OAuth2 scopes.
- `api.get/post/delete` assert success and return parsed JSON. For non-2xx assertions (validation, 404, 403) use `api.send(method, path, body)` which returns the raw `APIResponse`.
- For unauthenticated/security checks, import `test` directly from `@playwright/test` and use the bare `request` fixture (no auth) — see `springBootReady.spec.ts`.

### Playwright e2e

The page objects under `tests/e2e/pages` are the template; `smoke.spec.ts` is the minimal example.

- Sign in through `LoginPage`, then drive the SPA through `SPAPage` rather than raw selectors, so a markup change lands in one file.
- Navigate with `gotoStable` (`tests/e2e/utils/gotoStable.ts`); it waits for the custom element to finish rendering instead of racing the SPA's first paint.
- Assert on what the user sees (`getByRole`, `getByText`), never on an internal class name.
- A persona-scoped spec reads its credentials from the `ONE_*` variables in `.env` and skips with a reason when they are absent — never fall back to the administrator, whose access would satisfy a row that expects a denial.

## 3. Link to the Plan

The plan under `tests/plan/` tracks every route, endpoint, cron, and subscriber by a stable ID, and `plan:coverage` only counts an item as covered when a test references that ID.

- Reference the covered plan ID in the test — a bracketed `[REST-…]` / `[UI-…]` / `[CRON-…]` / `[SUB-…]` tag in the title or a comment (a bare ID token also counts, so data-driven tables need no extra annotation). One test may list several IDs. Find the ID in the matching `tests/plan/*.md` file.
- Adding a brand-new endpoint, route, cron, or subscriber? Run `yarn plan:scaffold` first to generate its row, then curate the Requirement and Priority.
- Confirm with `yarn plan:check` (plan covers the code, no orphan tags) and `yarn plan:report` (real vs. uncovered).

## 4. Verify and Conform

Run the new test (`one-test` skill) and confirm it passes — and, for a regression guard, that it fails when the behavior is broken. Then run the `format-source` skill so the new files match Liferay's coding standards before committing.