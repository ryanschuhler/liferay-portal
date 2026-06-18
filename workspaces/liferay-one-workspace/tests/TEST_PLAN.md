---

description: Coverage plan mapping every Liferay One feature to a test tier.
name: test-plan

---

# Liferay One Test Plan

This is the *what to test* companion to [`README.md`](./README.md) (the *how to test*). It inventories the workspace's behavior and assigns each item to the cheapest tier that can prove it, with a priority and concrete cases.

Tiers (cheapest first): **Unit (Vitest)** for React/util logic, **Unit (JUnit + MockMvc)** for Spring controller logic, **Integration (Playwright `request`)** for anything needing a booted portal, **E2E (Playwright browser)** for whole UI flows. Push every test down to the cheapest tier that can still prove the behavior.

Priorities: **P0** revenue/data-integrity or security paths that must never silently break; **P1** core feature behavior; **P2** edge cases and polish.

## Coverage Snapshot

| Surface | Tier | Status |
|---|---|---|
| `string` / `getKebabCase` utils | Unit (Vitest) | ✅ seeded (`src/utils/*.test.ts`) |
| `ReadyRestController` | Unit (JUnit) | ✅ seeded (`ReadyRestControllerTest`) |
| `my-user-account` headless contract | Integration | ✅ seeded (`myUserAccount.spec.ts`) |
| Spring Boot `/ready` liveness | Integration | ✅ seeded (`springBootReady.spec.ts`) |
| Authenticated portal home | E2E | ✅ seeded (`smoke.spec.ts`) |
| Everything below | — | ⬜ planned |

Seeded specs are the templates: clone the pattern, don't reinvent it.

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

## 2. Scheduled Tasks (Crons)

Crons are **Unit** at the method level (extract the body, inject mocked collaborators, assert side-effect calls) and optionally **Integration** by seeding due rows and invoking the scheduled method directly (do not wait on wall-clock).

| Task | Pri | Cases |
|---|---|---|
| License-key expiry notifications (daily) | P1 | Rows at 30/14/0-day windows → templated email per user; nothing due → no send; email API failure logged, loop continues. |
| Ticket-attachment cleanup of Trashed rows (hourly) | P1 | Trashed rows → GCS object deleted + Liferay row deleted; GCS delete failure → row retained + error logged. |
| Draft-comment retry (hourly) | P1 | Rows with non-empty `draftCommentBody` → Jira comment retried; success clears draft; failure leaves draft for next run. |
| JSM closed-ticket attachment cleanup (12h) | P2 | Recently-closed LRHC/LRFLS tickets → associated attachments deleted; deletions logged. |

---

## 3. External Integrations

Contract/branch logic is **Unit** with the HTTP client mocked (assert request shape, retry/backoff, circuit-breaker, error mapping). A thin **Integration** happy-path is worth one spec per integration where a sandbox/stub endpoint exists; never hit live third-party systems from CI.

### 3.1 Salesforce Pub/Sub subscriber — P0
- Valid `OpportunityClosedWon` → upserts AccountEntry, creates/updates CommerceOrder, creates Entitlements.
- Duplicate (ExternalLink idempotency) → ack and drop, no second order.
- Banned-email contact → skip contact, continue processing.
- Transient DB error → nack (Pub/Sub redelivers); parse error → dead-letter immediately; > 5 redeliveries → dead-letter.
- `OpportunityUpdated` / `OpportunityAmended` → correct partial update vs. line-item adjustment.

### 3.2 Jira (REST + Assets + webhook) — P0
- `SupportTicket.onAfterAdd` → issue created with mapped fields.
- Webhook: valid HMAC → cached fields updated; invalid HMAC → 401 + security log; webhook before workspace exists → lazy-creates SupportTicket.
- 401/403 → fail fast + alert; 429 → backoff honoring `Retry-After`; 5xx → exponential retry ×3; timeout → circuit breaker after 5 failures/60s.
- Account→Assets write throttled to one per 5 min/account.

### 3.3 Google Cloud Storage — P0
- Resumable upload session created with correct bucket/object/metadata.
- Complete-upload MD5 validation (match approves; mismatch deletes object).
- Signed-URL expiries: ticket 15 min, publisher 60 min, Jira-embedded 7 days.
- Soft-delete marks Trashed; async drain removes object.
- 5xx → retry ×3; 4xx → fail fast; quota → 429 to client + alert.
- Size/MIME limits: ticket ≤ 50 MB, publisher ≤ 200 MB; allowed MIME sets enforced; publisher asset blocked until ClamAV `processed=true`.

