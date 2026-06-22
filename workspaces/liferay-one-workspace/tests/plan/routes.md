# Routes

Every custom-element SPA route, across all seven page groups. Most route groups are static route tables, covered by Vitest route-wiring unit tests that assert the declared paths, elements, and titles. Route groups with conditional wiring (e.g. ProductPurchase's free/paid steps) additionally warrant an e2e test that loads the route and asserts it renders for the right persona.

> Auto-scaffolded from the code surface (43 items). Edit the Requirement, Type, Priority, and Status columns freely — `scaffold-plan` preserves them on re-run. Do not hand-edit the ID or Source columns.

| ID | Requirement | Type | Priority | Status | Source |
| --- | --- | --- | --- | --- | --- |
| ROUTE-ADMIN-DETAILS-ORDERID | Route table declares the expected path, element, and title: admin:details/:orderId | unit | P1 | planned | route:admin:details/:orderId |
| ROUTE-ADMIN-LICENSE-KEY-UPLOADS | Route table declares the expected path, element, and title: admin:license-key-uploads | unit | P1 | planned | route:admin:license-key-uploads |
| ROUTE-ADMIN-MANAGE-SSA-SAAS-USERS | Route table declares the expected path, element, and title: admin:manage-ssa-saas-users | unit | P1 | planned | route:admin:manage-ssa-saas-users |
| ROUTE-ADMIN-MESSAGE-QUEUE | Route table declares the expected path, element, and title: admin:message-queue | unit | P1 | planned | route:admin:message-queue |
| ROUTE-ADMIN-MP-APPS | Route table declares the expected path, element, and title: admin:mp-apps | unit | P1 | planned | route:admin:mp-apps |
| ROUTE-ADMIN-MP-FINANCE-ORDERS | Route table declares the expected path, element, and title: admin:mp-finance-orders | unit | P1 | planned | route:admin:mp-finance-orders |
| ROUTE-ADMIN-MP-FINANCE-ORDERS-ORDERID | Route table declares the expected path, element, and title: admin:mp-finance-orders/:orderId | unit | P1 | planned | route:admin:mp-finance-orders/:orderId |
| ROUTE-ADMIN-MP-ORDERS | Route table declares the expected path, element, and title: admin:mp-orders | unit | P1 | planned | route:admin:mp-orders |
| ROUTE-ADMIN-MP-PAYMENTS | Route table declares the expected path, element, and title: admin:mp-payments | unit | P1 | planned | route:admin:mp-payments |
| ROUTE-ADMIN-MP-PAYMENTS-ENTRYID | Route table declares the expected path, element, and title: admin:mp-payments/:entryId | unit | P1 | planned | route:admin:mp-payments/:entryId |
| ROUTE-ADMIN-MP-SOLUTIONS | Route table declares the expected path, element, and title: admin:mp-solutions | unit | P1 | planned | route:admin:mp-solutions |
| ROUTE-ADMIN-MP-SUMMARY | Route table declares the expected path, element, and title: admin:mp-summary | unit | P1 | planned | route:admin:mp-summary |
| ROUTE-ADMIN-MY-SSA-SAAS-DEMO | Route table declares the expected path, element, and title: admin:my-ssa-saas-demo | unit | P1 | planned | route:admin:my-ssa-saas-demo |
| ROUTE-ADMIN-PUBLISHER-REQUESTS | Route table declares the expected path, element, and title: admin:publisher-requests | unit | P1 | planned | route:admin:publisher-requests |
| ROUTE-ADMIN-PUBLISHERS | Route table declares the expected path, element, and title: admin:publishers | unit | P1 | planned | route:admin:publishers |
| ROUTE-ADMIN-SSA-SAAS-ENVIRONMENTS | Route table declares the expected path, element, and title: admin:ssa-saas-environments | unit | P1 | planned | route:admin:ssa-saas-environments |
| ROUTE-ADMIN-TRIALS | Route table declares the expected path, element, and title: admin:trials | unit | P1 | planned | route:admin:trials |
| ROUTE-ATTACHMENTS-TICKETID | Route table declares the expected path, element, and title: attachments::ticketId | unit | P1 | planned | route:attachments::ticketId |
| ROUTE-ATTACHMENTS-ERC-TICKETATTACHMENTERC | Route table declares the expected path, element, and title: attachments:erc/:ticketAttachmentERC | unit | P1 | planned | route:attachments:erc/:ticketAttachmentERC |
| ROUTE-ATTACHMENTS-ID-TICKETATTACHMENTID | Route table declares the expected path, element, and title: attachments:id/:ticketAttachmentId | unit | P1 | planned | route:attachments:id/:ticketAttachmentId |
| ROUTE-ATTACHMENTS-NEW | Route table declares the expected path, element, and title: attachments:new | unit | P1 | planned | route:attachments:new |
| ROUTE-ATTACHMENTS-NEW-TICKETID | Route table declares the expected path, element, and title: attachments:new/:ticketId | unit | P1 | planned | route:attachments:new/:ticketId |
| ROUTE-BUSINESS-EVENTS-ACCOUNTKEY-BUSINESS-EVENTS | Route table declares the expected path, element, and title: business-events::accountKey/business-events | unit | P1 | planned | route:business-events::accountKey/business-events |
| ROUTE-BUSINESS-EVENTS-ID | Route table declares the expected path, element, and title: business-events::id | unit | P1 | planned | route:business-events::id |
| ROUTE-BUSINESS-EVENTS-ACTIVITY-HISTORY | Route table declares the expected path, element, and title: business-events:activity-history | unit | P1 | planned | route:business-events:activity-history |
| ROUTE-BUSINESS-EVENTS-ADD | Route table declares the expected path, element, and title: business-events:add | unit | P1 | planned | route:business-events:add |
| ROUTE-BUSINESS-EVENTS-EDIT | Route table declares the expected path, element, and title: business-events:edit | unit | P1 | planned | route:business-events:edit |
| ROUTE-MY-ACCOUNT-APPLICATIONERC | Route table declares the expected path, element, and title: my-account::applicationERC | unit | P1 | planned | route:my-account::applicationERC |
| ROUTE-MY-ACCOUNT-ORDERID | Route table declares the expected path, element, and title: my-account::orderId | unit | P1 | planned | route:my-account::orderId |
| ROUTE-MY-ACCOUNT-PRODUCTERC | Route table declares the expected path, element, and title: my-account::productERC | unit | P1 | planned | route:my-account::productERC |
| ROUTE-MY-ACCOUNT-ACCOUNT-DETAILS | Route table declares the expected path, element, and title: my-account:account-details | unit | P1 | planned | route:my-account:account-details |
| ROUTE-MY-ACCOUNT-ACCOUNT-MEMBERS | Route table declares the expected path, element, and title: my-account:account-members | unit | P1 | planned | route:my-account:account-members |
| ROUTE-MY-ACCOUNT-APPLICATIONS | Route table declares the expected path, element, and title: my-account:applications | unit | P1 | planned | route:my-account:applications |
| ROUTE-MY-ACCOUNT-HISTORY | Route table declares the expected path, element, and title: my-account:history | unit | P1 | planned | route:my-account:history |
| ROUTE-MY-ACCOUNT-ORDERS | Route table declares the expected path, element, and title: my-account:orders | unit | P0 | planned | route:my-account:orders |
| ROUTE-MY-ACCOUNT-PRODUCTS | Route table declares the expected path, element, and title: my-account:products | unit | P1 | planned | route:my-account:products |
| ROUTE-PRODUCT-PURCHASE-LICENSE | SPA route renders for the right persona: product-purchase:license | e2e | P1 | planned | route:product-purchase:license |
| ROUTE-PRODUCT-PURCHASE-PAYMENT-METHOD | SPA route renders for the right persona: product-purchase:payment-method | e2e | P1 | planned | route:product-purchase:payment-method |
| ROUTE-PRODUCT-PURCHASE-SUMMARY | SPA route renders for the right persona: product-purchase:summary | e2e | P0 | planned | route:product-purchase:summary |
| ROUTE-PUBLISHER-DASHBOARD-EDIT | Route table declares the expected path, element, and title: publisher-dashboard:edit | unit | P1 | planned | route:publisher-dashboard:edit |
| ROUTE-PUBLISHER-DASHBOARD-PUBLISHED-APPS | Route table declares the expected path, element, and title: publisher-dashboard:published-apps | unit | P1 | planned | route:publisher-dashboard:published-apps |
| ROUTE-PUBLISHER-DASHBOARD-PUBLISHED-SOLUTIONS | Route table declares the expected path, element, and title: publisher-dashboard:published-solutions | unit | P1 | planned | route:publisher-dashboard:published-solutions |
| ROUTE-PUBLISHER-DASHBOARD-PUBLISHER-PROFILE | Route table declares the expected path, element, and title: publisher-dashboard:publisher-profile | unit | P1 | planned | route:publisher-dashboard:publisher-profile |
