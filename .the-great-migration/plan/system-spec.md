# Consolidated Customer Platform — Proposed System Spec

This document proposes the shape of the new workspace that replaces Koroneiki, Provisioning, Marketplace, and Support with one Liferay Objects–based system. It is a **design proposal**, not an implementation plan. Every contested decision is in a call-out box — **these are best-judgment defaults, open for review**; flag the ones you want to discuss.

Read the `../audit/` docs first if you haven't — this spec assumes them as context.

---

## 1. Goals & Non-Goals

**Goals**
- Single Liferay workspace, one deployable unit, one source of truth per concept (Account, Contact, Subscription, etc.).
- Data model expressed as Liferay Objects so business users can extend fields without a release.
- Business logic in Object Actions, Validations, and Scheduled Tasks — not in standalone OSGi modules with their own data stores.
- Preserve the external contracts that live outside the four systems (Jira, Salesforce, GCS, Liferay Cloud, Analytics Cloud, Marketo, email, Slack).

**Non-goals**
- Re-architecting Jira ticketing, Liferay Commerce checkout, or Liferay Cloud provisioning.
- Migrating the 17M-row Koroneiki `AuditEntry` log (archive it).
- Building a new identity system — use Liferay Users.
- Keeping Zendesk, Dossiera, osb-entity-web, or RabbitMQ as internal infrastructure.

**Constraints**
- Must run on standard Liferay SaaS patterns (client extensions + site initializers + Objects + headless).
- Must support a phased cut-over — legacy systems run in parallel during migration.
- License-key generation cannot regress in correctness or throughput (230K active keys).

---

## 2. Design Decisions (open for review)

Each decision below changes the shape of the spec materially. If any of these is wrong, sections 3–9 need adjustment.

> **D1 — Account = Liferay `AccountEntry` + custom fields.** Do **not** introduce a separate `Account` Object.
>
> **Why:** `AccountEntry` already exists in Liferay, already used by Marketplace and Support, supports parent-child hierarchy, has membership semantics, and is referenced by Commerce. Introducing a parallel `Account` Object forks the model.
>
> **Added custom fields:** `koroneikiAccountCode` (unique, uppercased), `region`, `tier`, `status`, `internal`, `profileEmailAddress`, `salesforceId`. The `parentAccountEntryId` already exists on `AccountEntry`.
>
> **Alternative rejected:** standalone Koroneiki-style `Account` Object. Cleaner data model on paper; doubled work in practice because every Commerce/Support integration already expects `AccountEntry`.

> **D2 — Contact = Liferay `User` + account membership.** Do **not** introduce a separate `Contact` Object.
>
> **Why:** Koroneiki's Contact was a lazy mirror of osb-entity-web Users anyway (`Contact.uuid == User.uuid`). Collapsing to `User` drops the mirror and the osb-entity-web bridge. Account membership already expresses "this person belongs to that account."
>
> **Role typing** (`ACCOUNT_CUSTOMER` vs `ACCOUNT_WORKER`) becomes a User custom attribute or a pair of Liferay Roles. Team membership uses Liferay `UserGroup` or a dedicated `Team` Object depending on whether team-level roles are still needed — see D3.
>
> **Alternative rejected:** keep a Contact Object for the 20K Koroneiki Contacts. Forces a permanent User↔Contact sync layer, which is what we're trying to eliminate.

> **D3 — Team as a lightweight Object; TeamRole dropped.** Today Koroneiki has Team + TeamRole + TeamAccountRole, but `TeamAccountRole` has only 39 rows and `TeamRole` has 2 rows — the team-level role model is effectively unused.
>
> **Why:** Port `Team` (18,570 rows, actively used) as an Object with account relationship and user membership. Drop `TeamRole` / `TeamAccountRole`. The auto-synced "default team per account" logic ports over as an Object Action on AccountEntry save.
>
> **Alternative rejected:** full team-role port. Low ROI given the data.

> **D4 — One `Subscription` Object unifies Koroneiki `ProductPurchase`, Support `AccountSubscription`, and Marketplace's order-custom-fields for trials.**
>
> **Why:** Today there are three separate representations of "this account has this product from X to Y." Consolidation is the whole point. One Subscription Object with lifecycle states `Draft → Trial → Active → Expired | Cancelled`, plus a `SubscriptionLineItem` child Object for per-product line detail (replaces `ProductConsumption`, `AccountSubscriptionTerm`).
>
> **`SubscriptionGroup`** (renewal grouping) becomes a field + self-relationship, not a separate Object (Support's `AccountSubscriptionGroup` has 3K rows vs 4.5K subscriptions; the grouping is essentially 1:1.5 and doesn't justify its own Object).
>
> **Alternative rejected:** keep ProductPurchase, AccountSubscription, and CommerceOrder-with-custom-fields as three Objects with a view layer. Preserves today's shape; perpetuates the problem.

