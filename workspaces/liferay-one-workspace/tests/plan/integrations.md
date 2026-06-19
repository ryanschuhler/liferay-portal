# Integrations

Every external-system integration contract. Covered by an integration test (live or mocked) asserting the inbound/outbound contract and failure handling.

> Auto-scaffolded from the code surface (6 items). Edit the Requirement, Type, Priority, and Status columns freely — `scaffold-plan` preserves them on re-run. Do not hand-edit the ID or Source columns.

| ID | Requirement | Type | Priority | Status | Source |
| --- | --- | --- | --- | --- | --- |
| INT-DATA-WAREHOUSE | Spec-only; no BigQuery client implemented in the workspace yet. Deferred until built. | integration | P1 | planned | integration:data-warehouse |
| INT-GOOGLE-CLOUD-FUNCTIONS | Spec-only; no Cloud Functions client implemented in the workspace yet. Deferred until built. | integration | P1 | planned | integration:google-cloud-functions |
| INT-GOOGLE-CLOUD-STORAGE | Outbound GCS contract (signed URLs, deletes). Needs an injectable Storage client or a live test; service currently builds the client internally. | integration | P1 | planned | integration:google-cloud-storage |
| INT-JIRA | Inbound Jira data contract honored (asset-object payload maps onto the business-event model). | integration | P1 | planned | integration:jira |
| INT-LIFERAY-CLOUD | Spec-only; no Liferay Cloud provisioning/console client implemented in the workspace yet. Deferred until built. | integration | P0 | planned | integration:liferay-cloud |
| INT-SALESFORCE | Inbound Salesforce Pub/Sub contract honored (Product2 and PricebookEntry routing). | integration | P0 | planned | integration:salesforce |