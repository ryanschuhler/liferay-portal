# Data Model

## Liferay One Objects

---

### Account Management

#### Account (`AccountEntry` — core extension)

**system:** `true`

| Field | Type | Notes |
|---|---|---|
| PK `accountEntryId` | long | |
| `externalReferenceCode` | string | Salesforce Account.Id (18-char); unique |
| `name` | string | |
| `description` | string | Prefer the Salesforce value. Use the Marketplace value when Salesforce has none |
| `logoId` | long | |
| `parentAccountEntryId` | long | Force NULL. Contract holds the hierarchy of the child accounts |
| `type` | string | `business` · `person` |
| `userId` | long | FK to User; Person-type accounts only |
| `status` | string | `approved` · `inactive` · `closed` |
| `taxId` | string | OOTB field |
| `defaultBillingAddressId` | long | FK to Address |
| `defaultShippingAddressId` | long | FK to Address |
| `internal` | boolean | Liferay employee test accounts |
| `maxRequestors` | int | The limit on the seats for requestors. Null gives no limit |
| `creditLimit` | decimal | The finance team of Liferay sets this value to control the risk on accounts receivable |
| `availableCredit` | decimal | |
| `creditStatus`, `holdReason` | string | |

**Custom fields:** `accountTier` (Platinum / Gold / Silver / Bronze / Trial / Community), `accountCode` (migrated Koroneiki accountKey), `allowComplimentary` (boolean), `allowPermanentLicenses` (boolean), `allowSelfProvisioning` (boolean), `AccountType`

---

#### AccountFlag (`C_ACCNT_FLAG`)

**system:** `false`

| Field | Type | Notes |
|---|---|---|
| PK `accountFlagId` | long | |
| FK `accountId` | long | |
| `flagCode` | picklist | |
| `flagValue` | picklist | |
| `startDate`, `endDate` | datetime | |
| `note` | string | |
| `finished` | boolean | |
| `accountKey` | string | Denormalized account identifier |

---

#### AccountNote (`C_ACCNT_NOTE`)

**system:** `false`

| Field | Type | Notes |
|---|---|---|
| PK `accountNoteId` | long | |
| `uuid` | string | The migration keeps this value from Koroneiki to trace the record between systems |
| `externalReferenceCode` | string | Migrated Koroneiki `accountNoteKey` |
| FK `accountEntryId` | long | |
| `summary` | string | |
| `content` | Clob | |
| `format` | picklist | |
| `type` | picklist | |
| `priority` | picklist | |
| `status` | picklist | |
| `createDate` | datetime | |
| `createdByUserId` | long | FK to User |
| `createdByUserName` | string | The creation sets this value. Do not overwrite it on an edit |
| `modifiedDate` | datetime | |
| `modifiedByUserId` | long | FK to User |
| `modifiedByUserName` | string | |
| `koroneikiAccountKey` | string | The parent accountKey in Koroneiki. It traces the migration |
| `projectId` | long | FK to Project |

---

#### Organization (`L_ORGANIZATION` — core system object)

**system:** `true`

This is the system Organization of Liferay. The migration moves it from support.liferay. The migration moves only the organizations for First Line Support (FLS) and the organizations internal to Liferay. The team for partner accounts migrates the organizations of a partner account separately. The `onAfterAdd`, `onAfterUpdate`, and `onAfterDelete` object actions sync the organization with a JSM team.

| Field | Type | Notes |
|---|---|---|
| PK `organizationId` | long | |
| `name` | string | The migration copies the name of the Support Organization |
| `accountEntryId` | long | A custom field for the account that owns the organization. For example, Accenture FLS points to the Accenture account. Use a plain field, not a relationship. Liferay forbids an object relationship between 2 system objects, and `L_ACCOUNT` and `L_ORGANIZATION` are both system objects. |

**Relationships:**

- `organizationToProject` (`L_ORGANIZATION → C_PROJECT`, one-to-many, disassociate) — this relationship records the customer projects that an organization supports. It serves the use case for an FLS partner. At most 1 organization supports a project. The relationship is valid because `C_PROJECT` is a custom object. It controls which projects a partner sees. The VIEW permission and the gate on a restricted page are a dependent follow-up.

