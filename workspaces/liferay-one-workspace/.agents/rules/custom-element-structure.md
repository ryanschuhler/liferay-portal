# Custom Element Structure

Where a file lives in `liferay-one-custom-element` is the first thing a reader learns about it, and the thing that decays fastest. These rules fix the layout so a name tells you the tier, and the tier tells you what the file is allowed to do.

Most of them are enforced — `yarn lint` for anything a single file can prove, `yarn lint:structure` for the two questions that need the whole import graph. The enforced rules are listed in the ledger at the bottom. Everything else here is a convention a reviewer applies.

This file is about where things live. [`custom-element-safety.md`](./custom-element-safety.md) covers the rules whose failure reaches a user — CSRF, XSS, filter injection, timezone-naive dates.

## The Folders Under `src`

There are nine, and no others:

| Folder | Holds |
| --- | --- |
| `assets/` | Images and icons |
| `components/` | Components more than one page uses |
| `context/` | React contexts more than one page reads |
| `hooks/` | Hooks more than one page calls |
| `i18n/` | Language files |
| `pages/` | One folder per top level page |
| `schemas/` | Zod schemas, one file per domain |
| `services/` | Everything that talks to a server |
| `types/` | Types, interfaces, and enums |
| `utils/` | Plain functions |

Folders that used to exist, and where their contents went:

- `enums/` → `types/`. An enum is a type. There is no separate tier for it.
- `models/` → `services/models/`. A model wraps a service payload, so it belongs with the services that return it.
- `schema/` → `schemas/`. Every other folder is plural.
- `hooks/data/` → `hooks/`. Hooks are flat. A hook that reads data is still a hook.

Two of those moves landed beside a file that already owned the name, so the enums kept a suffix rather than merging: `types/accountEnums.ts` and `types/productEnums.ts`. That is not the end state. `types/product.ts` declares `ProductType` as a union of string literals while `types/productEnums.ts` declares the same name as a const object over the same values, and different files import whichever one they found first. `AccountRoleType` is worse — the two declarations carry **different value sets**, so the name means two things depending on the import. Reconciling them changes behavior at every call site and needs its own ticket; merging the files before that is done would only hide it.

## Services

`services/` is the only place that talks to a server. Nothing outside it imports `fetcher` — `main.tsx` is the one exception, and only to hand the fetcher to SWR.

### Reads Go Direct, Writes Go Through Spring Boot

A read may call Liferay directly from `services/headless/`, `services/objects/`, or `services/commerce/`.

A write — POST, PUT, PATCH, DELETE — goes through `services/spring-boot/`, so the mutation is server mediated and the permission check does not live in the browser.

```ts
// Wrong — a write in the headless tier.
// src/services/headless/HeadlessAdminUser.ts
static async deleteRoleAccountUser(accountId, roleId, userId) {
	return fetcher.delete(`/o/headless-admin-user/v1.0/...`);
}

// Correct — the read stays here.
static async getAccount(accountId) {
	return fetcher<Account>(`/o/headless-admin-user/v1.0/accounts/${accountId}`);
}
```

The write moves to `services/spring-boot/Accounts.ts` and calls the Spring Boot endpoint that performs it.

### GraphQL Is The Default

Prefer GraphQL. It returns the fields the caller asked for in one round trip, which is what most of these screens need. Reach for a REST service when GraphQL cannot express the call — a mutation, a file upload, an endpoint with no GraphQL surface.

There is exactly one GraphQL client: `services/graphql/GraphQL.ts`. Import that one.

### The Service Tiers

- `services/actions/` — write orchestration. A publish that touches a catalog, a price list, and an asset in sequence is an action, not a service method.
- `services/commerce/` — commerce reads.
- `services/fetcher/` — transport: the fetcher, its error type, the SWR cache, and the query string builders (`SearchBuilder`, `CreateFilters`). A query builder is a transport concern, not a generic helper, which is why it is not in `utils/`.
- `services/graphql/` — the GraphQL client.
- `services/headless/` — Liferay headless reads.
- `services/liferay/` — the `Liferay` global and its wrappers.
- `services/models/` — classes that wrap a service payload and expose derived fields.
- `services/objects/` — Liferay Object reads.
- `services/spring-boot/` — every write, and everything the Spring Boot client extension serves.