### 3.4 Google Cloud Functions — P1
- `customer_usage_api`, `composable_usage_api`, `entitlement_rules`, `license_key_signer`, `salesforce_transform`: correct URL + per-function token minted per request.
- 404 → null → UI "no data"; other non-2xx → exception → controller 500; parse error → no retry.
- Caffeine cache hit within 1h TTL serves without re-calling.

### 3.5 Liferay Cloud (provisioning) — P1
- Trial provision → stores `cloudInstanceId`; `instance.ready` callback → status Active + welcome email; `instance.failed` → Failed + `errorMessage` + alert; `instance.decommissioned` → Decommissioned.
- Capacity check cached 5 min.
- Provision timeout → do **not** auto-retry (avoid double-provision); mark Failed for manual replay.
- Deprovision failure → retry hourly (idempotent).
- Callback HMAC verification.

### 3.6 BigQuery / Data Warehouse — P2
- Currently via GCF (covered in 3.4). Daily export upsert idempotency by Object PK once direct SDK lands.

---

## 4. Custom Element UI (React)

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

## 5. Object Data Model

Generic headless CRUD per Object is **Integration** — table-drive it over the Object list rather than writing one spec per entity. The seeded `APIHelpers` already wraps auth + JSON.

Per Object (P1, P0 for the money/grant objects: AccountEntry, CommerceOrder/Item, Contract, Entitlement, LicenseKey):
- `POST`/`GET`/`PATCH`/`DELETE` `/o/c/{pluralName}` round-trips.
- ERC lookup resolves for ERC-bearing objects.
- Account-restricted objects filter to the caller's memberships (a user in account A cannot read account B's rows).
- Field validation (required/type/length) enforced; picklists reject out-of-range values.
- Relationships resolve (e.g. Account → Entitlements, Order → OrderItems).
- System objects auto-populate audit fields (`createDate`, `modifiedDate`, `createdBy`).

---

## 6. Batch Import (`liferay-one-batch`)

**Integration**, run once against a fresh environment, asserting post-conditions (the import itself runs at deploy):
- Idempotent — re-import produces no duplicates/errors (P0; UPSERT contract).
- Each Object definition created with correct fields, types, picklist values.
- Relationships established; account-restriction rules applied.
- Commerce catalogs/currencies/price-lists/channel/products present and priced per currency.
- Roles created and assignable.

---

## 7. Instance Settings & Configuration

Mostly **manual/Integration smoke** (secrets are environment-specific, never in CI):
- Service starts with all required properties; a missing required property fails fast with a clear message (Unit on the config-validation path if one exists).
- Rotating `jira-webhook-secret` / `lxc-client-credentials` takes effect on the next request (no restart).
- Each secret (`salesforce-pubsub-credentials`, `gcp-service-account.json`, `jira-api-token`, `jira-webhook-secret`, `lxc-client-credentials`) is retrievable by the Spring Boot service.

---

## 8. End-to-End Workflows (highest value, run sparingly)

Cross-integration scenarios worth one **E2E/Integration hybrid** each — these are the regressions that hurt most:
1. Salesforce opportunity → Account + Order + Entitlements + Jira issue + Analytics notification.
2. Support attachment upload → GCS object + Jira comment (+ draft retry when Jira is down).
3. Trial provision → LXC `instance.ready` callback → status Active → welcome email.
4. License expiry cron → email → customer downloads signed key from MyAccount.

---

## Execution Order (recommended build-out)

1. **P0 controller unit tests** — ticket-attachment upload/download, entitlement generation, Salesforce subscriber branches. Fastest, highest risk.
2. **Object CRUD + account-restriction integration** — one table-driven spec; protects data isolation.
3. **Batch idempotency integration** — one spec; guards every downstream test's fixtures.
4. **ProductPurchase + MyAccount unit flows** — revenue path.
5. **Integration happy-paths** per Spring endpoint behind OAuth2 scopes.
6. **E2E smoke per page group**, then the four cross-integration workflows.
