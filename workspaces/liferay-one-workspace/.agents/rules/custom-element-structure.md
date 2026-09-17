# Custom Element Structure

The location of a file in `liferay-one-custom-element` tells a reader what the file does. These rules set the layout. The path gives the tier, and the tier gives the operations that the file may perform.

`yarn lint` enforces each rule that one file can prove on its own. `yarn lint:structure` enforces the two rules that need the full import graph. The table at the end of this file lists every enforced rule. A reviewer applies the other conventions in this file.

This file gives the location of each kind of file. [`custom-element-safety.md`](./custom-element-safety.md) gives the rules that prevent a failure the user sees. Those failures are a missing CSRF token, cross-site scripting, filter injection, and a date that saves one day early.

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

Two of these moves reached a folder that already held a file with the same name. Those two enum files therefore keep a suffix: `types/accountEnums.ts` and `types/productEnums.ts`. This is not the final state.

`types/product.ts` declares `ProductType` as a union of string literals. `types/productEnums.ts` declares the same name as a constant object over the same values. Each file imports the declaration that its author found first.

`AccountRoleType` is a larger problem. The two declarations hold **different value sets**, so the name has two meanings. The meaning depends on the import path.

A merge of these declarations changes the behavior at every call site. That work needs its own ticket. A merge of the files before that ticket is complete conceals the problem.

## Services

Only `services/` calls a server. No file outside `services/` imports `fetcher`. There is one exception: `main.tsx` imports the fetcher to give it to SWR.

### Reads Go Direct, Writes Go Through Spring Boot

A read may call Liferay directly from `services/headless/`, `services/objects/`, or `services/commerce/`.

A write goes through `services/spring-boot/`. A write is a POST, a PUT, a PATCH, or a DELETE. The server then performs the change, and the permission check stays on the server.

```ts
// Wrong. This is a write in the headless tier.
// src/services/headless/HeadlessAdminUser.ts
static async deleteRoleAccountUser(accountId, roleId, userId) {
	return fetcher.delete(`/o/headless-admin-user/v1.0/...`);
}

// Correct. A read belongs in this tier.
static async getAccount(accountId) {
	return fetcher<Account>(`/o/headless-admin-user/v1.0/accounts/${accountId}`);
}
```

The write moves to `services/spring-boot/Accounts.ts` and calls the Spring Boot endpoint that performs it.

### GraphQL Is The Default

Use GraphQL. GraphQL returns the fields that the caller requests, in one request. This is what these screens need.

Use a REST service when GraphQL cannot express the call. Three examples are a mutation, a file upload, and an endpoint that GraphQL does not serve.

There is one GraphQL client: `services/graphql/GraphQL.ts`. Import that client.

### The Service Tiers

- `services/actions/` — write orchestration. A publish operation changes a catalog, then a price list, then an asset. That sequence is an action, not a service method.
- `services/commerce/` — commerce reads.
- `services/fetcher/` — transport. This tier holds the fetcher, its error type, the SWR cache, and the query string builders `SearchBuilder` and `CreateFilters`. A query string builder is part of the transport, not a general helper, so it does not belong in `utils/`.
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
	MyAccountRouter.tsx     the file that main.tsx loads on demand
	myAccountRoutes.tsx     the route table, when the page has two or more routes
	components/             the components that only this page uses
	hooks/                  the hooks that only this page calls
	AccountDetails/         one route, in its own folder
```

`main.tsx` registers one router per page, and every page now has one.

A folder under `src/pages/X` is either a route or a component. A route sits directly under the page. A component goes in `components/`, however deep:

```
# Wrong. A button is not a route.
pages/MyAccount/AccountDetails/SyncToJSMButton/SyncToJSMButton.tsx

# Correct
pages/MyAccount/AccountDetails/components/SyncToJSMButton/SyncToJSMButton.tsx
```

`AccountSelector` is a page. It is not a component. It has a router, and `main.tsx` mounts it at the `account-selector` route.

## No Index Files, No Catch-All Files

The name `index.tsx` gives a reader no information. Name a file after the thing that it exports. A page starts at its router.

`utils.ts` and `types.ts` become folders, with one named file per concern:

```
# Wrong
pages/ProductPurchase/types.ts

# Correct
pages/ProductPurchase/types/PaymentMethod.ts
pages/ProductPurchase/types/PurchaseStep.ts
```

When a file name matches its folder name, the case must match as well. Write `Projects/Projects.ts`. Do not write `Projects/projects.ts`.

## One File, One Job

A module has a limit of 400 lines and 12 hook calls. These two numbers mark the point where a file performs more than one job. Divide the file at a boundary that already exists: a sub-component, a hook, or the service call that the file wraps.

The limit does not apply to a language file or to a test. A language file is data. A test grows with the code that it covers.

Two modules must not import each other in a cycle. A cycle is not a style problem. One module in the cycle loads first, and it reads the other modules before they finish loading. A constant that the module reads at load time is then `undefined`, and the result depends on which entry point ran. `yarn lint:imports` reports each cycle. The same command reports each export that no file imports.

Only a value import creates a cycle. TypeScript removes an `import type` before the code runs. A dynamic `import('...')` runs later, so it also creates no cycle.

Almost every cycle in this app came from one pattern: a child component imported its parent's props type with a value import. `import type` corrects that pattern.

An enum is the exception. An enum is a value at run time, even though it reads like a type. `RequestAccountStep` therefore moved out of the parent, into a module that the parent and the children both import.

## Components

`src/components/` holds the components that two or more pages share.

A component that only one page uses belongs under that page. A reader who opens the page then sees the component. `AppPublish` and every `AppReview*` component belong under `PublisherDashboard`, because only `PublisherDashboard` uses them.

The opposite rule also applies. When a second page imports a component from under another page, that component is now shared. Move it to `src/components/` before a third page copies it.

One file does not show either condition, so `yarn lint:placement` reads the import graph and reports both.

## Contexts

A context belongs in a `context/` folder. Put it in `src/context/` when two or more pages read it. Otherwise put it beside the page or the component that owns it. Name the file `<Name>ContextProvider.tsx`. The app uses this one suffix:

```
# Wrong
context/AccountContext.tsx
context/MarketplaceContextProvider.tsx

