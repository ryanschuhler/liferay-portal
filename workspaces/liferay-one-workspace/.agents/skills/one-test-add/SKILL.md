---

allowed-tools: [Bash, Glob, Grep, Read, Edit, Write]
description: Add a test to the Liferay One workspace at the right tier, following the established patterns. Use when the user asks to write, add, or scaffold a test for a controller, util, component, Object, or endpoint.
name: one-test-add

---

# Add a One Workspace Test

Route the behavior to the cheapest tier that can prove it, then copy the seeded pattern for that tier. Consult [`tests/TEST_PLAN.md`](../../tests/TEST_PLAN.md) for the prioritized backlog and [`tests/README.md`](../../tests/README.md) for conventions. Run the result with the `one-test` skill.

## 1. Choose the Tier

- Pure React/util logic, no portal → **Vitest unit**, colocated as `src/**/*.test.{ts,tsx}` in `liferay-one-custom-element`.
- Spring controller routing/status/validation, mockable collaborators → **JUnit + MockMvc**, in `liferay-one-etc-spring-boot/src/test/java/com/liferay/one`.
- Needs a booted portal (headless REST, `/o/one/v1`, Object CRUD, scopes) → **Playwright integration**, `tests/integration/specs`.
- Whole UI flow through the browser → **Playwright e2e**, `tests/e2e/specs` (last resort).

Decision heuristic: runs without a portal → unit; runs without a browser → integration; otherwise e2e.

## 2. Copy the Matching Pattern

### Spring controller (MockMvc)

Model on `EntitlementsRestControllerTest` / `TicketAttachmentsRestControllerTest`:

- `MockMvcBuilders.standaloneSetup(controller)` — no Spring context.
- Inject mocked `@Autowired` fields with `ReflectionTestUtils.setField(controller, "_serviceName", mock)`.
- For a `@AuthenticationPrincipal Jwt` parameter, add `.setCustomArgumentResolvers(new TestJwtArgumentResolver(TestJwtArgumentResolver.newJwt()))`.
- Mock domain models (`SupportIssue`, `TicketAttachment`, …) with Mockito; they are plain non-final classes.
- Prefer the branches that return before any live Liferay client call (null/closed/validation/already-approved). Branches that build a `UserAccountResource`/`AccountResource` from the JWT and hit Liferay belong in an **integration** spec, not a unit test.
- Assert both the status and the body string the controller returns (e.g. `INVALID_TICKET_NUMBER`).

### Playwright integration

Model on `productFeedback.spec.ts` / `objectDefinitions.spec.ts`:

- Import `apiTest as test` from `../fixtures/apiTest`; the `api` fixture (`APIHelpers`) wraps auth + JSON.
- `api.get/post/delete` assert success and return parsed JSON. For non-2xx assertions (validation, 404, 403) use `api.send(method, path, body)` which returns the raw `APIResponse`.
- Object CRUD path is `/o/c/{restContextPath}` — find it via `GET /o/object-admin/v1.0/object-definitions`. Always clean up created rows in a `finally`.
- For unauthenticated/security checks, import `test` directly from `@playwright/test` and use the bare `request` fixture (no auth).

### Vitest unit

Model on `string.test.ts` (pure) and `date.test.ts` (mocked Liferay):

- Pure functions: import and assert directly.
- Code reading `Liferay.ThemeDisplay.*`: a permissive global stub is installed in `src/testSetup.ts`, so imports do not throw. When a test needs a real value, override with `vi.mock('../liferay/liferay', () => ({Liferay: {...}}))`.
- Components: render with `@testing-library/react`, mock `Liferay.Util.fetch` with `vi.fn()`, assert on what the user sees (`getByRole`, `findByText`).

## 3. Verify and Conform

Run the new test (`one-test` skill) and confirm it passes — and, for a regression guard, that it fails when the behavior is broken. Then run the `format-source` skill so the new files match Liferay's coding standards before committing.