---

#### BannedEmailDomain (`C_BANNED_EMAIL`)

**system:** `false`

| Field | Type | Notes |
|---|---|---|
| PK `bannedEmailDomainId` | long | |
| `domain` | string | For example, `mailinator.com`. The value is unique |
| `reason` | string | |
| `addedAt` | datetime | |
| `addedByUserId` | long | |

---

#### CreditHold (`C_CREDIT_HOLD`)

**system:** `false`

The finance team sets this hard hold for accounts receivable. The hold overrides every spend limit.

| Field | Type | Notes |
|---|---|---|
| PK `creditHoldId` | long | |
| FK `accountId` | long | |
| `reason` | string | |
| `startDate` | datetime | |
| `endDate` | datetime | Null gives no end date |
| `setByUserId` | long | Finance user |
| `note` | string | |

---

### Subscription Management

#### Commerce Product (CPDefinition with custom fields)

**system:** `true`

| Field | Type | Notes |
|---|---|---|
| PK `CProductId` | long | |
| `externalReferenceCode` | string | The source sets this value. A seeded product and a Marketplace product use `PRDCT-*`. This value is not a lookup key, because the SKU holds the Salesforce key. A Salesforce event never creates a product. It only updates the SKU that holds the Salesforce ID |
| `catalog` | string | `Liferay` · `AccountEntry` |
| `name` | string | |
| `description` | string | |
| `isPrimary` | boolean | Default `false` |
| `licenseKeyProductVersion` | string | The version string in a generated key, for example `dxp-7.4`. A product with no license key leaves it null |
| `productFamily` | picklist | DXP · Portal · SaaS · PaaS · Commerce · Analytics · EnterpriseSearch · AIHub · CMP · DataPlatform · DSR · Partner · Support · Training · Other. The import normalizes this value from the SFDC field `Product2.Family` (LXC → SaaS, DXP Cloud → PaaS, Commerce/Commerce Cloud → Commerce, Enterprise Search + Cloud → EnterpriseSearch). CMP is the Content Marketing Platform. Data Platform is a family of its own. Digital Sales Room (DSR) is a family of its own. The seed writes this value as a `family` product specification. |
| `metricCoverage` | string | The rules come from the SFDC Product Catalog |

**CPSpecificationOption values (Marketplace app metadata)**

| Specification |
|---|
| `App API Reference URL` |
| `App Beta` |
| `App Documentation URL` |
| `App Entry` |
| `App Entry UUID` |
| `App Installation Guide URL` |
| `App Settings` |
| `App Usage Terms URL` |
| `Current Requirements` |
| `Developer Name` |
| `Downloadable Cloud App` |
| `Latest Version` |
| `License Term` |
| `License Type` |
| `Liferay Product Capabilities` |
| `Liferay Product Categories` |
| `Liferay Version` |
| `Lifetime License` |
| `Number of CPUs` |
| `Our Selection` |
| `Past Versions Work With` |
| `Price Model` |
| `Product Downloads` |
| `Product Notes` |
| `Publisher Name` |
| `Publisher Web site URL` |
| `Ram in GB` |
| `Solution Company Description` |
| `Solution Company Email` |
| `Solution Company Phone` |
| `Solution Company Website` |
| `Solution Contact Email` |
| `Solution Details Blocks` |
| `Solution Header Description` |
| `Solution Header Title` |
| `Solution Header Video Description` |
| `Solution Header Video URL` |
| `Solution Type` |
| `Source Code URL` |
| `Support Email` |
| `Support Email Address` |
| `Support Phone` |
| `Support URL` |
| `Type` |

**Categories**

| Category |
|---|
| Marketplace App Category |
| Marketplace App Tags |
| Marketplace Availability |
| Marketplace Category |
| Liferay Platform Offering |
| Liferay Version |
| Product Type |
| Solution Category |
| Solution Tags |

