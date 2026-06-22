---

description: Coverage plan mapping the Spring Boot and custom-element features to a test tier.
name: test-plan

---

# Liferay One Test Plan

This is the *what to test* companion to [`README.md`](./README.md) (the *how to test*). It inventories the behavior of the two client extensions under test — the Spring Boot REST service and the custom-element SPA — and assigns each item to the cheapest tier that can prove it, with a priority and concrete cases.

> Scope is intentionally limited to these two client extensions for now. For Spring Boot that covers its full testable surface — REST endpoints, scheduled crons, and async Pub/Sub subscribers. Other surfaces (site pages, Objects, roles, external-integration contracts, and cross-cutting flows) are out of scope and are not tracked here or in [`plan/`](./plan/).

Tiers (cheapest first): **Unit (Vitest)** for React/util logic, **Unit (JUnit)** for Spring logic — controllers via MockMvc, and services, converters, crons, and subscribers with Mockito — **Integration (Playwright `request`)** for anything needing a booted portal, **E2E (Playwright browser)** for whole UI flows. Push every test down to the cheapest tier that can still prove the behavior.

Priorities: **P0** revenue/data-integrity or security paths that must never silently break; **P1** core feature behavior; **P2** edge cases and polish.

## Coverage Snapshot

Status vocabulary is deliberate. **▶ executing** means a test runs and asserts behavior today, so a regression fails the build. **⬚ unit-covered** means the logic is proven in isolation (JUnit/Vitest) but the in-action journey is deferred. **⊘ deferred** means a spec is written and collected but `test.describe.fixme`'d behind an environment blocker — it asserts nothing until unblocked. **◷ partial** means a test exists but exercises only part of the surface. Do not read ⬚/⊘ as "verified end to end."

| Surface | Tier | Status |
|---|---|---|
| Spring Boot REST controllers (contract, status, validation, error-handler mapping) | Unit (JUnit) | ▶ executing (`src/test/java/**/*RestControllerTest.java`) |
| Spring Boot crons | Unit (JUnit) | ◷ partial — handlers invoked, but loop bodies run only when seeded (`*ScheduledTest`) |
| Spring Boot Pub/Sub subscriber (Product2 + PricebookEntry, dedupe, parse-error) | Unit (JUnit) | ▶ executing (`SalesforceObjectPubsubSubscriberTest`) |
| Spring Boot logic-bearing services & converters | Unit (JUnit) | ◷ partial — see [`plan/services.md`](./plan/services.md), [`plan/converters.md`](./plan/converters.md); 8 logic-bearing classes still uncovered |
| Spring Boot `/ready` liveness | Integration | ▶ executing (`springBootReady.spec.ts`) |
| Spring Boot unauthenticated 401 contract (20 endpoints) | Integration | ▶ executing (`springBootAuth.spec.ts`) |
| Custom-element SPA routes | Unit (Vitest) | ◷ partial — route tables asserted, components not yet rendered (`src/pages/**/*Routes.test.tsx`) |
| Custom-element utils | Unit (Vitest) | ▶ executing (`src/utils/*.test.ts`) |
| Authenticated portal home | E2E | ▶ executing (`smoke.spec.ts`) |
| Entitlement-gated SPA access | E2E | ▶ executing (`restrictedAccess.spec.ts`) |
| Every P0/P1 multi-surface journey (checkout, upload/download, Salesforce, scopes) | Integration / E2E | ⊘ deferred — spec written, see [`plan/flows.md`](./plan/flows.md) |

The seeded specs are the templates: clone the pattern, don't reinvent it. The structured plan under [`plan/`](./plan/) tracks every route, endpoint, cron, subscriber, **service, and converter** by ID; run `yarn plan:report` for the live picture and `yarn plan:coverage` for the go-live percentage. Coverage there means *a test references the ID* — it is a traceability signal, not a guarantee the test is strong, so treat ◷ rows as work-in-progress and lean on the Vitest coverage floor (`yarn test:coverage`) for the SPA's true behavioral number.

---

## 1. Spring Boot REST — `/o/one/v1`

