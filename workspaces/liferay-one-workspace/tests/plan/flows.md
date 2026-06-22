# End-to-End Flows & Cross-Cutting Requirements

The per-surface files ([`routes.md`](./routes.md), [`rest.md`](./rest.md),
[`crons.md`](./crons.md), [`subscribers.md`](./subscribers.md)) track the
**cheap unit coverage** — one row per code symbol, proven in isolation with
Vitest or JUnit + Mockito. This file tracks the **real, in-action coverage**:
the integration (`request` against a booted portal) and e2e (browser through
the custom element) tests that exercise those same symbols for real, as the
multi-surface user journeys they belong to.

Journeys use `spec:` Source anchors, which `check-plan` intentionally does not
enumerate — curate these rows by hand.

Most journeys are implemented in code but cannot run end to end against a local
environment yet. Two structural blockers dominate:

- **No `/o/one/v1` proxy locally.** The Spring Boot endpoints enforce OAuth2
  scopes through a proxy path the local portal does not expose, so the
  positive-path REST tests cannot authenticate. Only the unauthenticated
  negative path and `/ready` are reachable directly at `:58081`.
- **External systems and seeded data.** The journeys read from or write to Jira,
  Google Cloud Storage, and Salesforce Pub/Sub, or need seeded commerce data, or
  need a user provisioned with an entitlement the seed admin lacks (the gated
  page groups render the Restricted Page for `test@liferay.com`).

Such journeys are marked `deferred` with the precise blocker, so they stay
tracked without dragging down the go-live denominator. Requirements that are
provable locally today are `planned` and carry a real test.

Every deferred journey below is **already authored** as a full integration or
e2e spec, wrapped in `test.describe.fixme` so it is collected and skipped rather
than run. Each spec's header documents the exact blocker and the environment
variables to set; the spec name is listed in the journey's Requirement. When the
environment work lands — the `/o/one/v1` proxy, a scoped OAuth2 app, the Jira /
GCS / Salesforce Pub/Sub stubs, and a provisioning fixture for the entitled
persona — drop `.fixme`, flip the row to `planned`, and the journey runs as
written.

Unblocking is not purely environmental: several deferred specs lean on
positional or broad-regex selectors (`getByRole('button').last()`,
`selectOption({index: 1})`, `getByText(/order|confirmation|success/i)`) that
were written before the UI could be exercised. Harden these to role/label/test-id
selectors as each journey is enabled, or they will flake or false-pass. The
order-dependent journeys (business-event create→edit→delete, Salesforce
upsert→dedupe→deactivate) are already pinned with `test.describe.configure({mode:
'serial'})` so a failed first step skips the rest instead of cascading.

## Authentication & Access

| ID | Requirement | Type | Priority | Status | Source |
| --- | --- | --- | --- | --- | --- |
| AUTH-UNAUTHENTICATED | Every Spring Boot endpoint except `/ready` rejects an unauthenticated caller with 401 before any controller or outbound Jira/GCS/commerce call runs — negative-path in-action coverage for the whole REST surface, provable locally against `:58081` with no token | integration | P0 | planned | spec:auth#unauthenticated-rejected |
| AUTH-OAUTH2-SCOPES | Deferred — positive-path scope enforcement (`customer.read`, `ticket.read`, `ticket.write`, …) returns 403 on a valid token missing the scope; needs an OAuth2 app to mint a scoped token and the local portal does not expose the `/o/one/v1` proxy path. Staged: `integration/specs/oauth2Scopes.spec.ts` | integration | P0 | deferred | spec:auth#oauth2-scope-enforcement |
| FLOW-RESTRICTED-PAGE | Entitlement-gated page groups (Admin, My Account) mount the SPA but render the Restricted Page view for a user without the entitlement — proves the custom element mounts and routes in-browser and the access gate holds | e2e | P1 | planned | spec:flow#restricted-page |

## Commerce: Purchase, Checkout & Entitlements