---

#### Commerce SKU (CPInstance)

**system:** `true`

The SKU is the unit that Liferay sells. A product has 1 or more SKUs. Each SKU maps to 1 Salesforce `Product2`, the unit that Salesforce sells. A `PricebookEntry` and an `OpportunityLineItem` each reference that `Product2`. A Marketplace product such as AI Hub has 1 SKU for each plan. A migrated Salesforce product has exactly 1 SKU.

| Field | Type | Notes |
|---|---|---|
| PK `CPInstanceId` | long | |
| FK `CProductId` | long | Parent product |
| `externalReferenceCode` | string | This value is the only key between the systems. An order item, a price entry, and an entitlement definition each reference the SKU by this value. A migrated Salesforce product uses the Salesforce `Product2.Id` (18-char). A seeded product and a Marketplace product with 1 SKU use `PRDCT-*`, which matches the parent product |
| `sku` | string | SKU code |
| `skuOptions` | list | The options for the plan, the sizing, and the license that separate the SKUs of one product |

Liferay Commerce has no system object definition for CPInstance. Therefore a custom object cannot hold an object relationship to a SKU. A custom object stores `skuExternalReferenceCode` as a text field.

---

#### CommerceOrder (OOTB + custom fields)

**system:** `true`

| Field | Type | Notes |
|---|---|---|
| PK `commerceOrderId` | long | |
| `externalReferenceCode` | string | Salesforce Opportunity.Id |
| FK `accountEntryId` | long | |
| FK `commerceOrderTypeId` | long | |
| `currencyCode` | string | e.g. USD, EUR |
| `orderStatus` | int | 0=pending · 1=open · 2=in-progress · 5=completed · 6=cancelled |
| `paymentStatus` | int | |
| `paymentMethodKey` | string | |
| `total`, `subtotal`, `shippingAmount`, `taxAmount`, `totalWithTaxAmount` | decimal(30,16) | |
| `billingAddressId`, `shippingAddressId` | long | FK to Address |
| `purchaseOrderNumber` | string | |
| `couponCode` | string | |
| `transactionId` | string | Payment processor transaction ID |
| `printedNote` | longtext | |
| `userId` | long | |
| `createDate`, `modifiedDate` | datetime | |

**Custom fields:** `contractId` (FK to Contract), `marketplaceOrderType`, `projectName`, `cloudProjectName`, `ldpWorkspaceName`

---

#### CommerceOrderItem (OOTB + custom fields)

**system:** `true`

This object replaces `SubscriptionItem`. Each row matches 1 Salesforce OpportunityLineItem.

| Field | Type | Notes |
|---|---|---|
| PK `orderItemId` | long | |
| `externalReferenceCode` | string | Salesforce OpportunityLineItem.Id |
| FK `orderId` | long | Parent CommerceOrder |
| FK `CProductId` | long | |
| FK `CPInstanceId` | long | |
| `quantity` | decimal(30,16) | |
| `unitPrice`, `finalPrice` | decimal(30,16) | |
| `name` | longtext | The name of the product at the time of purchase. Denormalized |
| `sku` | string | SKU at time of purchase |
| `subscription` | boolean | |
| `subscriptionInfo` | string | |
| `userId` | long | |
| `createDate`, `modifiedDate` | datetime | |

**Custom fields:** `cloudRegion` (e.g. `us-central1`), `machineType` (`Standard` · `High`), `orderType` (`New Business` · `Renewal`), `sizing` (int), `startDate`, `endDate`, `effectiveEndDate` (endDate + 30-day grace period), `status` (`Approved` · `Canceled` · `On Hold`), `spendLimit` (double; the spend limit for each product), `opportunitySoldBy`

---

#### Contract (`C_CONTRACT`)

**system:** `false`

> This custom object is temporary. It stays until Liferay core provides a system `Contract` object. That release needs a migration ticket.