> **D5 — Entitlements = Object filter criteria for simple rules, Scheduled Task for complex ones.**
>
> **Why:** Koroneiki's 62 `EntitlementDefinition.definition` rows are raw SQL. Most of them probably resolve to "Account has an Active Subscription for product X" or "Contact belongs to an Account with flag Y" — expressible as Liferay Object filter criteria on a relationship. The remainder (time-windowed, multi-join, aggregate-based) need a scheduled task that grants/revokes like Koroneiki does today.
>
> **Process:** extract all 62 live rules, classify each as (a) Object filter, (b) scripted Object Action, (c) scheduled task. Only (c) needs custom code. This cannot be fully designed without the rule review.
>
> **Alternative rejected:** full scheduled-task port of Koroneiki's SQL-grant-revoke loop. Keeps the abstraction that lets anyone write arbitrary SQL, which is exactly the maintenance risk we want to retire.

> **D6 — Tickets stay in Jira; workspace holds a thin `SupportTicket` Object that references Jira.**
>
> **Why:** Jira is the agent tool of record; absorbing ticket state into Liferay is a re-architecture of the wrong system. The existing Support workspace already treats Jira as authoritative. Port that pattern. Zendesk retired entirely.
>
> **Fields on SupportTicket:** `accountEntryId`, `jiraIssueKey`, `subject`, `status` (cached from Jira), `priority` (cached), `lastSyncedAt`. Attachments stay as a separate `TicketAttachment` Object backed by GCS as today.
>
> **Alternative rejected:** model full ticket state in Liferay. Huge scope, no user win.

> **D7 — Liferay Commerce remains for Marketplace checkout; `Order` is a Commerce construct, not an Object.**
>
> **Why:** Commerce already handles storefront, cart, payment, tax. Marketplace's "custom fields on CommerceOrder" pattern (`trial-end-date`, `cloud-provisioning` JSON blobs) becomes a proper `TrialProvisioning` Object with a relationship to the Commerce order — solves the schemaless-JSON problem without replacing Commerce.
>
> **Alternative rejected:** replace Commerce with an `Order` Object. Massive scope, re-implements tax and payment.

> **D8 — `LicenseKey` as an Object; migrate the 230K rows from `Provisioning_LicenseKey`.**
>
> **Why:** Licenses are central to the business. An Object gives them a stable REST surface, validation, and audit. Generation becomes an Object Action triggered on Subscription state change.
>
> **Fields:** `subscriptionId`, `key` (indexed unique), `productVersion`, `startDate`, `endDate`, `maxServers`, `maxDevelopers`, `status`. The ownership question from the audit (where does the 230K-row module live today?) must be answered during phase 2 — it informs the migration extract.
>
> **Alternative rejected:** leave keys in Provisioning's DB and call out. Perpetuates the ambiguity and leaves the consolidated workspace without a license primitive.

> **D9 — One workspace, multiple site-initializers.** Marketplace and Support remain separate public sites; internal admin is a third site.
>
> **Why:** Single deployable unit is the simplification; distinct audiences (shoppers, support-seeking customers, internal ops) still want distinct sites with distinct branding and navigation. Three site-initializers in one workspace is standard Liferay SaaS.
>
> **Alternative rejected:** one site with route-based splits. Muddies IA and permissions.

> **D10 — Headless-first APIs; custom REST only for orchestration (`etc-spring-boot`).**
>
> **Why:** Objects get `/o/c/{objectName}` auto-generated REST + GraphQL for free. Custom Spring Boot endpoints are reserved for workflows that aren't CRUD: trial provisioning, license generation, GCS upload orchestration, Jira sync, Salesforce webhook.
>
> **Alternative rejected:** custom REST for everything (Koroneiki-Phloem style). Rebuilds what Liferay gives you.

> **D11 — No internal message bus. Outbound webhooks/Pub-Sub only where external subscribers still need them.**
>
> **Why:** Today's RabbitMQ fan-out exists because Provisioning/Marketplace/Support live in different deployments. With one workspace, Object Actions fire synchronously (or via Liferay's internal message bus for async) in-process.
>
> **Outbound retained:** Salesforce-bound events, LCS sync (if LCS survives), any Liferay Cloud integration. Evaluate per-consumer during phase 5.
>
> **Alternative rejected:** preserve RabbitMQ topics verbatim for "compatibility." Carries a dead integration forward.

