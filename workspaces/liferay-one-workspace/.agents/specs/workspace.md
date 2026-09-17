# Workspace Shell

## Location

`workspaces/liferay-one-workspace/`

## Client Extensions

| Extension | Description |
|---|---|
| `liferay-one-batch` | Imports the Object definitions, the list types, the roles, and other headless resources as a batch |
| `liferay-one-custom-element` | React and TypeScript. Holds every dynamic screen for Marketplace, Support, and Admin |
| `liferay-one-etc-spring-boot` | A Spring Boot REST service for provisioning, for GCS, for Jira, for the generation of licenses, and for the subscriber to Salesforce Pub/Sub |
| `liferay-one-global-css` | The color tokens and the global styles that every page shares |
| `liferay-one-instance-settings` | The secrets and the credentials for external systems. The repository does not hold these values |
| `liferay-one-site-initializer` | One site initializer that serves the page groups for Marketplace, Support, and Admin |

### Site-Initializer Structure

```
liferay-one-site-initializer/
└── site-initializer/
    ├── data-definitions/
    ├── ddm-templates/
    ├── documents/
    ├── fragments/
    │   └── group/liferay-one/
    │       ├── collection.json
    │       ├── fragments/
    │       └── resources/
    ├── layout-page-templates/
    ├── layout-set/
    ├── layouts/
    │   ├── 01_home/
    │   ├── 02_my-account/
    │   ├── 03_support/
    │   ├── 04_marketplace/
    │   ├── 05_admin/
    │   ├── 06_product-purchase/
    │   ├── 06_search/
    │   └── 07_next-steps/
    ├── notification-templates/
    ├── style-books/
    ├── taxonomy-vocabularies/
    ├── asset-list-entries.json
    ├── commerce-channel.json
    ├── expando-columns.json
    ├── expando-values.json
    ├── resource-permissions.json
    └── site-navigation-menus.json
```

A numeric prefix sets the order of the layouts. The page group does not group
them. The `liferay-one-batch` client extension imports the Object definitions,
the roles, and the OAuth2 applications. The site initializer does not import
them.

### Object Names

Write an object name in PascalCase. Give it no prefix: `AccountFlag`, `SupportTicket`, `LicenseKey`.

### Field Names

Write a field name in camelCase. Phrase a boolean field as a question: `internal`, `clustered`, `hasDisasterDataCenterRegion`.

### Friendly URL Separators

A separator is 4 lowercase letters. The letters match the suffix of the ERC. Each separator is unique across every Object in the workspace.

**Exception — `AccountNote` uses `l`**, the default separator of Liferay. This separator stops the generation of a friendly URL. The title field `content` can hold a slash, a newline, or a link. Generation of a friendly URL from such a value throws `MustNotHaveTrailingSlash`.