Controller request/response shaping (routing, status codes, validation, body mapping) is **Unit (MockMvc, `standaloneSetup`)** — mock the service/integration collaborators. End-to-end behavior through the OAuth2 proxy (scope enforcement, account-membership filtering, real Object reads) is **Integration**.

| Endpoint | Tier | Pri | Cases |
|---|---|---|---|
| `GET /ready` | Unit | P1 | ✅ 200 + body `READY`. |
| `GET /accounts/{erc}/jira/object-key` | Unit + Integration | P1 | Valid ERC → object key; unknown ERC → 404; missing `customer.read` scope → 403. |
| `GET /jira/accounts/{erc}/business-events` | Unit + Integration | P1 | Returns list; empty account → `[]`; `ticket.read` enforced. |
| `GET …/business-events/{id}` | Unit | P1 | Found → DTO; missing → 404. |
| `GET …/business-events/{id}/versions` | Unit | P2 | Returns version history ordered by timestamp. |
| `POST …/business-events` | Unit | P1 | Valid body → created + returns list; malformed body → 400; `ticket.write` enforced. |
| `PUT …/business-events/{id}` | Unit | P1 | Updates fields; unknown id → 404. |
| `DELETE …/business-events/{id}` | Unit | P1 | Deletes; unknown id → 404; idempotent re-delete. |
| `GET /jira/accounts/{erc}/tickets?ticketIds=` | Unit + Integration | P1 | Returns tickets; filters by id list when provided. |
| `GET /jira/business-events/fields/{field}/options` | Unit | P2 | Returns enumerated options for the asset field. |
| `POST /ticket-attachments/initiate-upload` | Unit | **P0** | Valid → Draft row + resumable session URL; file > 50 MB → 400; closed ticket → 400; disallowed MIME → 400; missing body fields → 400. |
| `POST /ticket-attachments/{id}/complete-upload` | Unit | **P0** | MD5 matches GCS → state Approved + Jira comment posted; MD5 mismatch → object deleted + error; already Approved → 409; Jira post fails → draft comment stored for retry. |
| `GET /ticket-attachments/by-id/{id}/download` | Unit + Integration | **P0** | Member → signed URL (≤15 min expiry); non-member → 403; missing → 404. |
| `GET /ticket-attachments/by-external-reference-code/{erc}/download` | Unit | P1 | Same as by-id via ERC. |
| `DELETE /ticket-attachments/{id}` | Unit | P1 | Flips to Trashed; GCS delete deferred to cron; returns 200. |
| `GET /tickets/{id}/ticket-attachments/upload-access-check` | Unit | P1 | Open + member → 200; closed → 400; non-member → 403; missing ticket → 404. |
| `GET /tickets/{id}/ticket-attachments/download-access-check` | Unit | P1 | Member → 200 (closed allowed); non-member → 403; missing → 404. |
| `POST /entitlements/generate?commerceOrderItemId=` | Unit + Integration | **P0** | Creates one Entitlement per EntitlementDefinition for the product; **idempotent** on re-run; unknown order item → 400. |

> The attachment upload/download and entitlement-generation paths are P0 because they gate customer data and what a customer is allowed to use — verify the permission and idempotency branches first.

---

## 2. Scheduled Tasks & Async Subscribers

Crons and the Pub/Sub subscriber are **Unit** at the handler level: instantiate the bean, inject mocked collaborators with `ReflectionTestUtils`, invoke the method directly, and assert the side-effect calls — never wait on wall-clock or hit a live broker. Seeding due rows and invoking the method through a booted portal is an optional **Integration** layer where it adds confidence.

| Task | Tier | Pri | Cases |
|---|---|---|---|
| `scheduledSendExpiringLicenseKeyEmails` | Unit | P1 | Keys in the 30/14/0-day window → one templated email per user; nothing due → no send; email-API failure logged, loop continues. |
| `scheduledCleanUp` (ticket attachments) | Unit | P1 | Trashed rows → GCS object + Liferay row deleted; GCS failure → row retained + error logged. |
| `scheduledDeleteTicketAttachment` | Unit | P1 | Drains pending hard-deletes; idempotent on re-run. |
| `scheduledUpdateTicketAttachmentDraftCommentBody` | Unit | P1 | Rows with a draft comment → Jira retried; success clears the draft; failure leaves it for the next run. |
| `scheduledAssetObjectsCacheEviction` | Unit | P2 | Cache evicted on schedule so stale Jira asset objects are not served. |
| `SalesforceObjectPubsubSubscriber` | Unit | **P0** | Valid event → upserts products/price entries **idempotently**; duplicate → dropped; parse error → no partial write. |