> **D12 — Salesforce integration replaces Dossiera with a direct webhook + Salesforce sync.**
>
> **Why:** Dossiera is a legacy relay. The new workspace owns account creation on Salesforce `Closed Won` via either an outbound-message + webhook endpoint or a polling sync, written once in `etc-spring-boot`.
>
> **Alternative rejected:** keep Dossiera. Keeps a third-party relay for no new reason.

> **D13 — Service-to-service auth = OAuth2 client credentials. Retire Koroneiki's `ServiceProducer` impersonation pattern.**
>
> **Why:** Standard Liferay SaaS pattern, scoped via OAuth2 scopes, auditable via OAuth2 authorization entries. The impersonation pattern obscures who really did what in the audit trail.
>
> **Alternative rejected:** port ServiceProducer + AuthenticationToken as Objects. Reproduces a pattern Liferay already solves.

> **D14 — Archive Koroneiki `AuditEntry` (17M rows); use Liferay Object built-in audit going forward.**
>
> **Why:** Liferay Objects have versioning and a native audit model. The 17M legacy rows are historical — export them to a flat file, archive, move on.
>
> **Alternative rejected:** migrate into a custom `LegacyAuditEntry` Object. Overwhelms the new workspace's audit from day 1.

---

## 3. Proposed Object Model

Organized by domain. Every Object is company-scoped unless noted. "+AE" means extends/relates to Liferay `AccountEntry`; "+U" means relates to Liferay `User`.

### 3.1 Customer domain

| Object | Purpose | Key fields | Relationships |
|---|---|---|---|
| `AccountEntry` (Liferay core, extended) | Customer organization | + `koroneikiAccountCode` (unique), `region`, `tier`, `status`, `internal`, `profileEmailAddress`, `salesforceId`, `dossieraId` (migration-only) | Hierarchy via `parentAccountEntryId`; users via membership |
| `AccountFlag` | Boolean/enum flags on an account (compliance, entitlement tags) | `flagCode`, `flagValue`, `accountEntryId` | → AccountEntry |
| `AccountNote` | Rich notes, creator frozen at write-time | `content`, `format`, `type`, `priority`, `status`, frozen `creatorName`/`creatorUID`/`modifierName`/`modifierUID` | → AccountEntry |
| `Team` | Grouping of users on an account | `name`, `system` (flag), `accountEntryId` | → AccountEntry, →→ Users |
| `ExternalReference` | Generic link to external system record (replaces Koroneiki `ExternalLink`) | `domain` (enum: salesforce/dossiera/lcs/jira/stripe/gcs/custom), `entityName`, `entityId`, `ownerClassName`, `ownerClassPK` | Polymorphic |

### 3.2 Product & subscription domain

| Object | Purpose | Key fields | Relationships |
|---|---|---|---|
| `Product` | Catalog item (master). Separate from Commerce `CPDefinition` which is priced-storefront item | `name` (unique), `productKey`, `status`, `properties` (JSON, deprecated — migrate to fields) | ← SubscriptionLineItem |
| `Subscription` | What an account has bought. Replaces Koroneiki ProductPurchase + Support AccountSubscription | `accountEntryId`, `productId`, `status` (Draft/Trial/Active/Expired/Cancelled), `startDate`, `endDate`, `originalEndDate`, `quantity`, `renewalGroupKey`, `instanceSize` | → AccountEntry, → Product, ← SubscriptionLineItem, ← LicenseKey |
| `SubscriptionLineItem` | Individual fulfillment (one env, one activation). Replaces ProductConsumption + AccountSubscriptionTerm | `subscriptionId`, `productId`, `startDate`, `endDate`, `quantity`, `environment`, `sizing` | → Subscription |
| `LicenseKey` | Generated license. New Object; migrate 230K from `Provisioning_LicenseKey` | `key` (unique indexed), `subscriptionId`, `productVersion`, `startDate`, `endDate`, `maxServers`, `maxDevelopers`, `status` | → Subscription |

### 3.3 Entitlement domain

| Object | Purpose | Key fields | Relationships |
|---|---|---|---|
| `EntitlementDefinition` | Rule describing who gets what entitlement | `name`, `targetClassName` (Account/User), `ruleType` (filter/action/scheduled), `ruleBody` (criteria JSON / scripted action), `status` | ← Entitlement |
| `Entitlement` | Materialized row — this account/user currently has this entitlement | `entitlementDefinitionId`, `targetClassName`, `targetClassPK`, `grantedAt` | → EntitlementDefinition, polymorphic to AccountEntry or User |

### 3.4 Marketplace domain

