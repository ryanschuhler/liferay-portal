# Converters

Every DTO/model converter in liferay-one-etc-spring-boot. Converters are pure input → output transforms — the cheapest, highest-value unit tests in the suite — so each is `planned` and exercised directly with JUnit.

> Auto-scaffolded from the code surface (4 items). Edit the Requirement, Type, Priority, and Status columns freely — `scaffold-plan` preserves them on re-run. Do not hand-edit the ID or Source columns.

| ID | Requirement | Type | Priority | Status | Source |
| --- | --- | --- | --- | --- | --- |
| CONV-ASSETOBJECTCONVERTER | Jira asset object maps to the model across its present/absent attribute branches | unit | P2 | planned | converter:AssetObjectConverter |
| CONV-BUSINESSEVENTCONVERTER | Jira issue maps to a business event, including field defaults and missing-attribute handling | unit | P1 | planned | converter:BusinessEventConverter |
| CONV-BUSINESSEVENTVERSIONCONVERTER | Version history maps with displayValue-over-value precedence | unit | P2 | planned | converter:BusinessEventVersionConverter |
| CONV-ORGANIZATIONCONVERTER | Organization maps including the referenced-object fallback and missing-attribute empty string | unit | P1 | planned | converter:OrganizationConverter |