> The Salesforce subscriber is P0: it is the inbound revenue-data path. Verify the idempotency and dedupe branches first.

---

## 3. Custom Element UI (React)

Default to **Unit (Vitest)** with mocked `Liferay.Util.fetch`/SWR — render a page/component, assert it renders fetched data, validates forms, and surfaces errors. Reserve **E2E** for one happy-path per page group that exercises routing + real headless calls.

| Page group | Tier | Pri | Key flows |
|---|---|---|---|
| AccountSelector | Unit + E2E | P1 | Loads memberships; default preselected; switching changes account context in subsequent calls; accounts without a role hidden. |
| MyAccount (Subscriptions, Orders, Billing & Usage, Details, Team) | Unit + E2E | P1 | Subscription state transitions; license-key generate/download; SaaS vs. Composable usage branch; invoice download; team role assignment + enforcement; checkout cart. |
| ProductPurchase | Unit + E2E | **P0** | Catalog loads; purchase form validation (seats/qty/required); payment → CommerceOrder with correct line items, price, tax; confirmation. |
| PublisherDashboard | Unit + E2E | P1 | Profile load + edit validation; asset/logo upload (GCS); publish state transitions; sales-summary refresh. |
| Support (Attachments, BusinessEvents) | Unit + E2E | P1 | Attachment upload progress + resumable handling; download via signed URL; business-event create posts to Jira Assets; heat-tag filter/sort. |
| Admin (Apps, Solutions, Trials, Environments, Publishers, Orders, Payments, Finance, etc.) | Unit + E2E | P1/P2 | Tables paginate/sort/filter on large datasets; inline edit + validation; **admin-only pages reject non-admin with 403**; network/5xx → user-facing error. |

Cross-cutting UI unit cases (P1): OAuth2 token refresh/expiry; empty-state and error-state rendering; `RestrictedFeatureMessage` shown when entitlement/permission absent.

---

## 4. End-to-End Flows & Cross-Cutting Requirements

The multi-surface user journeys are enumerated in [`plan/flows.md`](./plan/flows.md). What's provable against a local environment is covered now; the rest are tracked as `deferred` with the blocker, because they write to or read from external systems (Jira, GCS, Salesforce), need seeded commerce data, or need a user provisioned with an entitlement the seed admin lacks.

| Requirement | Tier | Pri | Status |
|---|---|---|---|
| Unauthenticated → 401 on every endpoint but `/ready` | Integration | P0 | ✅ covered (`springBootAuth.spec.ts`) |
| Entitlement-gated page groups render the Restricted Page | E2E | P1 | ✅ covered (`restrictedAccess.spec.ts`) |
| Checkout (free/paid), ticket upload/download, business-event lifecycle, publisher onboarding, account team, license generation/expiry, Salesforce sync | E2E / Integration | P0/P1 | ⊘ deferred — need external stubs, seeded data, or an entitled user |
| OAuth2 scope enforcement (403 on missing scope) | Integration | P0 | ⊘ deferred — needs an OAuth2 app to mint a scoped token |

Unlocking the deferred journeys is mostly environment work: a provisioning fixture that grants the test user the gating entitlement/role (for the SPA happy paths), and external-system stubs or seeded commerce data (for the Jira/GCS/Salesforce/commerce journeys).

---

## Execution Order (recommended build-out)

1. **P0 unit tests** — ticket-attachment upload/download, entitlement generation, and the Salesforce subscriber's idempotency branches. Fastest, highest risk.

1. **Remaining Spring Boot unit tests** — every other endpoint, cron, service, and converter's contract, validation, and error branches.

1. **Integration happy-paths** per Spring endpoint behind OAuth2 scopes.

1. **ProductPurchase + MyAccount unit flows** — revenue path.

1. **Custom-element route unit tests** across the remaining page groups.

1. **E2E smoke per page group**.