| Object | Purpose | Key fields | Relationships |
|---|---|---|---|
| `Publisher` | App publisher profile. Merges Koroneiki `PublisherDetails` | `publisherName`, `emailAddress`, `description`, `logo`, `accountEntryId`, `commerceCatalogId` | → AccountEntry |
| `PublisherAsset` | App/release asset version | `publisherId`, `version` | → Publisher, ← PublisherAssetAttachment |
| `PublisherAssetAttachment` | Uploaded code artifact (zip/war/jar, up to 200MB) | `sourceCode` (Attachment), `name`, `processed` | → PublisherAsset |
| `PublisherSalesSummary` | Quarterly sales rollup | `publisherId`, `quarter`, `amount`, `paidBy`, `paidDate` | → Publisher |
| `TrialProvisioning` | Replaces Marketplace's JSON-blob custom fields on CommerceOrder | `commerceOrderId`, `trialEndDate`, `notifiedAt`, `cloudProvisioning` (JSON → fields), `koroneikiProjectIds` | ↔ CommerceOrder (ref) |
| `RequestPublisherAccount` | Prospective publisher onboarding | `firstName`, `lastName`, `emailAddress`, `phoneNumber`, `requestDescription`, `status` | |

### 3.5 Support domain

| Object | Purpose | Key fields | Relationships |
|---|---|---|---|
| `SupportTicket` | Thin wrapper around Jira issue | `accountEntryId`, `jiraIssueKey`, `jiraProject`, `subject`, `statusCached`, `priorityCached`, `lastSyncedAt` | → AccountEntry |
| `TicketAttachment` | GCS-backed large file attached to a ticket | `accountEntryId`, `supportTicketId`, `fileName`, `fileSize`, `gcsBucket`, `gcsObject`, `md5Checksum`, `state` (Draft/Approved), `draftCommentBody`, `storageProvider` | → SupportTicket |
| `SupportTicketEscalation` | Customer-initiated escalation form | `ticketIds`, `description`, `customerEmail`, `phoneNumber` | |
| `CallbackRequest` | Customer phone-back request | `name`, `emailAddress`, `phoneNumber`, `countryCode`, `description`, `relatedTicketIds` | |
| `ReplacementActivationKeyRequest` | Self-service key replacement | `companyName`, `contactEmail`, `clustered`, `reason`, `acknowledgement`, `status` | |
| `BusinessEvent` | Customer implementation milestone tracking | `accountEntryId`, `eventStatus`, `description`, `expectedGoLiveDateTime`, `actualGoLiveDateTime`, + 20 domain fields | → AccountEntry, ← BusinessEventVersion |
| `BusinessEventVersion` | Immutable history entry for BusinessEvent changes | `businessEventId`, `change`, `comment`, `changedAt` | → BusinessEvent |

### 3.6 Reference / admin domain

| Object | Purpose |
|---|---|
| `Region` | Geo region reference (replaces hard-coded support-region map) |
| `DataCenter` | DXP/Analytics/LXC data-center reference (merges DXPCDataCenterRegion + AnalyticsCloudDataCenterLocation) |
| `BannedEmailDomain` | Form submission blocklist |

### 3.7 What gets dropped

- Koroneiki `ServiceProducer`, `AuthenticationToken` — replaced by OAuth2 client credentials (D13).
- Koroneiki `AuditEntry` — replaced by Liferay Object versioning (D14).
- Koroneiki `ProductField` (260K rows of dynamic properties) — values migrate to structured fields on `Product`/`Subscription`/`LicenseKey` after extracting the distinct field-name set.
- Support `KoroneikiAccount` side-car — dissolved; fields merge into AccountEntry extensions.
- Support `AccountSubscriptionGroup`, `AccountSubscriptionTerm` — collapse into Subscription + SubscriptionLineItem.
- Marketplace `Sample`, `Test2`, `LicenseTypesDescription`, `UserAdditionalInfo` — unused / scratch.
- Marketplace `GetAppInformation` (496 rows) — appears to be a UI cache; evaluate in phase 4.
- Zendesk references (`zendeskTicketId`) — archive, drop.
- All `OSB_*` legacy tables in `prov` — archive if historical value; delete otherwise.
- `Marketplace_App` / `Marketplace_Module` (old Marketplace) — separate from new workspace; confirm retirement.

### 3.8 High-level ER

```mermaid
erDiagram
    AccountEntry ||--o{ AccountFlag : has
    AccountEntry ||--o{ AccountNote : has
    AccountEntry ||--o{ Team : hosts
    AccountEntry ||--o{ Subscription : holds
    AccountEntry ||--o{ SupportTicket : raises
    AccountEntry ||--o{ BusinessEvent : tracks
    AccountEntry }o--o{ User : "membership"
    Team }o--o{ User : "members"

    Subscription ||--o{ SubscriptionLineItem : contains
    Subscription ||--o{ LicenseKey : "issues"
    Subscription }o--|| Product : "for"

    EntitlementDefinition ||--o{ Entitlement : "materializes"
    Entitlement }o--|| AccountEntry : "grants (or User)"

    SupportTicket ||--o{ TicketAttachment : has
    BusinessEvent ||--o{ BusinessEventVersion : history

    Publisher }o--|| AccountEntry : "owned by"
    Publisher ||--o{ PublisherAsset : publishes
    PublisherAsset ||--o{ PublisherAssetAttachment : contains
    Publisher ||--o{ PublisherSalesSummary : earns

    ExternalReference }o--|| AccountEntry : "polymorphic ref"
```

