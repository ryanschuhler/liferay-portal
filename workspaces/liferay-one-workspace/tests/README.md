---

description: Playwright integration + E2E tests for the Liferay One workspace.
name: tests

---

# Workspace Tests

Playwright covers the surface exposed after deployment in this workspace. Unit tests live with the code they exercise, not here — see [`Layout`](#layout).

All tests run against a local Liferay instance by default (`${BASE_URL}`, defaulting to `http://localhost:8080`). The `liferay-one-etc-spring-boot` client extension is reached directly at `${SPRING_BOOT_BASE_URL}` (defaulting to `http://localhost:58081`) for unauthenticated probes, and through the Liferay OAuth2 proxy under `/o/one/v1` for everything else.

## First Run Bootstrap

From the workspace root:

```bash
yarn bootstrap:tests      # Create .env, install deps, fetch Chromium
```

`bootstrap:tests` is idempotent — safe to rerun on a fresh checkout. It runs `tests/scripts/bootstrap.sh`.

## Testing Strategy

Three tiers, each with a clear home and trigger:

| Tier | Tooling | Lives In | When to Add |
|---|---|---|---|
| Unit | Vitest (React) | Colocated with source in `liferay-one-custom-element`: `src/**/*.test.{ts,tsx}` | Pure logic — a util transforms input, a component renders a state. No portal required. |
| Unit | JUnit 5 (+ Spring MockMvc) | Colocated with source in `liferay-one-etc-spring-boot`: `src/test/java/**/*Test.java` | Spring logic with no portal: controllers (routes, status codes, bodies) via MockMvc; services, converters, crons, and subscribers via plain JUnit + Mockito. |
| Integration | Playwright `request` (API only, no browser) | `tests/integration` | Anything that depends on a booted portal: the `/o/one/v1` Spring Boot endpoints and OAuth2 scope enforcement. |
| E2E | Playwright (browser) | `tests/e2e` | Whole flows through the custom-element UI (Marketplace, Support, Admin). Last resort — push behavior down to integration when possible. |

Decision heuristic: if it can run without booting the portal, it is a unit test. If it runs without a browser, it is an integration test. Otherwise, it is an E2E test.

## Spring Boot Unit Tests

Java unit tests live under `src/test/java` inside `liferay-one-etc-spring-boot` and use JUnit 5. Controllers are tested with Spring's `MockMvc`; services, converters, crons, and the Pub/Sub subscriber are tested as plain classes with Mockito and `ReflectionTestUtils`. None require a running portal or database.

Run from the Spring Boot extension directory:

```bash
cd client-extensions/liferay-one-etc-spring-boot
../../gradlew test
```

Or from the workspace root:

```bash
./gradlew :client-extensions:liferay-one-etc-spring-boot:test
```

Controller tests use `MockMvcBuilders.standaloneSetup(...)` to instantiate controllers directly — no Spring application context is loaded. Non-controller classes (services, converters, crons, the subscriber) are instantiated with `new`, their `@Value`/`@Autowired` fields set via `ReflectionTestUtils`, and their collaborators mocked with Mockito. Add a test class under `src/test/java` for each controller, cron, subscriber, and logic-bearing service or converter you want to cover.

## Layout

```
tests/
├── playwright.config.ts         # Two projects: integration + e2e
├── TEST_PLAN.md                 # The what-to-test companion to this file
├── tsconfig.json                # Typechecks the specs (CommonJS, for Playwright)
├── e2e/
│   ├── fixtures/                # Playwright test.extend wrappers
│   ├── pages/                   # Page object model
│   ├── specs/                   # *.spec.ts run by the e2e project
│   └── utils/                   # Login, constants, shared helpers
├── integration/
│   ├── fixtures/                # api fixture
│   ├── helpers/                 # APIHelpers — auth + JSON wrapping
│   └── specs/                   # *.spec.ts run by the integration project
├── plan/                        # Structured plan rows, one file per surface
└── scripts/
    ├── bootstrap.sh             # Wired to `yarn bootstrap:tests`
    ├── checkCoverage.ts         # Wired to `yarn plan:coverage`
    ├── checkPlan.ts             # Wired to `yarn plan:check`
    ├── planReport.ts            # Wired to `yarn plan:report`
    ├── scaffoldPlan.ts          # Wired to `yarn plan:scaffold`
    ├── tsconfig.json            # Typechecks the plan tooling (ESM, Node type stripping)
    └── lib/                     # Shared plan, surface, and test index helpers
```

## Running

From this `tests` directory:

```bash
yarn test                        # Both projects
yarn test:integration            # Integration only (no browser)
yarn test:e2e                    # E2E only
yarn test:ui                     # Playwright UI mode
yarn test:report                 # Open the last HTML report
yarn typecheck                   # Typecheck the specs and the plan tooling
```

Or, from the workspace root:

```bash
yarn test:integration
yarn test:e2e
yarn test:unit                   # Vitest in liferay-one-custom-element
yarn test:unit:java              # JUnit in liferay-one-etc-spring-boot
yarn typecheck                   # Typecheck the specs and the plan tooling
```

Run a single spec:

```bash
yarn playwright test integration/specs/springBootReady.spec.ts
```

> `test` is wired here as `playwright test`, and the workspace root delegates its own `test` script to it. Playwright still never runs during a Gradle build: the Liferay Node plugin generates a `packageRunTest` task from a project's `test` script, and the root [`build.gradle`](../build.gradle) disables that task for every project, so `./gradlew build` stays offline. The suite runs on demand through the scripts above, once the portal is up.

## Plan Tooling

[`TEST_PLAN.md`](./TEST_PLAN.md) and the structured rows under [`plan/`](./plan/) record what must be tested. Four scripts keep that plan honest against the code, and run from either this directory or the workspace root:

```bash
yarn plan:check                  # Fail if the code surface has no plan row
yarn plan:coverage               # Report the share of plan rows a test references
yarn plan:report                 # Write the real-versus-pending coverage report
yarn plan:scaffold               # Reconcile gaps and stale rows into plan/
```

These scripts are ESM TypeScript run directly by Node's native type stripping, so they carry their own [`scripts/tsconfig.json`](./scripts/tsconfig.json). `yarn typecheck` checks both that project and the CommonJS one the Playwright specs use.

## Auth

Integration tests authenticate via the `api` fixture:

- If `${OAUTH_CLIENT_ID}` and `${OAUTH_CLIENT_SECRET}` are set, the helper fetches a bearer token from `/o/oauth2/token`. Populate them with `scripts/bootstrap/extract_oauth_credentials.sh <oauth-application-name>` after the environment is up.
- Otherwise it falls back to basic auth with `${LIFERAY_ADMIN_EMAIL}` / `${LIFERAY_ADMIN_PASSWORD}` (defaults: `test@liferay.com` / `test`).

The default basic auth path works out of the box with the seed admin user. The `/o/one/v1` Spring Boot endpoints enforce OAuth2 scopes (`customer.read`, `ticket.read`, `ticket.write`, …), so tests that exercise them must use the OAuth2 path with a client granted those scopes.

## Conventions

- **Page objects** extend `BasePage` and expose `Locator`s as readonly fields.
- **Fixtures** are shallow — they instantiate page objects or helpers and pass them to the test. Keep login/logout in `utils/`, not fixtures, so specs can opt in.
- **Specs** import the tier's fixture(s), call `.describe` once per surface, and keep assertions behavioral (what the user sees or what the API returns), not structural.
- **Selectors** prefer `getByRole` → `getByLabel` → `getByTestId` → CSS. Do not use XPath.
- **Data setup** runs through `APIHelpers` — never seed through the UI when the API can do it.
- **Secrets** come from `.env` at the workspace root (gitignored) or environment. Never commit a real OAuth secret.