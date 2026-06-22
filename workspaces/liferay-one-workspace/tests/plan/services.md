# Services

Every Spring service in liferay-one-etc-spring-boot. Services holding branching logic (dedupe guards, validation, null/error fallbacks) are `planned` and unit-tested with JUnit + Mockito — this is where the logic the controllers delegate to actually lives. Thin HTTP CRUD wrappers with no branch worth proving are kept `n/a`: enumerated so the surface stays honest, but excluded from the go-live denominator.

> Auto-scaffolded from the code surface (17 items). Edit the Requirement, Type, Priority, and Status columns freely — `scaffold-plan` preserves them on re-run. Do not hand-edit the ID or Source columns.

| ID | Requirement | Type | Priority | Status | Source |
| --- | --- | --- | --- | --- | --- |
| SVC-COMMERCEORDERITEMSERVICE | Thin headless-commerce client wrapper — fetches a single order item with no branch worth proving | unit | P2 | n/a | service:CommerceOrderItemService |
| SVC-COMMERCEORDERSERVICE | Thin headless-commerce client wrapper — fetches a single order with no branch worth proving | unit | P2 | n/a | service:CommerceOrderService |
| SVC-COMMERCEPRICEENTRYSERVICE | Price entry add-vs-update branch and delete-by-ERC are proven in isolation | unit | P2 | planned | service:CommercePriceEntryService |
| SVC-COMMERCEPRICELISTSERVICE | Thin headless-commerce client wrapper — fetches a single price list with no branch worth proving | unit | P2 | n/a | service:CommercePriceListService |
| SVC-COMMERCEPRODUCTSERVICE | Product add-vs-update and deactivate branches are proven in isolation | unit | P2 | planned | service:CommerceProductService |
| SVC-COMMERCESKUSERVICE | Thin headless-commerce client wrapper — fetches a single SKU with no branch worth proving | unit | P2 | n/a | service:CommerceSkuService |
| SVC-EMAILADDRESSVALIDATORSERVICE | Email validation accepts valid addresses, rejects invalid ones, and handles the throwing case | unit | P1 | planned | service:EmailAddressValidatorService |
| SVC-ENTITLEMENTDEFINITIONSERVICE | Thin headless client wrapper — builds the OData filter and lists definitions with no branch worth proving | unit | P2 | n/a | service:EntitlementDefinitionService |
| SVC-ENTITLEMENTSERVICE | Entitlement generation creates one per definition, resolves the contract id, swallows per-definition failures, and refuses duplicates (idempotency) | unit | P0 | planned | service:EntitlementService |
| SVC-GOOGLECLOUDSTORAGESERVICE | Signed download URL, resumable upload session URL, and object delete are proven; 15-minute download expiry holds | unit | P1 | planned | service:GoogleCloudStorageService |
| SVC-JIRASERVICE | Support-issue lookup, search, business-event CRUD, and the asset-objects cache eviction behave correctly | unit | P1 | planned | service:JiraService |
| SVC-LICENSEKEYSERVICE | Thin headless client wrapper — persists a license key with no branch worth proving | unit | P2 | n/a | service:LicenseKeyService |
| SVC-NOTIFICATIONQUEUEENTRYSERVICE | Thin notification-rest client wrapper — enqueues an entry with no branch worth proving | unit | P2 | n/a | service:NotificationQueueEntryService |
| SVC-NOTIFICATIONTEMPLATESERVICE | Template lookup and rendering branches are proven in isolation | unit | P2 | planned | service:NotificationTemplateService |
| SVC-OKTASERVICE | Okta user/group lookup, error mapping, and pagination branches are proven in isolation | unit | P1 | planned | service:OktaService |
| SVC-SUBSCRIPTIONENTRYSERVICE | Expiring-license-key window (30/14/0 day) selection and the per-user email loop are proven, including the email-failure-continues path | unit | P1 | planned | service:SubscriptionEntryService |
| SVC-TICKETATTACHMENTSERVICE | Attachment add/fetch/approve/state-transition/draft-comment branches are proven in isolation | unit | P1 | planned | service:TicketAttachmentService |