| ID | Requirement | Type | Priority | Status | Source |
| --- | --- | --- | --- | --- | --- |
| FLOW-PRODUCT-PURCHASE-ENTRY | Deferred — needs an entitled user with a purchasable product; the seed admin sees the Restricted Page. Drives the ProductPurchase wizard (`ROUTE-PRODUCT-PURCHASE-*`) from account selection through summary. Staged: `e2e/specs/productPurchase.spec.ts` | e2e | P0 | deferred | spec:flow#product-purchase-entry |
| FLOW-CHECKOUT-FREE | Deferred — needs an entitled user and commerce completion. Free-app checkout completes a CommerceOrder and triggers entitlement generation (`REST-POST-ENTITLEMENTS-GENERATE`). Staged: `e2e/specs/productPurchase.spec.ts` | e2e | P0 | deferred | spec:flow#checkout-free |
| FLOW-CHECKOUT-PAID | Deferred — needs an entitled user and a payment-provider stub. Paid-app checkout adds the license and payment-method steps and reaches payment before completing the order. Staged: `e2e/specs/productPurchase.spec.ts` | e2e | P0 | deferred | spec:flow#checkout-paid |
| FLOW-ENTITLEMENT-GENERATION | Deferred — needs seeded commerce order items (the controller branch is unit-covered). Generates one Entitlement per EntitlementDefinition, idempotently, via `REST-POST-ENTITLEMENTS-GENERATE` and the commerce-order-item object action. Staged: `integration/specs/entitlementGeneration.spec.ts` | integration | P0 | deferred | spec:flow#entitlement-generation |
| FLOW-SALESFORCE-ORDER-SYNC | Deferred — inbound Salesforce Pub/Sub upsert; needs a broker/stub. `SalesforceObjectPubsubSubscriber` upserts Commerce price entries, products, and SKUs idempotently and dedupes duplicates; the handler is unit-covered. Staged: `integration/specs/salesforceOrderSync.spec.ts` | integration | P0 | deferred | spec:flow#salesforce-order-sync |

## Account & Licensing

| ID | Requirement | Type | Priority | Status | Source |
| --- | --- | --- | --- | --- | --- |
| FLOW-MY-ACCOUNT-OVERVIEW | Deferred — projects, orders, and billing render for an entitled member; the seed admin sees the Restricted Page. Drives the MyAccount route group (`ROUTE-MY-ACCOUNT-*`). Staged: `e2e/specs/myAccount.spec.ts` | e2e | P1 | deferred | spec:flow#my-account-overview |
| FLOW-ACCOUNT-TEAM-MEMBERS | Deferred — needs an invite flow and member data. Account team invite, assign-role, and remove on `ROUTE-MY-ACCOUNT-ACCOUNT-MEMBERS`, with role enforcement. Staged: `e2e/specs/myAccount.spec.ts` | e2e | P1 | deferred | spec:flow#account-team-members |
| FLOW-LICENSE-GENERATION | Deferred — needs subscription data and the signer. Generates a signed license key tied to a subscription. Staged: `integration/specs/licenseLifecycle.spec.ts` | integration | P0 | deferred | spec:flow#license-generation |
| FLOW-LICENSE-EXPIRATION-EMAIL | Deferred — the expiry cron (`CRON-SCHEDULEDSENDEXPIRINGLICENSEKEYEMAILS`) queues 30/14/0-day templated emails per subscribed user; the cron body is unit-covered in `SubscriptionEntryServiceTest`. Staged: `integration/specs/licenseLifecycle.spec.ts` | integration | P1 | deferred | spec:flow#license-expiration-email |
| FLOW-LICENSE-REVOCATION | Spec-only — no license-key revocation endpoint or action is implemented yet. Staged: `integration/specs/licenseLifecycle.spec.ts` | integration | P1 | deferred | spec:flow#license-revocation |

## Support: Tickets & Business Events