A service file is named for the URL it targets, per [`naming.md`](./naming.md).

## Pages

Every top level page under `src/pages/` owns its routes:

```
pages/MyAccount/
	MyAccount.tsx           the page
	MyAccountRouter.tsx     what main.tsx lazy loads
	myAccountRoutes.tsx     the route table, once there is more than one route
	components/             components only this page uses
	hooks/                  hooks only this page calls
	AccountDetails/         a route, in its own folder
```

`main.tsx` registers one router per page, and every page now has one.

A folder under `src/pages/X` is either a route or a component. A route sits directly under the page. A component goes in `components/`, however deep:

```
# Wrong — a button is not a route
pages/MyAccount/AccountDetails/SyncToJSMButton/SyncToJSMButton.tsx

# Correct
pages/MyAccount/AccountDetails/components/SyncToJSMButton/SyncToJSMButton.tsx
```

`AccountSelector` is a page, not a component: it has a router and `main.tsx` mounts it at the `account-selector` route.

## No Index Files, No Catch-All Files

`index.tsx` tells a reader nothing. Name a file after what it exports; a page is entered through its router.

`utils.ts` and `types.ts` become folders, with one named file per concern:

```
# Wrong
pages/ProductPurchase/types.ts

# Correct
pages/ProductPurchase/types/PaymentMethod.ts
pages/ProductPurchase/types/PurchaseStep.ts
```

A file whose name matches its folder matches its casing too — `Projects/Projects.ts`, never `Projects/projects.ts`.

## One File, One Job

A module is capped at 400 lines and 12 hook calls. Neither number is sacred; both are the point at which a file has stopped doing one thing. Split along the seam the file already has — a sub-component, a hook, the service call it wraps. Language files and tests are exempt: one is data, the other grows with what it covers.

Modules must not import each other in a cycle. A cycle is not a style problem: whichever module in the ring loads first sees the others half-initialized, so a constant read at module scope is `undefined` in a way that depends on which entry point ran. `yarn lint:imports` reports the rings, and the same pass reports exports nothing imports.

Only a value import can form one. `import type` is erased before the code runs, and so is a dynamic `import('...')`, which is deferred. Almost every ring this app had was a child component importing its parent's props type with a value import — `import type` is the whole fix. The exception is an enum, which is a real runtime value however type-like it reads: `RequestAccountStep` had to move out of the parent into a module both sides could import.

## Components

`src/components/` is for what more than one page shares. A component only one page reaches belongs under that page, where a reader looking at the page can see it — that is where `AppPublish` and the `AppReview*` family belong, since only `PublisherDashboard` reaches them.

The reverse holds too. A component nested under one page that a second page has started importing is shared now, and belongs in `src/components/` before a third page copies it.

Neither direction is visible in a single file, so `yarn lint:placement` walks the import graph and reports both.

## Contexts

A context lives in a `context/` folder — `src/context/` when more than one page reads it, otherwise beside the page or component that owns it. The file is named `<Name>ContextProvider.tsx`, one suffix across the app:

```
# Wrong
context/AccountContext.tsx
context/MarketplaceContextProvider.tsx

# Correct
context/AccountContextProvider.tsx
context/MarketplaceContextProvider.tsx
```

## Hooks

A file in a `hooks/` folder exports hooks and nothing else, and each one calls a hook. A file that exports a query string builder beside its hook is two things; move the builder to `utils/` or to the service that owns the endpoint. A file that calls no hook at all is a plain function and was never a hook.

## Language Keys

Every substitution in a key is written `x`, however many there are — never `y`, `z`, or a number:

