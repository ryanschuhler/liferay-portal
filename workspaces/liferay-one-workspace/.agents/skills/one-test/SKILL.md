---

allowed-tools: [Bash, Glob, Grep, Read]
description: Run the Liferay One workspace Playwright test suite — integration and e2e. Use when the user asks to run tests, check tests pass, or verify a change before a PR.
name: one-test

---

# Run One Workspace Tests

Two tiers cover this workspace. Run from the workspace root (`workspaces/liferay-one-workspace`). See [`tests/README.md`](../../tests/README.md) for layout and [`tests/TEST_PLAN.md`](../../tests/TEST_PLAN.md) for what each tier owns.

## 1. Pick the Tier(s)

| Tier | Command | Needs a running portal? |
|---|---|---|
| Integration (Playwright `request`) | `yarn test:integration` | Yes |
| E2E (Playwright browser) | `yarn test:e2e` | Yes |

Run only the tier(s) relevant to the change. Integration proves an endpoint's contract and its OAuth2 scope enforcement; e2e proves a whole UI flow through the browser. Reach for e2e only when integration cannot show the behavior.

## 2. First Run

If `tests/.env` or the Playwright browser is missing:

```bash
yarn bootstrap:tests
```

Idempotent — creates `.env` from `.env.example`, installs deps, fetches Chromium.

## 3. Portal Precondition

Both tiers run against a booted portal. Confirm the environment is up first:

```bash
docker ps --format '{{.Names}}\t{{.Status}}'
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/c/portal/status   # expect 200
curl -s http://localhost:58081/ready                                              # expect READY
```

If not up, start it with the `one-env-up` skill. If `8080` is `200` but a `/o/one/v1` test fails on auth, the spec needs OAuth2 scopes — populate `OAUTH_CLIENT_ID`/`OAUTH_CLIENT_SECRET` with `scripts/extract_oauth_credentials.sh <oauth-app-name>` (the basic-auth admin path does not carry custom scopes).

## 4. Run a Single Test

```bash
(cd tests && yarn playwright test integration/specs/springBootReady.spec.ts)
```

## 5. Report

State which tiers ran, the pass/fail counts, and — on failure — the failing test name plus the relevant assertion or stack line. For portal-backed failures, check `<bundles>/logs` and the Spring Boot container logs (`docker logs liferay-one-etc-spring-boot`) before concluding the test itself is wrong.

For the coverage picture — which planned routes, endpoints, crons, and subscribers have real tests versus none — run `yarn plan:report` (and `yarn plan:check` to confirm the plan still matches the code).