# End-to-End Flows & Cross-Cutting Requirements

Multi-surface user journeys and cross-cutting requirements that span several
routes, endpoints, and objects, so they have no single enumerable code symbol.
They use `spec:` Source anchors, which `check-plan` intentionally does not
enumerate — these rows are curated by hand from the specs and the LPD-87600
capability areas. Add, split, or refine them as the product takes shape.

| ID | Requirement | Type | Priority | Status | Source |
| --- | --- | --- | --- | --- | --- |
| FLOW-CHECKOUT-PAID | Paid app checkout: account selection → license → payment method → summary → order placed → confirmation | e2e | P0 | planned | spec:flow#checkout-paid |
| FLOW-CHECKOUT-FREE | Free app checkout: account selection → summary → order placed → confirmation | e2e | P0 | planned | spec:flow#checkout-free |
| FLOW-CHECKOUT-BANK-TRANSFER | Bank-transfer checkout reaches the bank-transfer-completed state | e2e | P1 | planned | spec:flow#checkout-bank-transfer |
| FLOW-PUBLISHER-ONBOARDING | Publisher onboarding: request → approval → publisher profile + assets editable | e2e | P1 | planned | spec:flow#publisher-onboarding |
| FLOW-LICENSE-GENERATION | License key generation produces a signed key tied to the subscription | integration | P0 | planned | spec:flow#license-generation |
| FLOW-LICENSE-REVOCATION | Spec-only; no license-key revocation endpoint or action implemented yet. Deferred until built. | integration | P1 | deferred | spec:flow#license-revocation |
| FLOW-LICENSE-EXPIRATION-EMAIL | Expiring-license emails are queued at 30/14/0 days before expiry | integration | P1 | planned | spec:flow#license-expiration-email |
| FLOW-TRIAL-PROVISIONING | Spec-only; no trial provisioning endpoint implemented yet (depends on the Liferay Cloud integration). Deferred until built. | integration | P0 | deferred | spec:flow#trial-provisioning |
| FLOW-TRIAL-EXPIRY | Spec-only; no trial expiry endpoint implemented yet (depends on the Liferay Cloud integration). Deferred until built. | integration | P1 | deferred | spec:flow#trial-expiry |
| FLOW-TICKET-UPLOAD | Ticket attachment upload: initiate → GCS upload → complete → Jira comment | e2e | P1 | planned | spec:flow#ticket-attachment-upload |
| FLOW-TICKET-DOWNLOAD | Ticket attachment download enforces access checks and signed-URL expiry | integration | P1 | planned | spec:flow#ticket-attachment-download |
| FLOW-BUSINESS-EVENT-LIFECYCLE | Business event lifecycle: create → edit → record go-live / cancel → activity history | e2e | P1 | planned | spec:flow#business-event-lifecycle |
| FLOW-SALESFORCE-ORDER-SYNC | Salesforce Pub/Sub sync upserts products and price entries idempotently | integration | P0 | planned | spec:flow#salesforce-order-sync |
| FLOW-ENTITLEMENT-GENERATION | Commerce order item triggers entitlement generation against its definition | integration | P0 | planned | spec:flow#entitlement-generation |
| FLOW-ACCOUNT-TEAM-MEMBERS | Account team management: invite, assign roles, and remove members | e2e | P1 | planned | spec:flow#account-team-members |
| AUTH-UNAUTHENTICATED | Unauthenticated headless and custom-REST requests are rejected | integration | P0 | planned | spec:auth#unauthenticated-rejected |
| AUTH-OAUTH2-SCOPES | Custom REST endpoints enforce their declared OAuth2 scopes | integration | P0 | planned | spec:auth#oauth2-scope-enforcement |
| AUTH-ACCOUNT-RESTRICTION | Account-restricted Objects filter to the caller's account membership | integration | P0 | planned | spec:auth#account-entry-restriction |
| HEADLESS-MY-USER-ACCOUNT | Authenticated my-user-account returns the calling user | integration | P1 | planned | spec:headless#my-user-account |
| I18N-LOCALE-SWITCHING | Language selector switches UI locale (EN / JA / PT-BR / ES) | e2e | P2 | planned | spec:i18n#locale-switching |
| ERROR-CONTRACT | Custom REST errors follow the documented error envelope and status codes | integration | P1 | planned | spec:error#error-contract |