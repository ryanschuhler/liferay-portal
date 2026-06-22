# Subscribers

Every async Pub/Sub subscriber in liferay-one-etc-spring-boot. Each is unit-tested at the message-handler level (JUnit + Mockito), including dedupe and idempotency. The real in-action integration coverage is tracked as a journey in flows.md.

> Auto-scaffolded from the code surface (1 items). Edit the Requirement, Type, Priority, and Status columns freely — `scaffold-plan` preserves them on re-run. Do not hand-edit the ID or Source columns.

| ID | Requirement | Type | Priority | Status | Source |
| --- | --- | --- | --- | --- | --- |
| SUB-SALESFORCEOBJECTPUBSUBSUBSCRIBER | Async subscriber processes and dedupes messages: SalesforceObjectPubsubSubscriber | unit | P0 | planned | subscriber:SalesforceObjectPubsubSubscriber |