---

## 4. Business Logic

### 4.1 Object Actions (replace RabbitMQ subscribers and portlet logic)

| Trigger | Action | Replaces |
|---|---|---|
| `AccountEntry.onAfterAdd/Update` | Sync default Team; generate `koroneikiAccountCode` if missing; ensure `ExternalReference` for salesforce/dossiera | Koroneiki `TeamLocalService.syncDefaultTeam`; DossieraCreateMessageSubscriber steps 4–5 |
| `Subscription.onAfterAdd` | Generate LicenseKey; notify account owner; create ExternalReference to LCS | Provisioning LCS sync; Marketplace post-purchase object action |
| `Subscription.onAfterUpdate` | Re-sync entitlements; push LCS; notify if state changed to Expired | Provisioning ProductPurchaseMessageSubscriber |
| `Subscription.onAfterDelete` | Revoke LicenseKeys; revoke Entitlements | (not currently implemented — fix orphan bug) |
| `SupportTicket.onAfterAdd` | Create Jira issue via REST; stash `jiraIssueKey` | Support manual escalation flow |
| `TicketAttachment.onAfterAdd (state=Approved)` | Post Jira comment (ADF) with download link; retry via `draftCommentBody` on failure | Support `complete-upload` flow |
| `BusinessEvent.onAfterUpdate` | Write BusinessEventVersion; update Jira heat tags; email if overdue | Support `ObjectActionBusinessEventRestController` |
| `Publisher.onAfterAdd` | Create Commerce catalog; send approval workflow | Marketplace product-approver-workflow |
| `PublisherAsset.onAfterAdd` | Object-action email dispatch (MARKETPLACE-PRODUCT-SUBMIT-TEMPLATE) | Marketplace `object-action-email-dispatch` |

### 4.2 Scheduled Tasks

| Name | Frequency | Purpose | Replaces |
|---|---|---|---|
| `EntitlementSync` | every 15 min | Grant/revoke Entitlements per EntitlementDefinition rules | Koroneiki `SynchronizeEntitlementsMessageListener` |
| `TrialLifecycleTick` | every 6 h | Expire in-progress trials; promote on-hold trials; auto-complete free pending orders; send trial-end notifications | Marketplace `_processInProgressTrials`, `_processOnHoldTrials`, `_processPendingOrders` |
| `PublisherSalesSummaryRoll` | nightly | Aggregate completed orders into `PublisherSalesSummary` by quarter | Marketplace `_processPublisherSalesSummary` |
| `RequestProductFeedbackFan` | every 6 h | Email feedback surveys to customers with orders 7–14 days old | Marketplace `_processRequestProductFeedback` |
| `TicketAttachmentCleanup` | twice daily (00:00, 12:00) | Purge attachments 7–8 days after Jira ticket close | Support `scheduledCleanUp` |
| `TicketAttachmentTrashDrain` | hourly | Delete trashed attachments from GCS | Support `scheduledDeleteTicketAttachment` |
| `TicketAttachmentDraftCommentRetry` | hourly | Retry Jira comment posting for attachments with unsent comments | Support `scheduledUpdateTicketAttachmentDraftCommentBody` |
| `BusinessEventOverdueSweep` | daily | Mark open events with past target dates as overdue; notify | Support `BusinessEventService.scheduled` |
| `JiraHeatTagSync` | daily | Push `impacting_business_event` / `<heat>_be` labels onto JSM tickets; update Jira Assets Koroneiki object | Support `AccountsRestController.scheduledHeatTagUpdate` |
| `LiferayStaffUserGroupSync` | daily | Assign "Liferay Staff" role and SSA-ACCOUNT membership to employees | Marketplace `_processLiferayStaffUserGroups` |
| `ProjectsUsingMarketplaceReport` | nightly | Aggregate marketplace order data + Koroneiki project lookups into `Report` entry | Marketplace `_processProjectsUsingMarketplaceApps` |

### 4.3 Validations