| ID | Requirement | Type | Priority | Status | Source |
| --- | --- | --- | --- | --- | --- |
| FLOW-BUSINESS-EVENT-LIFECYCLE | Deferred — business events are backed by Jira Assets; needs a Jira stub. Create, edit, delete, and activity-history across `ROUTE-BUSINESS-EVENTS-*` and the JiraRestController business-events CRUD, versions, field options, and account object-key endpoints. Staged: `e2e/specs/businessEvents.spec.ts` | e2e | P1 | deferred | spec:flow#business-event-lifecycle |
| FLOW-TICKET-UPLOAD | Deferred — needs Jira and GCS stubs. Attachment upload initiates a GCS resumable session (`REST-POST-TICKET-ATTACHMENTS-INITIATE-UPLOAD`), completes with an MD5 check and posts a Jira comment (`…-COMPLETE-UPLOAD`), with the draft-comment retry cron (`CRON-SCHEDULEDUPDATETICKETATTACHMENTDRAFTCOMMENTBODY`) as fallback; drives `ROUTE-ATTACHMENTS-NEW*` and the upload access check. Staged: `e2e/specs/ticketUpload.spec.ts` | e2e | P1 | deferred | spec:flow#ticket-attachment-upload |
| FLOW-TICKET-DOWNLOAD | Deferred — needs a GCS stub. Signed-URL download (≤15 min expiry) enforces member vs non-member access checks (`REST-GET-TICKETS-…-DOWNLOAD-ACCESS-CHECK`, by-id and by-ERC download); non-member → 403, missing → 404. Staged: `integration/specs/ticketAttachmentDownload.spec.ts` | integration | P1 | deferred | spec:flow#ticket-attachment-download |
| FLOW-TICKET-ATTACHMENT-RETENTION | Deferred — needs Jira and GCS stubs. Attachment retention lifecycle: `scheduledCleanUp` trashes attachments on tickets closed more than 7 days ago (`CRON-SCHEDULEDCLEANUP`) and `scheduledDeleteTicketAttachment` drains the trash to a GCS hard-delete (`CRON-SCHEDULEDDELETETICKETATTACHMENT`), idempotently. Staged: `integration/specs/ticketAttachmentRetention.spec.ts` | integration | P1 | deferred | spec:flow#ticket-attachment-retention |

## Publisher

| ID | Requirement | Type | Priority | Status | Source |
| --- | --- | --- | --- | --- | --- |
| FLOW-PUBLISHER-ONBOARDING | Deferred — needs an entitled publisher user and a GCS stub for logo/asset upload. Publisher edits the profile and uploads a logo, then views published apps, published solutions, and the sales summary across `ROUTE-PUBLISHER-DASHBOARD-*`. Staged: `e2e/specs/publisherDashboard.spec.ts` | e2e | P1 | deferred | spec:flow#publisher-onboarding |

## Admin & Provisioning

| ID | Requirement | Type | Priority | Status | Source |
| --- | --- | --- | --- | --- | --- |
| FLOW-ADMIN-DASHBOARD | Deferred — the Marketplace admin dashboard renders for entitled staff; the seed admin is not entitled and sees the Restricted Page. Drives the Admin route group (`ROUTE-ADMIN-*`): tables paginate/sort/filter, inline edit, and non-admin rejection. Staged: `e2e/specs/adminDashboard.spec.ts` | e2e | P1 | deferred | spec:flow#admin-dashboard |
| FLOW-TRIAL-PROVISIONING | Spec-only — no trial provisioning endpoint is implemented yet (depends on the Liferay Cloud integration). Staged: `integration/specs/trialProvisioning.spec.ts` | integration | P0 | deferred | spec:flow#trial-provisioning |
| FLOW-TRIAL-EXPIRY | Spec-only — no trial expiry endpoint is implemented yet (depends on the Liferay Cloud integration). Staged: `integration/specs/trialProvisioning.spec.ts` | integration | P1 | deferred | spec:flow#trial-expiry |

## Surface coverage matrix

Proof that the journeys above collectively exercise every unit-tested surface in
action. This table is informational — `check-plan` does not parse it (it is not
a six-column plan table). "Status" is the real-test status, not the unit-test
status; every surface here already has unit coverage in its per-surface file.