| Field | Type | Notes |
|---|---|---|
| PK `contractId` | long | |
| `externalReferenceCode` | string | Salesforce Contract.Id (18-char) |
| FK `accountEntryId` | long | |
| `startDate` | datetime | |
| `endDate` | datetime | |
| `contractTerm` | int | Term in months, e.g. 12 |
| `contractBillingCadence` | int | e.g. 12 (months) |
| `overageBillingCadence` | int | e.g. 3 (months) |
| `ownerEmailAddress` | string | The import resolves this from the owner of the Salesforce Contract |
| `status` | string | The system computes this from the statuses of the CommerceOrderItems |
| `renewalState` | string | |
| `spendLimit` | double | The spend limit for the account, from Salesforce |

---

#### Entitlement (`C_ENTITLEMENT`)

**system:** `false`

The system builds each grant record from a CommerceOrderItem through an EntitlementDefinition.

| Field | Type | Notes |
|---|---|---|
| PK `entitlementId` | long | |
| FK `entitlementDefinitionId` | long | |
| FK `orderItemId` | long | Parent CommerceOrderItem that grants this entitlement |
| FK `contractId` | long | Denormalized for a fast lookup |
| FK `projectId` | long | The project that scopes the grant (`projectToEntitlement`). The custom field `salesforceProjectId` on the order supplies it. An order with no project leaves it empty |
| FK `usageDefinitionId` | long | For metered entitlements |
| `name` | string | e.g. `database-size` · `vcpu` · `maxServers` · `licenseGeneration` |
| `grantType` | string | `fixed` · `rollover` · `prepaid` · `metered` |
| `quantity` | double | The soft limit. The system alerts at this level. The field `sizing` overrides it where `sizing` applies |
| `maxQuantity` | double | The hard limit. The system blocks at this level |
| `startDate` | datetime | |
| `endDate` | datetime | |

The `endDate` is the effective end of the grant. After a realignment amendment, the `endDate` can be earlier than the frozen `endDate` of the CommerceOrderItem that grants the entitlement. In that case the `endDate` equals the `effectiveEndDate` of that item. A realignment shows through the dates alone that a new grant replaces an old grant. No status changes when the system processes a realignment.

---

#### EntitlementDefinition (`C_ENTITLEMENT_DEFINITION`)

**system:** `false`

This object is the template for an entitlement on a SKU. One SKU has many EntitlementDefinitions. When the system creates a CommerceOrderItem for a SKU, it generates 1 Entitlement for each active EntitlementDefinition of that SKU.

| Field | Type | Notes |
|---|---|---|
| PK `entitlementDefinitionId` | long | |
| `externalReferenceCode` | string | e.g. `dxp-cloud-standard-database-size` |
| `skuExternalReferenceCode` | string | The ERC of the SKU that grants the entitlement (Salesforce `Product2.Id`). This is a text field, because CPInstance has no system object definition |
| `name` | string | e.g. `database-size`, `vcpu`, `maxServers`, `licenseGeneration` |
| `displayName` | string | Human-readable, e.g. `Database Storage`, `License Generation` |
| `unit` | string | GB · vCPU · count · requests · seats · boolean |
| `defaultQuantity` | double | The default. The `sizing` field on the order item overrides it |
| `grantType` | string | `fixed` · `rollover` · `metered` · `prepaid` |
| FK `usageDefinitionId` | long | Nullable. Only a metered entitlement or a usage entitlement uses it |
| `productOptions` | string | A JSON map of the option keys and the option values of a SKU. The order item must carry these pairs before this definition applies. An empty map matches every order item |
| `active` | boolean | The default is `true`. Set it to `false` to deprecate the definition and keep the record |

**License generation:** An EntitlementDefinition with `name = 'licenseGeneration'` (`grantType = fixed`, `unit = boolean`) shows that the product can generate license keys. This definition replaces the earlier boolean flag `licenses` on a product.

---

#### InvoiceRequest (`C_INVOICE_REQUEST`)

**system:** `false`

| Field | Type | Notes |
|---|---|---|
| PK `invoiceRequestId` | long | |
| FK `subscriptionId` | long | |
| `type` | string | |
| `status` | string | |
| `requestedAt` | datetime | |

