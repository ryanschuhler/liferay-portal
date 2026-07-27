# Subscribers

Every async Pub/Sub subscriber in liferay-one-etc-spring-boot. Each is unit-tested at the message-handler level (JUnit + Mockito), including dedupe and idempotency. The real in-action integration coverage is tracked as a journey in flows.md.

> Auto-scaffolded from the code surface (4 items). Edit the Requirement, Type, Priority, and Status columns freely — `scaffoldPlan` preserves them on re-run. Do not hand-edit the ID or Source columns.

| ID | Requirement | Type | Priority | Status | Source |
| --- | --- | --- | --- | --- | --- |
| SUB-OKTAAPPCREATEDPUBSUBSUBSCRIBER | Consumes the Okta app-created event, provisions the corresponding record idempotently, and drops a duplicate or unparseable message without a partial write (E15, LPD-88258) | unit | P1 | planned | subscriber:OktaAppCreatedPubsubSubscriber |
| SUB-OKTAUSERSPUBSUBSUBSCRIBER | Consumes Okta user events and upserts the matching Liferay user/org-role association idempotently; a duplicate is deduped and a parse error yields no partial write (E15, LPD-88258, LPD-89425) | unit | P1 | planned | subscriber:OktaUsersPubsubSubscriber |
| SUB-SALESFORCEOBJECTPUBSUBSUBSCRIBER | Valid event upserts products, SKUs, and price entries idempotently; duplicate dropped; parse error → no partial write (E11, LPD-88254) | unit | P0 | planned | subscriber:SalesforceObjectPubsubSubscriber |
| SUB-SALESFORCEOPPORTUNITYPUBSUBSUBSCRIBER | Inbound revenue path: a Salesforce opportunity event upserts the order/contract idempotently, dedupes a replayed message, and never partially writes on a parse error (E11, LPD-88254) | unit | P0 | planned | subscriber:SalesforceOpportunityPubsubSubscriber |