- `AccountEntry.koroneikiAccountCode` — unique (case-insensitive); auto-increment suffix on collision.
- `AccountEntry.parentAccountEntryId` — cannot equal self; cannot create cycle.
- `Subscription.endDate >= Subscription.startDate`; `originalEndDate` defaults to `endDate`.
- `Subscription.quantity > 0`.
- `LicenseKey.key` — unique.
- `TicketAttachment` — MD5 dedup (same `fileName + ticketId + md5Checksum` rejected unless state=Draft).
- Form submissions (CallbackRequest, RequestPublisherAccount, etc.) — `BannedEmailDomain` check on email field.

### 4.4 Workflow Definitions (Kaleo)

- `product-approver-workflow` — ported from Marketplace, 3-state (Pending/Under Review/Approved|Rejected).
- `publisher-onboarding-workflow` — new, for RequestPublisherAccount approval.
- `support-ticket-escalation-review` — new, for SupportTicketEscalation triage.

---

## 5. API Surface

### 5.1 Headless (auto-generated)

Every Object exposes `/o/c/{objectName}` REST + `/o/graphql` with CRUD, filter, expand. Scopes via OAuth2.

### 5.2 Custom REST (`etc-spring-boot`)

| Path | Purpose | Replaces |
|---|---|---|
| `POST /webhooks/salesforce/opportunity` | Salesforce-closed-won webhook; creates AccountEntry + Subscription | Dossiera `dossiera.provisioning.create` |
| `POST /trial/provision/{subscriptionId}` | Provision trial instance in Liferay Cloud | Marketplace `POST /trial/provisioning` |
| `POST /trial/expire/{subscriptionId}` | Decommission trial | Marketplace `POST /trial/expire` |
| `POST /trial/notify-end/{subscriptionId}` | Send trial-end email | Marketplace `POST /trial/notify-end` |
| `GET /trial/availability` | Seat availability check | Marketplace `GET /trial/availability` |
| `POST /license-key/generate/{subscriptionId}` | Generate LicenseKey row | new |
| `POST /license-key/{id}/revoke` | Revoke | new |
| `GET /license-key/{id}/download` | Key artifact download | new |
| `POST /ticket-attachments/initiate-upload` | GCS resumable upload session | Support |
| `POST /ticket-attachments/{id}/complete-upload` | Finalize + Jira comment | Support |
| `GET /ticket-attachments/by-id/{id}/download` | Signed download URL | Support |
| `DELETE /ticket-attachments/{id}` | Trash + GCS delete | Support |
| `GET /jira/issue/{issueKey}` | Live Jira query (cached) | Support |
| `DELETE /jira/cache` | Admin cache clear | Support |
| `GET /jira/security-vulnerabilities/{*}` | Security project read endpoints | Support |
| `POST /console/provisioning/{subscriptionId}` | Deploy DXP instance | Marketplace |
| `GET /console/subscriptions/{subscriptionId}` | Status | Marketplace |
| `POST /analytics/provision/{subscriptionId}` | Faro workspace provisioning | Marketplace |
| `POST /entitlements/recompute` | Admin-trigger full EntitlementSync | Koroneiki `POST /entitlement-definitions/{id}/synchronize` |
| `GET /ready` | Liveness probe | both |

### 5.3 Retired APIs

- Koroneiki Phloem REST (`/o/koroneiki-rest/*`) — downstream callers migrate to the new Objects headless + custom endpoints above.
- Provisioning portlet-only (no REST existed) — admin UI replaces portlets.

### 5.4 Auth

OAuth2 client credentials for all service-to-service. Scopes: `customer.read`, `customer.write`, `subscription.write`, `license.admin`, `ticket.write`, etc. Define one OAuth2 application per calling system (Marketplace storefront, Support portal, Salesforce webhook, Jira webhook, Console integration).

Retire: Koroneiki ServiceProducer + AuthenticationToken impersonation.

---

## 6. UI / Site Initializers

Three site-initializers in the workspace, each shipping a React custom element + fragments + layouts.

### 6.1 `marketplace-site-initializer`

Public storefront. Port from `liferay-marketplace-workspace/`. 13 top-level pages, 3 fragment groups, 2 display-page templates, Kaleo `product-approver-workflow`. React custom element (≈349 TSX files). Marketo forms 3738 / 6253.

### 6.2 `support-site-initializer`

Customer-facing support portal. Port from `liferay-customer-workspace/`. 11 top-level pages (home, projects, project, onboarding, security-vulnerabilities, release-notes, callback-request, support-ticket-escalation, large-file-uploader, cookie-policy). Feature-flagged `-testing` variant retained for LRSD-6322 / LRSD-12003 rollouts.

### 6.3 `admin-site-initializer`

New internal admin UI. Replaces Koroneiki admin portlets + Provisioning portlets. React custom element. Pages: Accounts, Contacts, Teams, Subscriptions, Products, Entitlements, Entitlement Definitions, License Keys, Publishers, Business Events, Reports, Debug (replaces `DebugRabbitMQMVCActionCommand`).

