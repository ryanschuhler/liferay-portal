# Custom Element Safety

Seven rules in `liferay-one-custom-element` that are not about taste. Each one has a failure that reaches a user: a write that silently loses its authorization, a name from Salesforce that renders as markup, a filter that matches the wrong rows, a date that saves as the day before.

`code-style.md` and `data-access.md` already state most of these in prose. This file records what is now enforced, and why the linter will not take a judgment call for an answer.

## Every Liferay Call Goes Through The Fetcher

`fetch()` against a Liferay URL is a defect, not a shortcut. The shared fetcher in `services/fetcher/` does two things a raw call does not:

- attaches `x-csrf-token`, without which a write is rejected by the portal, and
- turns a non-OK response into a `FetcherError`, without which a failed read resolves as though it worked and the caller renders `undefined`.

```ts
// Wrong — no CSRF token, and a 403 resolves quietly
const response = await fetch(`${baseURL}/o/c/contactsaleses/`, {headers, method: 'GET'});

// Correct — through the service that owns the URL
return fetcher<ContactSales>('/o/c/contactsaleses/');
```

A raw `fetch` to a third-party absolute URL — a GCS upload session, say — is fine and the rule does not flag it. Only same-origin `/o/` calls are the defect.

## Anything Rendered As HTML Is Sanitized

`dangerouslySetInnerHTML` takes `DOMPurify.sanitize(...)`, with no exceptions — including a translated string. `i18n.sub` and `translate` interpolate their arguments verbatim, so this:

```tsx
// Wrong — the account name is pasted into the DOM as markup
<div dangerouslySetInnerHTML={{__html: i18n.sub('x-available-for-you', [accountName])}} />

// Correct
<div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(i18n.sub('x-available-for-you', [accountName]))}} />
```

is an XSS vector whenever the name came from Salesforce, Jira, Koroneiki, or Marketplace — which is where every account, project, and product name in this app comes from.

## Filters Are Built, Not Concatenated

A value interpolated into an OData filter is a value pasted into a query. An ID or a name carrying a quote changes which rows match:

```ts
// Wrong
filter: `r_accountEntryToProject_accountEntryId eq '${accountId}'`

// Correct
filter: SearchBuilder.eq('r_accountEntryToProject_accountEntryId', accountId)
```

`SearchBuilder` escapes the value. Use `.eq`, `.contains`, `.lambda`, and `.in`; nothing else builds a filter.

## Pagination Is Bounded

`pageSize: '-1'` asks for every row. That is correct for a fixed reference set — countries, currencies, the roles on one account — and a time bomb on anything company scoped, where the set grows until the request times out.

Paginate and cap the total, or say in a comment why the set is bounded.

## Dates From A Picker Are Timezone Naive

A bare `yyyy-MM-dd` parses as **UTC midnight**, so `new Date(value).toISOString()` shifts the day backward by one in every UTC-negative timezone — all of the Americas. The user picks the 15th and the 14th is saved.

```ts
// Wrong
return value ? new Date(value).toISOString() : undefined;

// Correct — local noon survives any offset
return value ? new Date(`${value}T12:00:00`).toISOString() : undefined;
```

## Web Storage Goes Through The Storage Service

`localStorage` and `sessionStorage` are reached through `MarketplaceStorage` in `services/liferay/`, which owns the key names and survives a browser that refuses storage. A direct read throws in a private window and takes the render down with it.

## No `as unknown as`

The double cast turns off the check that two types have anything to do with each other, so the next field rename compiles and fails at runtime. Fix the type the value actually has: widen the DTO, narrow with a type guard, or model the difference the cast is hiding.

## Enforcement Ledger

Every rule is `warn` until its count reaches zero, then it becomes `error` in `tools/eslint-plugin-local/src/index.ts`.

| Rule | Open |
| --- | --- |
| `no-untranslated-text` | 116 |
| `no-unsafe-type-cast` | 58 |
| `no-raw-fetch` | 42 |
| `bounded-pagination` | 18 |
| `i18n-key-slug` | 15 |
| `odata-filter-via-search-builder` | 9 |
| `no-unsanitized-html` | 9 |
| `no-direct-web-storage` | 8 |
| `no-timezone-naive-date` | 1 |

`no-raw-fetch` is concentrated: `utils/apiUtils.ts` is a whole undeclared service tier, raw `fetch` and hand-built headers against `/o/headless-commerce-*` and `/o/c/*`. Clearing that file clears most of the count and most of `no-unsafe-type-cast` with it.

New code is held to the rule regardless of the ledger. The counts only go down.