---

#### UsageDefinition (`C_USAGE_DEFINITION`)

**system:** `false`

> Architecture documents also call this object `ConsumptionMetric`.

| Field | Type | Notes |
|---|---|---|
| PK `usageDefinitionId` | long | |
| `externalReferenceCode` | string | e.g. `storage-gb`, `page-views-monthly` |
| `unit` | string | e.g. GB, page views, vcpu, AI tokens |
| `aggregationType` | string | count / sum. This field replaces `aggregation`. The name `aggregation` matches a reserved OData term in Liferay. That match generates an empty column name in the database, and the object then fails to publish with a `CREATE TABLE` syntax error. |
| `period` | string | Per month, day, hour |
| `quantity` | double | Base unit quantity |
| `overageRate` | double | |
| `overageCurrency` | string | USD / EUR / JPY |

---

#### UsageEvent (`C_USAGE_EVENT`)

**system:** `false`

| Field | Type | Notes |
|---|---|---|
| PK `usageEventId` | long | |
| FK `environmentId` | long | |
| FK `subscriptionId` | long | |
| FK `usageDefinitionId` | long | |
| `eventTimestamp` | datetime | |
| `quantity` | double | |
| `dedupeKey` | string | Idempotent. The client assigns it |

---

#### UsageReport (`C_USAGE_REPORT`)

**system:** `false`

This object aggregates the UsageEvents of one period into a report. The target of a report is polymorphic. A report can aggregate at the level of a project, a contract, an order, or an environment. The fields `targetType`, `targetClassName`, and `targetPK` express the target, as the `Property` object does.

The relationships `usageDefinitionToUsageReport` and `projectToUsageReport` give the primary foreign keys for the aggregation. A usage report is a child of the project it belongs to. The dashboard has the scope of a project, and `projectToContract` reaches the contract in 1 step.

The field `commerceOrderId` is a denormalized plain field, and not a foreign key of a relationship. It holds the separate overage order that this report generated, and it gives an audit trail. This field is a plain field, and not a `usageReportToCommerceOrder` relationship, for a reason. A navigable edge into the system CommerceOrder object makes a cycle in the OData entity model for object entries. The cycle throws `IllegalArgumentException: Name is null`. Every `/o/c/...` endpoint that embeds the object then returns a 500 response, for projects and for contracts.

**Consumption-based billing workflow (E24 / LPD-88265).** `UsageReportService` runs on the first day of every month. The service is in `liferay-one-etc-spring-boot`, and the `@Scheduled` cron `liferay.one.usage.report.cron` starts it. The service queries the datawarehouse for the metered consumption of the previous month. The datawarehouse is a mock today. The service compares the usage of each metered entitlement against the allotment of that entitlement. The service records each overage as a UsageReport in the `readyForReview` state.

`reviewStatus` is a picklist **state field** (`Ready for Review` → `Approved` · `Completed`). The list type `LT_USAGE_REPORT_REVIEW_STATUS` backs it. A reviewer works on the reports in the admin UI of Liferay Objects.

A reviewer sets a report to `Approved` when the account needs an invoice. That change fires the `UsageReportApproved` `onAfterUpdate` object action, which calls `ObjectActionUsageReportApprovedRestController`. The controller creates the separate overage commerce order. The order line is `overageQuantity` × the `overageRate` of the UsageDefinition. The controller writes the id of that order back to `commerceOrderId`. The controller then pushes the order to Salesforce as an opportunity, as the flow that purchases AI Hub tokens does.

A reviewer sets a report to `Completed` when the account needs no invoice. This state is terminal and creates nothing.

The controller is idempotent. It does nothing unless `reviewStatus` is `approved` and `commerceOrderId` is empty. The report holds the denormalized fields `accountExternalReferenceCode`, `contractExternalReferenceCode`, and `skuExternalReferenceCode`. These fields let the object action build the order without a traverse of the relationships over headless.

