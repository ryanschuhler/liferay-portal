# Data Access

Almost every read in this workspace is a network call. `liferay-one-custom-element` sends a headless API request. `liferay-one-etc-spring-boot` calls Liferay, Salesforce, or Jira.

An inefficient read costs more than processor time. It produces a page that takes eight seconds to load, or a synchronizer that sends four thousand requests in place of forty.

These rules are about the *shape* of a read. They apply to both lanes: the migration scripts in the sibling `scripts` checkout hit the same APIs, over far more records.

In `liferay-one-custom-element`, the filter, pagination, and raw-fetch rules below are enforced by `yarn lint` — see [`custom-element-safety.md`](./custom-element-safety.md).

## One Record Means One Row

When exactly one record is expected, the query must ask for one. Never fetch a page and index into it.

```ts
// Wrong — pulls every placed order to look at the newest one
const {items} = await HeadlessCommerceDeliveryOrder.getPlacedOrders(
	channelId,
	accountId
);

const order = items[0];

// Correct — filter server-side, ask for one row
const parameters = new URLSearchParams({
	filter: SearchBuilder.eq('orderTypeExternalReferenceCode', 'AI_HUB'),
	pageSize: '1',
});

const {items} = await HeadlessCommerceDeliveryOrder.getPlacedOrders(
	channelId,
	accountId,
	parameters
);
```

Per stack:

| Stack | One-row read |
| --- | --- |
| Headless REST | `pageSize=1` plus a `filter`, or a `by-external-reference-code` endpoint when one exists |
| OData filters | Build with `SearchBuilder` — never hand-concatenate a filter string |
| Spring Boot Java | The same `pageSize=1` query parameter on the outbound URI |
| `scripts` local SQLite store | `LIMIT 1` on the statement, read with `.get()` rather than `.all()` |

Indexing `[0]` is fine on a collection you already had to fetch in full — `postalAddresses.items.find((address) => address.primary) ?? postalAddresses.items[0]` picks a fallback out of an account's addresses, which is not a query at all. The rule targets fetching a page *in order to* take one element.

## No Service Call Inside A Loop

A loop that calls a service per item is the most common performance defect here. It turns one round trip into N, and N is usually a page size someone will raise later.

```ts
// Wrong — one request per order
for (const order of orders) {
	const account = await HeadlessAdminUser.getAccount(order.accountId);
	...
}

// Correct — one request, then a local lookup
const {items: accounts} = await HeadlessAdminUser.getAccounts(
	new URLSearchParams({
		filter: SearchBuilder.in('id', orders.map((order) => order.accountId)),
		pageSize: '-1',
	})
);

const accountsById = new Map(accounts.map((account) => [account.id, account]));
```

There are two corrections. The first is a filter that reads the whole set in one call. The second is a batch endpoint. Use a loop only when the API offers neither. A loop without that explanation looks like a mistake to the next reader.

This is not in tension with the one-row rule above. Fetching a page is right when you need every element of it and wrong when you need one.

## Hoist What Does Not Change

Move every value that does not change between iterations above the loop. Five examples are an OAuth2 authorization header, a resolved channel ID or object type ID, a compiled `RegExp`, a `DateTimeFormatter`, and a constant request body.

A new authorization token for each item is the most costly form of this error. A local helper that looks inexpensive sends one extra network call for each item.

## Nested Scans Become Map Lookups

Two loops over one collection take `O(n²)` time. Build a `Map` or a `Set` one time, then read from it in a single pass. At forty records the difference is small. The migration scripts run this code over hundreds of thousands of records.

## Bound Every Pagination

`pageSize=-1` is correct for a fixed reference set, such as the countries, the currencies, or the roles on one account.

`pageSize=-1` is incorrect for a collection with company scope that grows: the accounts, the orders, the license keys, and the tickets. That collection grows with the customer data until the request times out.

For a growing collection, request one page and set a limit on the total. In the scripts repository, extend `PaginationRun` and let it request each page.

Never pass a user-supplied page size straight through to an outbound request.

## Serial Awaits That Could Overlap

Independent requests should not queue behind each other.

```ts
// Wrong — two round trips, serially, for unrelated data
const account = await HeadlessAdminUser.getAccount(accountId);
const orders = await HeadlessCommerceDeliveryOrder.getPlacedOrders(channelId);

// Correct
const [account, orders] = await Promise.all([
	HeadlessAdminUser.getAccount(accountId),
	HeadlessCommerceDeliveryOrder.getPlacedOrders(channelId),
]);
```

Run two requests at the same time only when neither request depends on the other. Do not start a list of writes this way when the list has no limit. The server then rate-limits the requests, or it applies them in an order that no rule sets.