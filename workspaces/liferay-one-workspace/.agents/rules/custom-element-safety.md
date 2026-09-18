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

The rule reads two shapes. The first shape is a template literal that a `filter` property holds. The second shape is a template literal that closes an OData operator with a quote, as in `` `name eq '${value}'` ``, wherever that literal appears. The second shape matters because five filters in this app were built inside a GraphQL string or inside a URL, and the first shape does not reach them.

## Pagination Is Bounded

`pageSize: '-1'` requests every row. This is correct for a fixed reference set, such as the countries, the currencies, or the roles on one account.

This is incorrect for a collection with company scope. That collection grows with the customer data until the request times out.

Request one page and set a limit on the total. If the set is fixed, import `ALL_ROWS` from `services/fetcher/pagination`. The import states that the set is fixed, and a reviewer can check the statement.

Six reads in this app are scoped to one account by a filter: the members of the account, the projects of the account, the memberships of the account, and the trial extension requests of the account. Each set grows with one customer, not with the customer data of the company, so each one states the claim with `ALL_ROWS`.

The five reads that remain are company scoped, and a limit alone does not correct them. `useOrderMetrics` reads every completed order in the company to add `totalAmount` in the browser. A limit on that read returns a total that is too low, and the dashboard shows a revenue figure that is wrong with no error. The four reads in `useKPI` count the distinct catalogs across every published app, which a limit also makes wrong.

Each of these five needs the server to return the sum or the count. That is an endpoint in `liferay-one-etc-spring-boot`, so these five and the open count for `service-layer-boundary` are blocked on the same work.

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

A variable named `key` is an identity, not a position. It comes from `Object.keys`, from `Object.entries`, or from a field that carries its own key, so the rule does not report it.

Two lists in this app carry no identity of their own. The narrow weekday names repeat, because Sunday and Saturday both read `S`, so that list keys on the number of the day. A business event version carries no id, because the endpoint returns the author, the change, the comment, and the date and nothing else, so that list keys on those three fields together.

The solution detail blocks are the list where the defect reaches a user. A publisher moves a block up, moves it down, or deletes it, and each block holds a form. With the position as the key, React keeps the text of one block on the block that moves into that position. Each block now carries an `id`. The id is written with the block, and a block saved before this change receives an id when the browser reads it, so no stored record needs a change.

## No `as unknown as`

The double cast stops the compiler from checking that the two types are related. The next change to a field name compiles, and then fails when the code runs.

Correct the type instead. Make the DTO wider, add a type guard, or declare the difference that the cast conceals.

The last six casts each concealed a defect, and the compiler reported each defect as soon as the cast went away.

`MarketplaceProduct` held a `Product` and extended a class that holds a `DeliveryProduct`, so it cast the product in and cast it out again. One caller uses the class, and that caller calls one method. The class now holds a `Product` and needs no parent. A `find` call in it carried `as SKU`, which turns an absent SKU into a value that throws on the next line.

`CreateTrialModalForm` declared its own shape for the SWR `mutate` function. The real type is `KeyedMutator`, which passes `undefined` when the cache is empty. The callback read `orders.items` with no guard. The same callback also inserted a `Cart` into a list of `PlacedOrder`, which is a different record, and it ran before the check that the order exists. The form now revalidates after the server provisions the trial, which is what the list needs and what the progress modal already covers.

`FormMultiSelect` built an object that looks like a change event. Its caller declares the shape it wants, so the component declares that same shape.

`UploadedFile` described a file that the browser holds. A package that the server already stores has no `File`, so the type now marks that field optional. Three upload paths then reported that they pass that field to an upload, and each one now guards it.

## Enforcement Ledger

Each rule is a warning until its count is zero. Then change the rule to an error in `tools/eslint-plugin-local/src/index.ts`.

| Rule | Open |
| --- | --- |
| `bounded-pagination` | 5 |
| `no-untranslated-text` | 0 |
| `jsx-a11y/*` | 0 |
| `no-array-index-key` | 0 |
| `no-raw-fetch` | 0 |
| `no-unsafe-type-cast` | 0 |
| `i18n-key-slug` | 0 |
| `no-direct-web-storage` | 0 |
| `odata-filter-via-search-builder` | 0 |
| `no-unsanitized-html` | 0 |
| `no-timezone-naive-date` | 0 |

Each rule at zero is an error. Each other rule stays a warning until its count is zero.

`eslint-plugin-jsx-a11y` enforces accessibility. `.eslintrc.js` reads the plugin's own recommended list, so a rule that the plugin adds arrives with it.

The plugin writes a rule in that list as a bare severity, or as an array of a severity and its options. Read the severity out of the array, and keep the options. The first version of this code compared the array to the string `off`, which is never equal, so it turned on the three rules that the plugin ships off and dropped the options of each one. `control-has-associated-label` was one of the three, and its options exclude `input`, `textarea`, and `tr`. It then reported seven elements that the plugin excludes, and each of the seven already had a label.

`utils/apiUtils.ts` held 38 of the original 42 violations. That file is deleted. Read the note in `custom-element-structure.md` for the reason. The other 4 violations were correct reports. Each one is now a service. The four are the commerce account switch, the ticket attachment delete, and the two calls that the invitation service makes to find its own base URL.

Every rule applies to new code, whatever the count in this table says. The counts only decrease.