```ts
// Wrong
'includes-x-add-on-buckets-y-on-top-of-the-z-base-allotment-per-month':
	'Includes {0} add-on buckets (+{1}) on top of the {2} base allotment per month.',

// Correct
'includes-x-add-on-buckets-x-on-top-of-the-x-base-allotment-per-month':
	'Includes {0} add-on buckets (+{1}) on top of the {2} base allotment per month.',
```

A key is a lowercase kebab-case slug and carries no punctuation — the English text is the value, not the key:

```ts
// Wrong
'need-help-getting-started?': 'Need help getting started?',

// Correct
'need-help-getting-started': 'Need help getting started?',
```

User-facing text is never written inline. A literal in `alt`, `aria-label`, `label`, `placeholder`, or `title`, or as visible JSX text, is invisible to every locale but English — give it a key and call `translate()`.

## No Comments

The code says what it does. A comment restating it goes stale the moment the code moves, and the two then disagree with no way to tell which is right. `local/no-comments` is an error and auto-fixes, and it covers `//`, `/* */`, and the JSX `{/* */}` form. The only comment that survives is the SPDX licence header. Stylesheets are held to the same rule by stylelint's `comment-pattern`.

What to do instead of a comment: name the thing. A condition that needed explaining becomes a named boolean, a magic value becomes a named constant, a block that needed a heading becomes a function whose name is that heading. A test says what an edge case is for better than a sentence above it does.

The exception the rule cannot see is a constraint that spans files — two copies of a stylesheet that must stay in sync, and why. Nothing in either file can express that, which is why the three CSS comments left in the tree are warnings rather than errors.

## Never Silence The Linter

`// eslint-disable` is not a fix. Give the value a real type instead of `any`, move the file so it satisfies the structure rule, or raise the rule itself for discussion and change it for everyone.

## Dead Code Is Deleted, Not Moved

`yarn lint:imports` reports every export nothing imports. A file that only its own dead neighbours import is dead too, however large and however plausible it looks — `utils/apiUtils.ts` was 650 lines of commerce API calls reached only from `utils/publishUtils.ts`, whose own three consumers wanted two helpers that already existed elsewhere. Neither file had a live caller. Check what imports a module before rewriting it; the answer is sometimes nothing.

Reachability has to count `import('...')` as well as `from '...'`, or every lazy loaded page looks dead — that form is how `main.tsx` and every routes file reach their pages. Cycles are the opposite: a dynamic import is deferred and orders nothing, so only static edges can form the ring that leaves a module half-initialized. `check-imports.js` reads both and uses each for the question it answers.

## Dependencies

`yarn lint:deps` reconciles `package.json` against what the source imports. It reports a dependency nothing imports, and an import nothing declares — the second is the dangerous one, since it resolves today only because a transitive dependency happens to hoist it, and breaks the moment that package moves.

A package that is genuinely used without being imported — a peer range, a build plugin, a type package — goes in the script's `IMPLICITLY_USED` list with the reason.

## Enforcement Ledger

The workspace has not been cleaned up yet, so every structural rule is `warn`. The counts below are the outstanding work. Flip a rule to `error` in `tools/eslint-plugin-local/src/index.ts` as soon as its count reaches zero, so it cannot come back.

| Rule | Open |
| --- | --- |
| `yarn lint:imports` dead exports | 332 |
| `service-layer-boundary` | 63 |
| `yarn lint:placement` | 38 |
| `file-complexity-budget` | 34 |
| `hooks-export-only-hooks` | 20 |
| `no-eslint-disable` | 4 |
| `yarn lint:imports` cycles | 0 |
| `page-folder-structure` | 0 |
| `no-bare-utils-or-types-file` | 0 |
| `src-folder-structure` | 0 |
| `context-file-naming` | 0 |
| `i18n-key-placeholder` | 0 |
| `yarn lint:deps` | 0 |
| `yarn lint:sorted` | 0 |

New code is held to the rule regardless of the ledger. The counts only go down.
