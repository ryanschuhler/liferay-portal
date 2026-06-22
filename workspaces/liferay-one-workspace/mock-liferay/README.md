# Mock Liferay Server

A lightweight stand-in for Liferay's HTTP surface so you can run and test the
`liferay-one-custom-element` and `liferay-one-etc-spring-boot` client extensions
**without booting a real Liferay** (no 10 GB JVM, no MySQL). It is dev tooling,
not a deployable client extension.

## What It Provides

-   **Generic headless + Objects CRUD** over an in-memory store, so the many
    `/o/headless-*` and `/o/c/*` endpoints the apps call respond with Liferay
    `Page` shapes and round-trip writes during a session.
-   **OAuth2 endpoints** (`/o/oauth2/token`, `/o/oauth2/jwks`) that mint and
    publish keys for real JWTs. The Spring Boot resource server validates these
    against the mock's JWKS, so **Spring Boot runs unmodified** — no security
    bypass profile.
-   **A reverse proxy** at `/spring-boot/*` to the Spring Boot service, so the
    browser only ever talks to one origin (the mock) and no CORS config is needed
    on Spring Boot.
-   **A catch-all** that logs any unmatched route and returns an empty `Page`, so
    a newly added app route degrades gracefully instead of crashing. The log line
    tells you which fixture to add next.

## Architecture

```
browser (Vite :5173) ──/o/headless,/o/c,/o/graphql──▶ mock-liferay :8080
                     ──/spring-boot/* (OAuth2 calls)──▶ mock-liferay :8080 ──proxy──▶ spring-boot :58081
                                                                                       │ validates JWT vs mock JWKS
                                                                                       │ outbound /o/c, /o/headless ─▶ mock :8080
```

Spring Boot reads its Liferay config from a static configtree committed at
`routes/dxp` (the values Liferay would normally write at boot), pointing
`com.liferay.lxc.dxp.mainDomain` at the mock and registering the OAuth client
ids the mock issues.

## Running

From the workspace root, with the full Liferay stack stopped:

```bash
yarn dev:standalone
```

This builds and starts the mock + Spring Boot (`docker-compose.standalone.yaml`)
and runs Vite with `VITE_MOCK_LIFERAY=true`. Open http://localhost:5173.

Prerequisite (one time): the Spring Boot image must exist. The script builds it
automatically if missing, or build it yourself:

```bash
./gradlew :client-extensions:liferay-one-etc-spring-boot:buildDockerImage
```

To run only the mock (e.g. for the custom element alone):

```bash
cd mock-liferay && npm install && npm start
```

## Adding Fixtures

Drop a JSON file in `fixtures/`. Two shapes are supported:

```json
{"collectionPath": "/o/c/businessevents", "items": [{"id": 1, "name": "..."}]}
```

gives that path full list/CRUD with Liferay `Page` semantics, and

```json
{
	"path": "/o/headless-admin-user/v1.0/my-user-account",
	"response": {"id": 20124}
}
```

returns the response verbatim for an exact path (use for singletons and any
non-`Page` response). Restart the mock to reload fixtures.

Watch the mock's console for `UNMATCHED` warnings — each names a route the apps
hit that has no fixture yet.

## Limitations

-   External integrations Spring Boot calls directly (Jira, Google Cloud Storage,
    Okta) are **not** mocked; endpoints that need them return errors. Flows that
    stay within Liferay's headless/Objects surface work fully.
-   The store is in-memory: writes round-trip within a run and reset on restart.