| Field | Type | Notes |
|---|---|---|
| PK `usageReportId` | long | |
| FK `usageDefinitionId` | long | Via `usageDefinitionToUsageReport` relationship |
| FK `projectId` | long | Via `projectToUsageReport` relationship |
| `reviewStatus` | string | State picklist: `readyForReview` · `approved` · `completed` (`LT_USAGE_REPORT_REVIEW_STATUS`) |
| `commerceOrderId` | long | A denormalized link to the generated overage order, for audit. It is not a foreign key of a relationship |
| `accountExternalReferenceCode` | string | Denormalized. The approved action uses it to build the order |
| `contractExternalReferenceCode` | string | Denormalized. The approved action uses it to build the order |
| `skuExternalReferenceCode` | string | Denormalized. The overage order bills this product SKU |
| `aggregateQuantity` | double | The quantity that the period consumed |
| `entitledQuantity` | double | The quantity that the period allots |
| `overageQuantity` | double | `aggregateQuantity − entitledQuantity` |
| `overageAmount` | double | The billed amount: `overageQuantity` × the `overageRate` of the UsageDefinition |
| `overageCurrency` | string | USD / EUR / JPY, from the UsageDefinition |
| `targetType` | string | `project` · `contract` · `order` · `environment` |
| `targetClassName` | string | The denormalized class name of the target of the report |
| `targetPK` | long | The PK of the target instance of the report |
| `generatorClassName` | string | |
| `generatedAt` | datetime | |
| `dateFrom` | datetime | |
| `dateTo` | datetime | |

---

### Environment Management

#### Environment (`C_ENVIRONMENT`)

**system:** `false`

| Field | Type | Notes |
|---|---|---|
| PK `environmentId` | long | |
| FK `subscriptionId` | long | FK to Contract |
| `name` | string | The environment reports this name at activation |
| `offering` | string | `AI Hub` · `Analytics Cloud` · `Cloud Native` · `DSR` · `LDP` · `On-Prem` · `PaaS` · `SaaS` |
| `type` | string | `non-production` · `production` · `uat`; cloud only |
| `region` | string | Cloud only; blank for on-prem |
| `disasterRecoveryRegion` | string | Cloud only. The second region for disaster recovery, beside `region` |
| `ownerEmailAddress` | string | Cloud only. The activation collects the owner of the workspace. On SaaS this value is the owner of the Analytics Cloud workspace. It matches `lxc.analyticsCloudOwnersEmailAddress` in Customer Portal |
| `activationMode` | string | `license-key` · `offline` · `online` |
| `status` | string | `active` · `deactivated` · `expired` |
| `lastHeartbeatAt` | datetime | Cloud only |
| `currentEntitlementHash` | string | An identity hash. The heartbeat uses it to detect a change |
| `hostName` | string | On-prem only |
| `domains` | string | On-prem only. The list of the domains that the environment allows |
| `ipAddresses` | longtext | On-prem only |
| `macAddresses` | longtext | On-prem only |
| `serverId` | longtext | On-prem only |

---

#### EnvironmentAdmin (`C_ENVIRONMENT_ADMIN`)

**system:** `false`

| Field | Type | Notes |
|---|---|---|
| PK `environmentAdminId` | long | |
| FK `environmentId` | long | FK to Environment; cascade delete |
| `emailAddress` | string | |
| `firstName` | string | SaaS splits its single "first and last name" input into `firstName` and `lastName` |
| `lastName` | string | |
| `githubUsername` | string | PaaS only; SaaS collects no GitHub username |

> The activation form for PaaS or SaaS nominates the administrators of a project. This object holds 1 row for each administrator. Environment also holds the first administrator in the denormalized fields `adminEmailAddress`, `adminFirstName`, `adminLastName`, and `githubUsername`.

---

#### LicenseKey (`C_LICENSE_KEY`)

**system:** `false`