### 6.4 `instance-settings`

Global Liferay instance config (port banned-email-domain list, notification templates, OAuth2 apps, role definitions).

---

## 7. Integration Boundaries

### 7.1 External (retained)

| System | Direction | Purpose |
|---|---|---|
| **Salesforce** | Inbound (webhook) | Closed-won opportunity → create AccountEntry + Subscription |
| **Salesforce** | Outbound (via GCF) | Opportunity write-back on paid order (from Marketplace pattern) |
| **Jira / JSM** | Outbound | SupportTicket create, comment, attachment link, heat-tag labels, security vulnerabilities read, Jira Assets Koroneiki schema |
| **Google Cloud Storage** | Outbound | Large file attachments (signed URLs, resumable uploads) |
| **Liferay Cloud** | Outbound | Trial portal-instance lifecycle |
| **Console (DXP instance mgmt)** | Bidirectional | Deploy / uninstall apps, usage queries |
| **Analytics Cloud / Faro** | Outbound | Workspace provisioning |
| **Marketo** | Outbound (client-side) | Marketing form submissions |
| **Email / SMTP** | Outbound | Notifications |
| **Slack** | Outbound | Callback alert email bridge |
| **LCS** | Outbound (TBD) | Subscription sync — retain only if LCS survives |

### 7.2 Retired