# Correct
context/AccountContextProvider.tsx
context/MarketplaceContextProvider.tsx
```

## Hooks

A file in a `hooks/` folder exports only hooks, and each hook calls another hook.

A file that exports a query string builder next to its hook does two jobs. Move the builder to `utils/`, or to the service that owns the endpoint.

A file that calls no hook is a plain function. Move it out of the `hooks/` folder.

## Language Keys

Write every substitution in a key as `x`. This applies to each substitution, whatever the count. Do not write `y`, `z`, or a number:

```ts
// Wrong
'includes-x-add-on-buckets-y-on-top-of-the-z-base-allotment-per-month':
	'Includes {0} add-on buckets (+{1}) on top of the {2} base allotment per month.',

// Correct
'includes-x-add-on-buckets-x-on-top-of-the-x-base-allotment-per-month':
	'Includes {0} add-on buckets (+{1}) on top of the {2} base allotment per month.',
```

A key is a lowercase slug with hyphens between the words. A key carries no punctuation. The English text is the value, not the key:

```ts
// Wrong
'need-help-getting-started?': 'Need help getting started?',

// Correct
'need-help-getting-started': 'Need help getting started?',
```

Do not write user-facing text in the component. A literal string in `alt`, `aria-label`, `label`, `placeholder`, or `title` reaches only an English reader. Visible JSX text reaches only an English reader. Add a key for the string and call `translate()`.

## No Comments

The code states what it does. A comment that repeats the code becomes wrong when a developer changes the code, and a reader cannot tell which one is correct.

`local/no-comments` is an error, and it corrects the file automatically. The rule reports the `//` form, the `/* */` form, and the JSX `{/* */}` form. The rule permits one comment: the SPDX licence header. The stylelint rule `comment-pattern` applies the same limit to a stylesheet.

Write a name instead of a comment. Convert a condition that needs an explanation into a named boolean. Convert a fixed value into a named constant. Convert a block that needs a heading into a function, and use the heading as the function name. A test states the purpose of an edge case more exactly than a sentence above the code.

The rule cannot see one exception: a constraint that covers two files. One example is a pair of stylesheets that must hold the same rules. Neither file can state that constraint in code. The three CSS comments that remain in the repository are therefore warnings, not errors.

## Never Silence The Linter

`// eslint-disable` does not correct a violation. Do one of three things instead. Declare the correct type for the value, in place of `any`. Move the file to the location that the structure rule requires. Or propose a change to the rule, and change it for the whole team.

## Dead Code Is Deleted, Not Moved

`yarn lint:imports` reports every export that no file imports. A file is dead when only other dead files import it. The size of the file does not change this result.

`utils/apiUtils.ts` held 650 lines of commerce API calls. One file imported it: `utils/publishUtils.ts`. Three files imported `utils/publishUtils.ts`, and all three wanted two helpers that already existed in other modules. No live code called either file.

Read the list of importers before you rewrite a module. The list is sometimes empty.

A reachability check must count `import('...')` and `from '...'`. `main.tsx` and every routes file reach their pages through `import('...')`. A check that reads only `from '...'` reports every page as dead.

A cycle check must do the opposite. A dynamic import runs later and sets no load order, so only a static import creates a cycle. `check-imports.js` reads both forms, and it uses each form for the question that it answers.

## Dependencies

`yarn lint:deps` compares `package.json` against the imports in the source. It reports a dependency that no file imports. It also reports an import that `package.json` does not declare.

The second report is the more serious one. The import resolves today because another dependency installs that package. The import fails when that dependency changes its own dependencies.

Some packages are in use but no file imports them. Three examples are a package that satisfies a peer range, a build plugin, and a type package. Add each one to the `IMPLICITLY_USED` list in the script, with the reason.

## Enforcement Ledger

A rule stays a warning while its count is above zero. The counts below give the remaining work. Change a rule to an error in `tools/eslint-plugin-local/src/index.ts` when its count reaches zero. The rule then prevents a new violation.

| Rule | Open |
| --- | --- |
| `yarn lint:imports` dead exports | 332 |
| `service-layer-boundary` | 63 |
| `yarn lint:placement` | 38 |
| `file-complexity-budget` | 34 |
| `hooks-export-only-hooks` | 20 |
| `yarn lint:imports` cycles | 0 |
| `page-folder-structure` | 0 |
| `no-eslint-disable` | 0 |
| `no-bare-utils-or-types-file` | 0 |
| `src-folder-structure` | 0 |
| `context-file-naming` | 0 |
| `i18n-key-placeholder` | 0 |
| `yarn lint:deps` | 0 |
| `yarn lint:sorted` | 0 |

Every rule applies to new code, whatever the count in this table says. The counts only decrease.
