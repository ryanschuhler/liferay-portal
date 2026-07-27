# Routes

Every custom-element SPA route. The SPA mounts one of seven page-group routers (chosen by the host widget's `route` attribute); six carry nested route tables enumerated below, and the seventh (account-selector) is a single page with no nested routes. Most route groups are static route tables, covered by Vitest route-wiring unit tests that assert the declared paths, elements, and titles. Route groups with conditional wiring (e.g. ProductPurchase's free/paid steps) additionally warrant an e2e test that loads the route and asserts it renders for the right persona. A few routes are declared inline in the *Router.tsx files rather than the static table (the MyAccount account guard and project layout, the ProductPurchase completion pages); these only render behind entitlement or commerce state, so they are e2e/deferred and exercised by the flows in flows.md.

> Auto-scaffolded from the code surface (56 items). Edit the Requirement, Type, Priority, and Status columns freely — `scaffoldPlan` preserves them on re-run. Do not hand-edit the ID or Source columns.

| ID | Requirement | Type | Priority | Status | Source |
| --- | --- | --- | --- | --- | --- |
| ROUTE-ADMIN-DETAILS-ORDERID | Admin route table wires `details/:orderId` to the TrialDetails page (no nav entry, param-driven detail) | unit | P2 | planned | route:admin:details/:orderId |
| ROUTE-ADMIN-LICENSE-KEY-UPLOADS | Admin route table wires `license-key-uploads` to the LicenseKeyUploads page with its nav entry | unit | P1 | planned | route:admin:license-key-uploads |
| ROUTE-ADMIN-MANAGE-SSA-SAAS-USERS | Admin route table wires `manage-ssa-saas-users` to the ManageSsaSaasUsers page with its nav entry | unit | P1 | planned | route:admin:manage-ssa-saas-users |
| ROUTE-ADMIN-MP-APPS | Admin route table wires `mp-apps` to the Apps list page with its nav entry | unit | P1 | planned | route:admin:mp-apps |
| ROUTE-ADMIN-MP-APPS-PRODUCTID | Admin route table wires `mp-apps/:productId` to the AppDetail page (no nav entry, param-driven detail) | unit | P2 | planned | route:admin:mp-apps/:productId |
| ROUTE-ADMIN-MP-FINANCE-ORDERS | Admin route table wires `mp-finance-orders` to the MPFinanceOrders list page with its nav entry | unit | P1 | planned | route:admin:mp-finance-orders |
| ROUTE-ADMIN-MP-FINANCE-ORDERS-ORDERID | Admin route table wires `mp-finance-orders/:orderId` to the OrderDetails page (no nav entry, param-driven detail) | unit | P2 | planned | route:admin:mp-finance-orders/:orderId |
| ROUTE-ADMIN-MP-ORDERS | Admin route table wires `mp-orders` to the Orders list page with its nav entry | unit | P1 | planned | route:admin:mp-orders |
| ROUTE-ADMIN-MP-PAYMENTS | Admin route table wires `mp-payments` to the Payments list page with its nav entry | unit | P1 | planned | route:admin:mp-payments |
| ROUTE-ADMIN-MP-PAYMENTS-ENTRYID | Admin route table wires `mp-payments/:entryId` to the PaymentDetails page (no nav entry, param-driven detail) | unit | P2 | planned | route:admin:mp-payments/:entryId |
| ROUTE-ADMIN-MP-SOLUTIONS | Admin route table wires `mp-solutions` to the Solutions list page with its nav entry | unit | P1 | planned | route:admin:mp-solutions |
| ROUTE-ADMIN-MP-SOLUTIONS-PRODUCTID | Admin route table wires `mp-solutions/:productId` to the SolutionDetail page (no nav entry, param-driven detail) | unit | P2 | planned | route:admin:mp-solutions/:productId |
| ROUTE-ADMIN-MP-SUMMARY | Admin route table wires `mp-summary` to the MPSummary page and makes it the default index redirect | unit | P1 | planned | route:admin:mp-summary |
| ROUTE-ADMIN-MY-SSA-SAAS-DEMO | Admin route table wires `my-ssa-saas-demo` to the MySsaSaasDemo page with its nav entry | unit | P1 | planned | route:admin:my-ssa-saas-demo |
| ROUTE-ADMIN-PUB-SUB | Admin route table wires `pub-sub` to the PubSub page with its nav entry | unit | P1 | planned | route:admin:pub-sub |
| ROUTE-ADMIN-PUBLISHER-REQUESTS | Admin route table wires `publisher-requests` to the PublisherRequests page with its nav entry | unit | P1 | planned | route:admin:publisher-requests |
| ROUTE-ADMIN-PUBLISHERS | Admin route table wires `publishers` to the Publishers page with its nav entry | unit | P1 | planned | route:admin:publishers |
| ROUTE-ADMIN-SSA-SAAS-ENVIRONMENTS | Admin route table wires `ssa-saas-environments` to the Environments page with its nav entry | unit | P1 | planned | route:admin:ssa-saas-environments |
| ROUTE-ADMIN-TRIALS | Admin route table wires `trials` to the Trials page with its nav entry | unit | P1 | planned | route:admin:trials |
| ROUTE-BUSINESS-EVENTS-ID | Route table wires the `:id` branch whose index renders BusinessEventsDetails, nesting the edit and activity-history children | unit | P1 | planned | route:business-events::id |
| ROUTE-BUSINESS-EVENTS-PROJECTERC-BUSINESS-EVENTS | Route table nests the `:projectERC/business-events` branch (list index plus add/:id children) under the BusinessEventsRedirect element | unit | P1 | planned | route:business-events::projectERC/business-events |
| ROUTE-BUSINESS-EVENTS-ACTIVITY-HISTORY | Route table wires the `activity-history` child under `:id` to the BusinessEventsActivityHistory page | unit | P1 | planned | route:business-events:activity-history |
| ROUTE-BUSINESS-EVENTS-ADD | Route table wires the `add` child of the business events list to the BusinessEventsAdd page | unit | P1 | planned | route:business-events:add |
| ROUTE-BUSINESS-EVENTS-EDIT | Route table wires the `edit` child under `:id` to the BusinessEventsEdit page | unit | P1 | planned | route:business-events:edit |
| ROUTE-MY-ACCOUNT-ACCOUNTERC | Account access guard: the `:accountERC` route validates the account and gates account-scoped pages; declared inline in MyAccountRouter. Exercised by FLOW-MY-ACCOUNT-OVERVIEW (deferred — needs an entitled member) | e2e | P1 | deferred | route:my-account::accountERC |
| ROUTE-MY-ACCOUNT-APPLICATIONERC | Project route table wires `applications/:applicationERC` to ProjectItemDetails with kind application | unit | P1 | planned | route:my-account::applicationERC |
| ROUTE-MY-ACCOUNT-ORDERID | Account route table wires `orders/:orderId` to the OrderDetails page | unit | P1 | planned | route:my-account::orderId |
| ROUTE-MY-ACCOUNT-PRODUCTERC | Project route table wires `products/:productERC` to ProjectItemDetails with kind product | unit | P1 | planned | route:my-account::productERC |
| ROUTE-MY-ACCOUNT-PROJECTERC | Project detail route (`:projectERC`) renders the selected project; declared inline in MyAccountRouter. Exercised by FLOW-MY-ACCOUNT-OVERVIEW (deferred — needs an entitled member) | e2e | P1 | deferred | route:my-account::projectERC |
| ROUTE-MY-ACCOUNT-ACCOUNT-DETAILS | Account route table wires `account-details` to the AccountDetails page under the AccountTabsLayout | unit | P1 | planned | route:my-account:account-details |
| ROUTE-MY-ACCOUNT-ACCOUNT-MEMBERS | Account route table wires `account-members` to the AccountMembers page under the AccountTabsLayout | unit | P1 | planned | route:my-account:account-members |
| ROUTE-MY-ACCOUNT-APPLICATIONS | Project route table wires `applications` to the Applications list page with its nav entry | unit | P1 | planned | route:my-account:applications |
| ROUTE-MY-ACCOUNT-HISTORY | Account route table wires `orders/history` to the OrderHistory page | unit | P1 | planned | route:my-account:history |
| ROUTE-MY-ACCOUNT-ORDERS | Account route table wires the `orders` branch whose index renders the Orders list | unit | P1 | planned | route:my-account:orders |
| ROUTE-MY-ACCOUNT-PRODUCTS | Project route table wires the `products` branch whose index renders the Products list and is the project default redirect | unit | P1 | planned | route:my-account:products |
| ROUTE-MY-ACCOUNT-PROJECT | Project layout route wraps project pages in ProjectProvider; declared inline in MyAccountRouter. Exercised by FLOW-MY-ACCOUNT-OVERVIEW (deferred — needs an entitled member) | e2e | P1 | deferred | route:my-account:project |
| ROUTE-MY-ACCOUNT-PROJECT-MEMBERS | Account route table wires `project-members` to the ProjectMembers page under the AccountTabsLayout | unit | P1 | planned | route:my-account:project-members |
| ROUTE-PRODUCT-PURCHASE-ACTIVATION-KEY-FORM | ActivationKeyForm step is included only for DXP free tier products; getProductPurchaseSteps must gate it on isDXPFreeOnly and exclude it otherwise | e2e | P1 | planned | route:product-purchase:activation-key-form |
| ROUTE-PRODUCT-PURCHASE-AI-HUB-FORM | AIHubForm step is emitted only when the product solution type is ai-hub; getProductPurchaseSteps must select the AI Hub step set and not the default flow | e2e | P1 | planned | route:product-purchase:ai-hub-form |
| ROUTE-PRODUCT-PURCHASE-AI-HUB-OPEN-BETA-FORM | AIHubOpenBetaForm step is emitted only for the ai-hub-open-beta solution type without the aiHubTokens param; getProductPurchaseSteps must branch on solution type and search params | e2e | P1 | planned | route:product-purchase:ai-hub-open-beta-form |
| ROUTE-PRODUCT-PURCHASE-BANK-TRANSFER-COMPLETED | Paid-checkout bank-transfer confirmation page; declared inline in ProductPurchaseRouter. Exercised by FLOW-CHECKOUT-PAID (deferred — needs commerce/payment stub) | e2e | P1 | deferred | route:product-purchase:bank-transfer-completed |
| ROUTE-PRODUCT-PURCHASE-LICENSE | SPA route renders for the right persona: product-purchase:license | e2e | P1 | planned | route:product-purchase:license |
| ROUTE-PRODUCT-PURCHASE-PAYMENT-METHOD | SPA route renders for the right persona: product-purchase:payment-method | e2e | P1 | planned | route:product-purchase:payment-method |
| ROUTE-PRODUCT-PURCHASE-PROJECT | ProjectSelection step is emitted only in the ai-hub-open-beta flow; getProductPurchaseSteps must place it between account and the open beta form | e2e | P1 | planned | route:product-purchase:project |
| ROUTE-PRODUCT-PURCHASE-PROVISIONING | LDPProvisioning step is included only for LDP products; getProductPurchaseSteps must gate it on isLDP and exclude it from non LDP flows | e2e | P1 | planned | route:product-purchase:provisioning |
| ROUTE-PRODUCT-PURCHASE-PURCHASE-COMPLETED | Checkout completion page; declared inline in ProductPurchaseRouter. Exercised by FLOW-CHECKOUT-FREE / FLOW-CHECKOUT-PAID (deferred — needs commerce completion) | e2e | P1 | deferred | route:product-purchase:purchase-completed |
| ROUTE-PRODUCT-PURCHASE-SUMMARY | SPA route renders for the right persona: product-purchase:summary | e2e | P0 | planned | route:product-purchase:summary |
| ROUTE-PUBLISHER-DASHBOARD-EDIT | Route table wires the `publisher-profile/edit` child to the PublisherProfileEdit page | unit | P1 | planned | route:publisher-dashboard:edit |
| ROUTE-PUBLISHER-DASHBOARD-PUBLISHED-APPS | Route table wires `published-apps` to the PublishedApps page (nav entry) and makes it the default index redirect | unit | P1 | planned | route:publisher-dashboard:published-apps |
| ROUTE-PUBLISHER-DASHBOARD-PUBLISHED-SOLUTIONS | Route table wires `published-solutions` to the PublishedSolutions page with its nav entry | unit | P1 | planned | route:publisher-dashboard:published-solutions |
| ROUTE-PUBLISHER-DASHBOARD-PUBLISHER-PROFILE | Route table wires the `publisher-profile` branch whose index renders PublisherProfile and nests the edit child | unit | P1 | planned | route:publisher-dashboard:publisher-profile |
| ROUTE-TICKET-ATTACHMENTS-TICKETID | Route table wires the `:ticketId` path to the TicketAttachmentsUploaderOutlet under the TicketAttachmentsLayout | unit | P1 | planned | route:ticket-attachments::ticketId |
| ROUTE-TICKET-ATTACHMENTS-ERC-TICKETATTACHMENTERC | Route table wires `erc/:ticketAttachmentERC` to the TicketAttachmentsDownloaderOutlet | unit | P1 | planned | route:ticket-attachments:erc/:ticketAttachmentERC |
| ROUTE-TICKET-ATTACHMENTS-ID-TICKETATTACHMENTID | Route table wires `id/:ticketAttachmentId` to the TicketAttachmentsDownloaderOutlet | unit | P1 | planned | route:ticket-attachments:id/:ticketAttachmentId |
| ROUTE-TICKET-ATTACHMENTS-NEW | Route table wires `new` to the TicketAttachmentsAdd page under the TicketAttachmentsLayout | unit | P1 | planned | route:ticket-attachments:new |
| ROUTE-TICKET-ATTACHMENTS-NEW-TICKETID | Route table wires `new/:ticketId` to the TicketAttachmentsUploaderOutlet | unit | P1 | planned | route:ticket-attachments:new/:ticketId |
