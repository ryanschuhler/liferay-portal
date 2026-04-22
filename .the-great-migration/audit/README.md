# System Consolidation Audit

This directory contains a higher-level audit of four legacy Liferay business systems being consolidated into a new unified workspace built on Liferay Objects:

- **[Koroneiki](./koroneiki.md)** — customer/product/entitlement ERP (the system of record)
- **[Provisioning](./provisioning.md)** — Salesforce → Koroneiki orchestrator
- **[Marketplace](./marketplace.md)** — publisher/commerce storefront
- **[Support](./support.md)** — customer support portal (Jira-backed)
- **[Integrations](./integrations.md)** — how the four systems (and their external dependencies) talk to each other

The goal of the audit is to capture enough information about each system's **data model, business logic, and integration surface** to rebuild it as Liferay Objects in the consolidated workspace. It is intentionally high-level — exhaustive table-by-table data dictionaries are out of scope.

## Source locations

| System | Codebase | Database (MySQL on 127.0.0.1:3307) |
|---|---|---|
| Koroneiki | `/home/ry/repos/liferay-portal-ee/modules/dxp/apps/osb/osb-koroneiki/` | `kor` |
| Provisioning | `/home/ry/repos/liferay-portal-ee/modules/dxp/apps/osb/osb-provisioning/` | `prov` |
| Marketplace | `/home/ry/repos/liferay-portal/workspaces/liferay-marketplace-workspace/` | `e5a2_lpartition_11706165` |
| Support | `/home/ry/repos/liferay-portal/workspaces/liferay-customer-workspace/` | `e5a2_lpartition_1860468` |

## Scale at a glance

| Metric | Koroneiki | Provisioning | Marketplace | Support |
|---|---:|---:|---:|---:|
| Core entities / Objects | 19 | 2 local (+ proxies Koroneiki) | 12 live (4 defined-but-not-deployed) | 26 live |
| Largest table | AuditEntry (17.4M) | LicenseKey (230K) | GetAppInformation (496) | BannedEmailDomain (4.8K) |
| Accounts / customers | 18,390 | (via Koroneiki) | — | 2,313 (KoroneikiAccount mirror) |
| Total "business" rows | ~18.5M | ~512K | ~950 | ~16K |
| Scheduled tasks | 1 (entitlement sync, 15min) | 0 (event-driven only) | 7 (cron, every 6h) | 5 (cleanup, heat-tags, overdue events) |
| External integrations | osb-entity-web, RabbitMQ fan-out | Dossiera/SF, Koroneiki, Zendesk, LCS | Koroneiki, Salesforce, Stripe-absent, Console, Cloud, Analytics, Marketo, PayPal | Jira (3 projects), GCS, Koroneiki, Slack, email |

## How to read this audit

1. **Start with [integrations.md](./integrations.md)** for the big picture — who calls whom and which concepts overlap.
2. **Then per-system docs** for the data model, business logic, API surface, and migration notes.
3. Every per-system doc ends with **"Open Questions / Gotchas"** and **"Migration Notes"** — those are the pointed inputs for the planning phase.

## Known gaps in this audit

- **osb-provisioning has license-key tables in its DB that the audited source does not declare** (`Provisioning_LicenseKey`, `Provisioning_SubscriptionEntry`, `Provisioning_LicenseEntry`, `Provisioning_ProductVersion`, `Provisioning_CommonLicenseKey` — together ≈233K rows). These are likely owned by a sibling `osb-provisioning-license*` module not covered here, or by LCS. See [provisioning.md §6](./provisioning.md#6-row-counts).
- **The RabbitMQ → Google Pub/Sub bridge** that relays `koroneiki.*` topics from Koroneiki to Marketplace is not in any of the audited codebases. Confirm with infrastructure team.
- **Support's `KoroneikiAccount` sync mechanism** is external to the Support workspace. Unknown what runs it.
- **`EntitlementDefinition.definition`** — 62 raw-SQL rules are live in Koroneiki. None of them have been reviewed individually; this is a planning-phase task.
- **Consolidation team should re-verify** that `ContactSales`, `ProductFeedback`, `DXPFreeActivationKeyRequest`, `AIHubBetaPrivateAccessRequest` are still intended Marketplace Objects — they're in the site-initializer source but not deployed to the live DB.

## Next steps (suggested)

1. Resolve the three "Open Integration Questions" in [integrations.md §9](./integrations.md#9-open-integration-questions-for-the-planning-phase).
2. Extract and review all 62 `EntitlementDefinition.definition` rows to decide translation strategy (Object criteria vs scripted action vs scheduled job).
3. Confirm the `Provisioning_*` license tables' ownership and whether they migrate or archive.
4. Decide the unified **Account / Subscription / Contact** model before designing individual Objects — everything else stacks on top.
5. Plan data migration for Koroneiki's ~18M-row `AuditEntry` separately from operational data (archive vs carry).
