# Custom Element Safety

These rules apply to `liferay-one-custom-element`. Each rule prevents a failure that a user sees. A write loses its authorization with no error. A name from Salesforce renders as markup. A filter matches the wrong rows. A date saves as the day before the user picked.

`code-style.md` and `data-access.md` state most of these rules in prose. This file records which rules the linter enforces, and why.

## Every Liferay Call Goes Through The Fetcher

A call to `fetch()` against a Liferay URL is a defect. The shared fetcher in `services/fetcher/` does two things that a direct call does not do:

- The fetcher attaches `x-csrf-token`. The portal rejects a write that has no token.
- The fetcher converts a failed response into a `FetcherError`. Without the fetcher, a failed read returns as if it succeeded, and the caller renders `undefined`.

```ts
// Wrong. The call sends no CSRF token, and a 403 returns as a success.
const response = await fetch(`${baseURL}/o/c/contactsaleses/`, {headers, method: 'GET'});

// Correct. The call goes through the service that owns the URL.
return fetcher<ContactSales>('/o/c/contactsaleses/');
```

A direct `fetch` to an external URL is correct, and the rule permits it. One example is a Google Cloud Storage upload session. The rule reports only same-origin calls to a `/o/` path.

## Anything Rendered As HTML Is Sanitized

`dangerouslySetInnerHTML` takes `DOMPurify.sanitize(...)`. There is no exception, and a translated string is not an exception. `i18n.sub` and `translate` insert their arguments without any change. This code is unsafe:

```tsx
// Wrong. The DOM reads the account name as markup.
<div dangerouslySetInnerHTML={{__html: i18n.sub('x-available-for-you', [accountName])}} />

// Correct
<div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(i18n.sub('x-available-for-you', [accountName]))}} />
```

The code permits cross-site scripting when the name comes from Salesforce, Jira, Koroneiki, or Marketplace. Every account name, project name, and product name in this app comes from one of those four systems.

## Filters Are Built, Not Concatenated

A value that you insert into an OData filter becomes part of the query. An ID or a name that contains a quote changes which rows the query matches:

```ts
// Wrong
filter: `r_accountEntryToProject_accountEntryId eq '${accountId}'`

// Correct
filter: SearchBuilder.eq('r_accountEntryToProject_accountEntryId', accountId)
```

`SearchBuilder` escapes the value. Use `.eq`, `.contains`, `.lambda`, and `.in`. No other code builds a filter.

## Pagination Is Bounded

`pageSize: '-1'` requests every row. This is correct for a fixed reference set, such as the countries, the currencies, or the roles on one account.

This is incorrect for a collection with company scope. That collection grows with the customer data until the request times out.

Request one page and set a limit on the total. If the set is fixed, import `ALL_ROWS` from `services/fetcher/pagination`. The import states that the set is fixed, and a reviewer can check the statement.

## Dates From A Picker Are Timezone Naive

JavaScript reads a plain `yyyy-MM-dd` string as **midnight UTC**. `new Date(value).toISOString()` therefore moves the day back by one in every timezone behind UTC, which includes all of the Americas. The user picks the 15th. The code saves the 14th.

```ts
// Wrong
return value ? new Date(value).toISOString() : undefined;

// Correct. Local noon keeps the calendar day in every timezone.
return value ? new Date(`${value}T12:00:00`).toISOString() : undefined;
```

## Web Storage Goes Through The Storage Service

Read and write `localStorage` and `sessionStorage` through `MarketplaceStorage` in `services/liferay/`. `MarketplaceStorage` owns the key names. It also returns a value when the browser refuses storage. A direct read throws an error in a private window, and the component fails to render.

## The Array Index Is Not A Key

`key={index}` connects the component state to a position in the list, not to an item. When you remove an item, or when you change the order, React keeps the old state on the item that moves into that position. A checked row stays checked. An input keeps the text that the user typed into a different row.

Use an `id`, an `externalReferenceCode`, or another value that is unique in the list.

## No `as unknown as`

The double cast stops the compiler from checking that the two types are related. The next change to a field name compiles, and then fails when the code runs.

Correct the type instead. Make the DTO wider, add a type guard, or declare the difference that the cast conceals.

## Enforcement Ledger

Each rule is a warning until its count is zero. Then change the rule to an error in `tools/eslint-plugin-local/src/index.ts`.

| Rule | Open |
| --- | --- |
| `no-untranslated-text` | 26 |
| `no-array-index-key` | 15 |
| `bounded-pagination` | 11 |
| `jsx-a11y/*` | 8 |
| `no-unsafe-type-cast` | 6 |
| `no-raw-fetch` | 0 |
| `i18n-key-slug` | 0 |
| `no-direct-web-storage` | 0 |
| `odata-filter-via-search-builder` | 0 |
| `no-unsanitized-html` | 0 |
| `no-timezone-naive-date` | 0 |

Each rule at zero is an error. Each other rule stays a warning until its count is zero.

`eslint-plugin-jsx-a11y` enforces accessibility. The plugin ships its recommended rules as errors. `.eslintrc.js` reads the plugin's own rule list and sets each rule to a warning, so that the team can reduce the count. This method stays correct when the plugin adds a rule.

`utils/apiUtils.ts` held 38 of the original 42 violations. That file is deleted. Read the note in `custom-element-structure.md` for the reason. The other 4 violations were correct reports. Each one is now a service. The four are the commerce account switch, the ticket attachment delete, and the two calls that the invitation service makes to find its own base URL.

Every rule applies to new code, whatever the count in this table says. The counts only decrease.
