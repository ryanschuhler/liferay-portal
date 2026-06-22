---

description: Playwright integration + E2E tests for the Liferay One workspace.
name: tests

---

# Workspace Tests

Playwright covers the surface exposed after deployment in this workspace. Unit tests live with the code they exercise, not here — see [`Layout`](#layout).

All tests run against a local Liferay instance by default (`BASE_URL=http://localhost:8080`). The `liferay-one-etc-spring-boot` client extension is reached directly at `SPRING_BOOT_BASE_URL=http://localhost:58081` for unauthenticated probes, and through the Liferay OAuth2 proxy under `/o/one/v1` for everything else.

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
├── scripts/
│   └── bootstrap.sh             # Wired to `yarn bootstrap:tests`
├── e2e/
│   ├── fixtures/                # Playwright test.extend wrappers
│   ├── pages/                   # Page object model
│   ├── specs/                   # *.spec.ts run by the e2e project
│   └── utils/                   # Login, constants, shared helpers
└── integration/
    ├── fixtures/                # api fixture
    ├── helpers/                 # APIHelpers — auth + JSON wrapping
    └── specs/                   # *.spec.ts run by the integration project
```

## Running

From this `tests` directory:

```bash
yarn test                        # Both projects
yarn test:integration            # Integration only (no browser)
yarn test:e2e                    # E2E only
yarn test:ui                     # Playwright UI mode
```

Or, from the workspace root:

```bash
yarn test:integration
yarn test:e2e
yarn test:unit                   # Vitest in liferay-one-custom-element
```

Run a single spec:

```bash
yarn playwright integration/specs/springBootReady.spec.ts
```

> `test` is intentionally not wired as a script in this package — `./gradlew build` auto-invokes any `yarn test` it finds, and running Playwright during a gradle build would require a running Liferay instance. Vitest owns the `test` slot in `liferay-one-custom-element` at build time; Playwright runs on demand via these scripts.

## Auth

Integration tests authenticate via the `api` fixture:

- If `OAUTH_CLIENT_ID` and `OAUTH_CLIENT_SECRET` are set, the helper fetches a bearer token from `/o/oauth2/token`. Populate them with `scripts/extract_oauth_credentials.sh <oauth-application-name>` after the environment is up.
- Otherwise it falls back to basic auth with `LIFERAY_ADMIN_EMAIL` / `LIFERAY_ADMIN_PASSWORD` (defaults: `test@liferay.com` / `test`).

The default basic auth path works out of the box with the seed admin user. The `/o/one/v1` Spring Boot endpoints enforce OAuth2 scopes (`customer.read`, `ticket.read`, `ticket.write`, …), so tests that exercise them must use the OAuth2 path with a client granted those scopes.

## Conventions

- **Page objects** extend `BasePage` and expose `Locator`s as readonly fields.
- **Fixtures** are shallow — they instantiate page objects or helpers and pass them to the test. Keep login/logout in `utils/`, not fixtures, so specs can opt in.
- **Specs** import the tier's fixture(s), call `.describe` once per surface, and keep assertions behavioral (what the user sees or what the API returns), not structural.
- **Selectors** prefer `getByRole` → `getByLabel` → `getByTestId` → CSS. Do not use XPath.
- **Data setup** runs through `APIHelpers` — never seed through the UI when the API can do it.
- **Secrets** come from `.env` at the workspace root (gitignored) or environment. Never commit a real OAuth secret.