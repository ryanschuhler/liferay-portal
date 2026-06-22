---

allowed-tools: [Bash, Glob, Grep, Read]
description: Run the Liferay One workspace test suite — Vitest unit, Spring JUnit, and Playwright integration/e2e. Use when the user asks to run tests, check tests pass, or verify a change before a PR.
name: one-test

---

# Run One Workspace Tests

Four tiers cover this workspace. Run from the workspace root (`workspaces/liferay-one-workspace`). See [`tests/README.md`](../../tests/README.md) for layout and [`tests/TEST_PLAN.md`](../../tests/TEST_PLAN.md) for what each tier owns.

## 1. Pick the Tier(s)

| Tier | Command | Needs a running portal? |
|---|---|---|
| Unit — React/util (Vitest) | `yarn test:unit` | No |
| Unit — Spring (JUnit; MockMvc for controllers) | `./gradlew :client-extensions:liferay-one-etc-spring-boot:test` | No |
| Integration (Playwright `request`) | `yarn test:integration` | Yes |
| E2E (Playwright browser) | `yarn test:e2e` | Yes |

Run only the tier(s) relevant to the change. After editing a Spring controller, cron, subscriber, service, or converter, run its JUnit test; after editing the custom element, run Vitest; touching either and want end-to-end proof, run the matching Playwright project.

## 2. First Run

If `tests/.env` or the Playwright browser is missing:

```bash
yarn bootstrap:tests
```

Idempotent — creates `.env` from `.env.example`, installs deps, fetches Chromium.

## 3. Portal Precondition (integration + e2e only)

Confirm the environment is up before running portal-backed tiers:

```bash
docker ps --format '{{.Names}}\t{{.Status}}'
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/c/portal/status   # expect 200
curl -s http://localhost:58081/ready                                              # expect READY
```

If not up, start it with the `one-env-up` skill. If `8080` is `200` but a `/o/one/v1` test fails on auth, the spec needs OAuth2 scopes — populate `OAUTH_CLIENT_ID`/`OAUTH_CLIENT_SECRET` with `scripts/extract_oauth_credentials.sh <oauth-app-name>` (the basic-auth admin path does not carry custom scopes).

## 4. Run a Single Test

```bash
# Vitest — one file
(cd client-extensions/liferay-one-custom-element && yarn test src/utils/string.test.ts)

# Spring — one class
./gradlew :client-extensions:liferay-one-etc-spring-boot:test --tests EntitlementsRestControllerTest

# Playwright — one spec
(cd tests && yarn playwright integration/specs/springBootReady.spec.ts)
```

## 5. Report

State which tiers ran, the pass/fail counts, and — on failure — the failing test name plus the relevant assertion or stack line. For portal-backed failures, check `<bundles>/logs` and the Spring Boot container logs (`docker logs liferay-one-etc-spring-boot`) before concluding the test itself is wrong.

For the coverage picture — which planned routes, endpoints, crons, and subscribers have real tests versus none — run `yarn plan:report` (and `yarn plan:check` to confirm the plan still matches the code).