- Zendesk (replace with Jira for Provisioning's error tickets; `zendeskTicketId` field archived with old TicketAttachment rows)
- Dossiera (direct Salesforce webhook replaces it)
- osb-entity-web (Liferay Users are the master)
- RabbitMQ (internal). Evaluate Xylem broker outbound for any external subscriber still live.
- Google Pub/Sub (internal). Replaced by Object Actions.
- Koroneiki Phloem REST (downstream callers migrate)

---

## 8. Workspace Structure

```
liferay-consolidated-workspace/
├── client-extensions/
│   ├── consolidated-admin-custom-element/       # React — internal admin UI
│   ├── consolidated-admin-site-initializer/     # admin site, Object definitions, roles, notification templates
│   ├── consolidated-etc-cron/                   # all scheduled tasks (§4.2)
│   ├── consolidated-etc-spring-boot/            # custom REST (§5.2), GCS/Jira/Salesforce clients
│   ├── consolidated-global-css/                 # shared branding
│   ├── consolidated-instance-settings/          # global config
│   ├── marketplace-custom-element/              # React — ported
│   ├── marketplace-site-initializer/            # Marketplace public site — ported
│   ├── support-custom-element/                  # React — ported
│   └── support-site-initializer/                # Support portal — ported
├── configs/
│   └── local/
├── gradle/
├── gradle.properties
├── gradlew
├── gradlew.bat
├── package.json
├── settings.gradle
└── yarn.lock
```

**One** `etc-spring-boot` application serves the custom REST surface for all three sites. **One** `etc-cron` application runs all scheduled tasks. Separation by site-initializer; shared by backend.

---

## 9. Migration Strategy

Six phases. Legacy systems keep running; cut-over is per-capability, not big-bang.

### Phase 0 — Audit (done)

Per `../audit/`.

### Phase 1 — Workspace shell + Object definitions

- Stand up empty `liferay-consolidated-workspace`.
- Define all Objects (sections 3.1–3.6) with fields, relationships, validations.
- Define OAuth2 applications and scopes.
- Deploy admin site-initializer skeleton (empty pages).
- No data yet. Goal: definitions reviewable by product + engineering.

### Phase 2 — Koroneiki migration (biggest lift)

- Extract from `kor`: Account → AccountEntry + fields; Contact → User reconcile; Team → Team Object; ProductEntry → Product; ProductPurchase → Subscription; ProductConsumption → SubscriptionLineItem; ProductField → distinct field extraction + schematized fields; ExternalLink → ExternalReference; AccountNote → AccountNote.
- Transform: account-code uniqueness (resolve existing collisions); contact-user reconcile via UUID; ProductField → classified fields per owner type.
- Load via headless batch or direct DB import (Liferay Object `O_*` tables).
- Review and translate all **62 `EntitlementDefinition.definition` SQL rules** (see §2 D5). Migrate ruleBody per-rule.
- Preserve original keys (`accountKey`, `contactUuid`, etc.) as custom fields for bidirectional lookup during cut-over.
- Archive `Koroneiki_AuditEntry` to flat file.

### Phase 3 — Provisioning / LicenseKey migration

- **Resolve ownership question first**: locate the code that creates `Provisioning_LicenseKey` rows today (230K rows). See audit `provisioning.md §6`.
- Extract license key tables → LicenseKey Object with Subscription linkage.
- Port DossieraCreateMessageSubscriber logic into AccountEntry.onAfterAdd + Salesforce webhook endpoint.
- Port LCS sync as outbound Object Action (or retire if LCS retires).
- Port Zendesk ticket creation to Jira.
- Retire osb-provisioning deploy.

### Phase 4 — Marketplace migration

- Port deployed Objects (12 Objects, ≤500 rows each — easy).
- Port Kaleo `product-approver-workflow`.
- Port 7 cron jobs into `consolidated-etc-cron`.
- Port 10 Spring Boot controllers into `consolidated-etc-spring-boot`.
- Port React custom element into `marketplace-custom-element`.
- Port site-initializer (fragments, pages, layouts) into `marketplace-site-initializer`.
- Migrate `CommerceOrder` custom-field JSON blobs into `TrialProvisioning` Object.
- Switch Google Pub/Sub listeners to Object Actions (Pub/Sub bridge becomes dead).

### Phase 5 — Support migration

- Port deployed Objects (26 → ~18 after consolidation with D4).
- Port 5 scheduled tasks into `consolidated-etc-cron`.
- Port Spring Boot controllers (Jira, GCS, ticket attachments) into `consolidated-etc-spring-boot`.
- Port React custom element into `support-custom-element`.
- Port site-initializer into `support-site-initializer`.
- Dissolve `KoroneikiAccount` side-car (fields now on AccountEntry).
- Wire SupportTicket ↔ Jira bidirectionally (Jira webhook → status cache update).
- Retire `liferay-customer-workspace` deploy.

### Phase 6 — Decommission

- Stop RabbitMQ consumers; retire Koroneiki Xylem publishers.
- Decommission Dossiera.
- Drop Zendesk integration.
- Archive legacy DBs (`kor`, `prov`, `e5a2_lpartition_11706165`, `e5a2_lpartition_1860468`).
- Drop `OSB_*` and `Marketplace_App/Module` tables after retention period.

### Preservation constraints

- All existing `accountKey`, `contactUuid`, `productPurchaseKey`, `teamKey`, `productKey`, `jiraIssueKey`, `salesforceId`, license key strings — **must be preserved intact** for external-system lookups.
- Zendesk ticket references — archive with old TicketAttachment rows for historical auditability.
- Commerce order IDs — unchanged (Commerce layer preserved).

---

## 10. Open Risks / Questions

Follow up before starting phase 2. Numbered for reference in planning meetings.

1. **Entitlement rule translation** (D5). The 62 rules need individual review. Until then, phase-2 timeline is unbounded on the high end. Recommend: extract `EntitlementDefinition.definition` to a CSV, review with product + ops, classify per D5, then estimate.
2. **Provisioning license-key module ownership.** Audit found 230K rows in a module the audited source does not declare. Must locate the code before phase 3.
3. **LCS fate.** If LCS retires during consolidation, Provisioning's sync pipeline dies with it — and the `LicenseKey` Object must absorb the compliance data model. Confirm.
4. **Salesforce integration replacement.** Direct webhook vs polling sync vs Salesforce Connected App — pick one during phase 3 design.
5. **RabbitMQ → Pub/Sub bridge location.** Whatever relays `koroneiki.*` from on-prem RabbitMQ to Google Pub/Sub is outside the four audited codebases. Find and retire.
6. **Support `KoroneikiAccount` sync mechanism.** Unknown how today's 2,313 rows get populated. Find and retire.
7. **Commerce catalog ↔ Product Object.** Today Marketplace uses Commerce `CPDefinition` for priced-storefront items and Koroneiki `ProductEntry` (now Product Object) for licensed SKUs. They're loosely linked by name. Decide whether to unify or keep the name-match pattern.
8. **Team-role model.** D3 drops TeamRole / TeamAccountRole on the grounds of near-zero row counts. Verify with ops that these rows being unused is intended — they might be populated for a small but critical use case.
9. **Multi-tenancy strategy.** All audited Objects are company-scoped. Consolidated workspace likely uses a single Liferay company; confirm before picking a scope model.
10. **Historical data retention policy.** Audit logs (17M), old Marketplace tables, OSB_* tables — legal/compliance retention requirements should drive the archive-vs-delete call in phase 6.
11. **Cut-over readiness.** Each phase needs a "legacy off" gate: when is it safe to stop Koroneiki/Provisioning/Marketplace/Support writes? Design dual-write or read-replica patterns for phase 2–5.
12. **UI consolidation.** Marketplace and Support stay separate sites (D9) but share admin. Decide which branding/nav lives where for the admin site.
13. **OAuth2 migration for external callers.** Every system that calls Koroneiki Phloem today must get re-pointed. Inventory these callers before phase 2 concludes.