| Field | Type | Notes |
|---|---|---|
| PK `licenseKeyId` | long | |
| `uuid` | string | The migration keeps this value from Provisioning to trace the record between systems |
| `createdByUserId` | long | FK to User |
| `createdByUserName` | string | Denormalized |
| `createDate` | datetime | |
| `modifiedByUserId` | long | FK to User |
| `modifiedByUserName` | string | Denormalized |
| `modifiedDate` | datetime | |
| FK `accountEntryId` | long | |
| FK `projectId` | long | Nullable. The system sets it when the key has the scope of a project. Otherwise the key has the scope of an account |
| FK `entitlementId` | long | |
| `orderId` | long | FK to CommerceOrderItem via `assetReceiptLicenseUuid` |
| `entitlementName` | string | The name of the attached entitlement |
| FK `CProductId` | long | |
| `accountEntryCode` | string | Denormalized |
| `accountEntryName` | string | Denormalized |
| `licenseName` | string | The migration copies this value from LicenseEntry |
| `licenseType` | string | `production` · `cluster` · `developer` · `enterprise` · `oem` · `per-user` · `limited` · `virtual-cluster` · `free` · `developer-cluster` |
| `licenseVersion` | int | |
| `productName` | string | Denormalized from CProduct |
| `productExternalId` | string | UUID-format product ID |
| `productVersion` | string | e.g. `7.4`, `2026.Q1` |
| `productVersionLabel` | string | Human-readable version label |
| `clusterId` | long | |
| `owner` | string | |
| `maxServers` | int | |
| `maxConcurrentUsers` | long | |
| `maxUsers` | long | |
| `maxHttpSessions` | int | |
| `maxClusterNodes` | int | |
| `sizing` | string | The system copies this value from CommerceOrderItem to generate the license |
| `name` | string | |
| `description` | string | |
| `licenseKey` | longtext | The XML payload of the license key |
| `startDate` | datetime | |
| `customExpirationDate` | datetime | |
| `additionalInfo` | longtext | |
| `complimentary` | boolean | |
| `active` | boolean | |

---

### Other

#### Property (`C_PROPERTY`)

**system:** `false`

| Field | Type | Notes |
|---|---|---|
| `accountEntryId` | long | |
| `classNameId` | long | e.g. classNameId of CommerceOrderItem, AccountEntry |
| `className` | string | Denormalized, e.g. `CommerceOrderItem` |
| `classPK` | long | The PK of the target instance of the entity |
| `name` | string | e.g. `koroneikiAccountKey`, `nonProductionSubscriptionUuid` |
| `value` | string | e.g. `12345-abcde` |
| `metadataJson` | text | The metadata as JSON |

> A Property row stores each reference to an external system. The earlier object was `ExternalLink`. The row sets `name = '{domain}:{entityName}'` and `value = entityId`.

---

## ERC and FriendlyURL Registry

| Object | ERC | Separator |
|---|---|---|
| `AccountFlag` | `C_ACCNT_FLAG` | `cpaf` |
| `AccountNote` | `C_ACCNT_NOTE` | `l` |
| `BannedEmailDomain` | `C_BANNED_EMAIL` | `cpbd` |
| `Contract` | `C_CONTRACT` | `cpct` |
| `CreditHold` | `C_CREDIT_HOLD` | `cpch` |
| `Entitlement` | `C_ENTITLEMENT` | `cpen` |
| `EntitlementDefinition` | `C_ENTITLEMENT_DEFINITION` | `cped` |
| `Environment` | `C_ENVIRONMENT` | `cpdp` |
| `EnvironmentAdmin` | `C_ENVIRONMENT_ADMIN` | `l` |
| `InvoiceRequest` | `C_INVOICE_REQUEST` | `cpir` |
| `LicenseKey` | `C_LICENSE_KEY` | `cplk` |
| `Property` | `C_PROPERTY` | `cppr` |
| `UsageDefinition` | `C_USAGE_DEFINITION` | `cpud` |
| `UsageEvent` | `C_USAGE_EVENT` | `cpue` |
| `UsageReport` | `C_USAGE_REPORT` | `cpur` |

---

## See Also

- [`workspace.md`](./workspace.md) — the layout of the workspace and the client extensions