| Unit-tested surface | Exercised in action by | Real-test status | Blocker to run locally |
| --- | --- | --- | --- |
| `/ready` | `REST-GET-READY` (`springBootReady.spec.ts`) | ✅ covered | none |
| Every protected endpoint — unauthenticated 401 | `AUTH-UNAUTHENTICATED` | ✅ covered | none |
| Every protected endpoint — scoped 403 / 200 | `AUTH-OAUTH2-SCOPES` + the per-journey rows | ⊘ deferred | `/o/one/v1` proxy + scoped OAuth2 token |
| Gated page groups mount + gate | `FLOW-RESTRICTED-PAGE` | ✅ covered | none |
| `ROUTE-ADMIN-*` | `FLOW-ADMIN-DASHBOARD` | ⊘ deferred | entitled staff user |
| `ROUTE-MY-ACCOUNT-*` | `FLOW-MY-ACCOUNT-OVERVIEW`, `FLOW-ACCOUNT-TEAM-MEMBERS` | ⊘ deferred | entitled member + member data |
| `ROUTE-PRODUCT-PURCHASE-*` (+ AccountSelector) | `FLOW-PRODUCT-PURCHASE-ENTRY`, `FLOW-CHECKOUT-FREE`, `FLOW-CHECKOUT-PAID` | ⊘ deferred | entitled user + commerce/payment stub |
| `ROUTE-PUBLISHER-DASHBOARD-*` | `FLOW-PUBLISHER-ONBOARDING` | ⊘ deferred | entitled publisher + GCS stub |
| `ROUTE-ATTACHMENTS-*` | `FLOW-TICKET-UPLOAD`, `FLOW-TICKET-DOWNLOAD` | ⊘ deferred | Jira + GCS stubs |
| `ROUTE-BUSINESS-EVENTS-*` | `FLOW-BUSINESS-EVENT-LIFECYCLE` | ⊘ deferred | Jira stub |
| Jira business-events CRUD, versions, field options, object-key | `FLOW-BUSINESS-EVENT-LIFECYCLE` | ⊘ deferred | Jira stub |
| Jira tickets list | `FLOW-TICKET-UPLOAD`, `FLOW-TICKET-DOWNLOAD` | ⊘ deferred | Jira stub |
| Jira product-versions (business-event asset field) | `FLOW-BUSINESS-EVENT-LIFECYCLE` | ⊘ deferred | Jira stub |
| Entitlement generation + commerce-order-item object action | `FLOW-ENTITLEMENT-GENERATION`, `FLOW-CHECKOUT-FREE` | ⊘ deferred | seeded commerce order items |
| Ticket-attachment initiate/complete upload | `FLOW-TICKET-UPLOAD` | ⊘ deferred | Jira + GCS stubs |
| Ticket-attachment download (by-id, by-ERC) + access checks | `FLOW-TICKET-DOWNLOAD` | ⊘ deferred | GCS + Jira stubs |
| `CRON-SCHEDULEDSENDEXPIRINGLICENSEKEYEMAILS` | `FLOW-LICENSE-EXPIRATION-EMAIL` | ⊘ deferred | seeded subscription/license data |
| `CRON-SCHEDULEDCLEANUP`, `CRON-SCHEDULEDDELETETICKETATTACHMENT` | `FLOW-TICKET-ATTACHMENT-RETENTION` | ⊘ deferred | Jira + GCS stubs |
| `CRON-SCHEDULEDUPDATETICKETATTACHMENTDRAFTCOMMENTBODY` | `FLOW-TICKET-UPLOAD` (retry fallback) | ⊘ deferred | Jira stub |
| `SUB-SALESFORCEOBJECTPUBSUBSUBSCRIBER` | `FLOW-SALESFORCE-ORDER-SYNC` | ⊘ deferred | Pub/Sub broker + Salesforce message stub |
| `CRON-SCHEDULEDASSETOBJECTSCACHEEVICTION` | — (internal Spring cache evict; no user journey) | ⚠ unit-only | n/a — not a user journey |
| `object/action/user/delete` (subscription cleanup cascade) | — (internal object action; no user journey) | ⚠ unit-only | n/a — not a user journey |

Two surfaces have no in-action journey by design — a Spring cache eviction and an
internal user-delete cascade are pure mechanics with no user-facing flow, so unit
coverage is sufficient. Everything else is exercised by a journey above and is
unblocked by the same environment work: a provisioning fixture that grants the
test user the gating entitlement/role, an OAuth2 app for scoped tokens behind a
local `/o/one/v1` proxy, and external-system stubs (Jira, GCS, Salesforce
Pub/Sub) or seeded commerce data.
