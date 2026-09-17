# Code Style

These rules apply to all code in this workspace. Brian Chan enforces them during PR review — violations are rejected or corrected with a follow-up commit.

## Sort Everything

Lists, arrays, and JSON entries must always be in sorted order. This applies to:

- JSON array items in site initializer files (sort by `externalReferenceCode` or `key`)
- `[#assign ... /]` variable blocks in FreeMarker templates (logical dependency order, then alphabetical)
- Java `import` statements (already handled by source formatter)
- Entries in configuration files
- Method and constructor parameter lists, in alphabetical order by parameter name. A change to the order of a signature changes the order of the arguments at every call site.

	The compiler reports a missed call site only when the types differ. When two reordered parameters share a type, the code compiles and the arguments reach the wrong parameters. Read each call site against the new order. A successful build does not prove that the call sites are correct.

	This example shows the case that the compiler cannot report: `notify(String message, String recipient)` becomes `notify(String recipient, String message)`.

When Brian sees items out of order, he comments `"sort"` and bounces the PR back.

`yarn lint:sorted` enforces this on the batch definitions, and `yarn lint` now covers `liferay-one-batch` for duplicate and unsorted object keys.

### Order-Bearing Arrays Are Not Sorted

An array whose order *is* the data must never be alphabetized. Sorting one changes the product rather than tidying it:

- a site navigation menu renders in array order,
- a fragment's `fieldSets` order is the order the configuration panel shows,
- `objectStates` is a state machine whose **first entry is the initial state**,
- `optionValues` and list type entries render in the order they are defined.

This is why `check-sorted-json.js` uses an allowlist of array paths rather than sorting every keyed array it finds. Adding a path to that list is a claim that the order carries nothing — check before making it.

## Log Message Conventions

Do not write log statements like AI-generated code. Specifically:

- Error messages: use `"Unable to <verb>"` not `"Error <verb>ing"` or `"Error: <noun>"`
- Product/object names in log strings: no hyphens — write `"business event"` not `"business-event"`, `"business events"` not `"business-events"`
- No punctuation that forms a label. A log message is prose. It carries no `:`, no `-`, and no `=` as a separator. Write `"Unable to update business event " + id`. Do not write `"Update failed: id=" + id`. A hyphen inside a URL path is correct when the message repeats that path.

Example of what Brian corrected:

```java
// Wrong — AI slop
_log.info("GET business-events for " + externalReferenceCode);
_log.error("Error updating business event " + id);

// Correct
_log.info("GET business events for " + externalReferenceCode);
_log.error("Unable to update business event " + id);
```

## String Concatenation In Java

Three or more `+` operators joining strings in one expression become `StringBundler.concat(...)`. Two pieces stay as they are.

```java
// Wrong
throw new JiraAssetObjectException(
	"No \"" + objectTypeName + "\" asset object exists for external key " +
		externalKey);

// Correct
throw new JiraAssetObjectException(
	StringBundler.concat(
		"No \"", objectTypeName, "\" asset object exists for external key ",
		externalKey));

// Fine — two pieces
_log.info("Deployed app for project " + projectId);
```

This applies everywhere a string is built: log calls, exception messages, return values, assignments. It is a Java rule only — TypeScript uses template literals.

## User-Facing Text

- Use "IDs" (not "Id", "id", "codes", or other terms) when referring to identifier values shown to users. This includes object field `label` values in batch definitions — write `"Catalog External ID"`, not `"Catalog External Id"`.
- Semantic precision matters: "Email" and "Email Address" are different — don't add "Address" if the field is just an email

## FreeMarker Variable Blocks

In FreeMarker templates (`.ftl`, `index.html`), group all `[#assign ... /]` statements together in a single block at the top. Within the block, order variables by dependency (assign prerequisites before their dependents).

```freemarker
[#assign
    currentFriendlyURL = ... /]
[#assign
    currentURL = ... /]
```

→ Both should be in one logical block, with `currentFriendlyURL` before `currentURL` since `currentURL` may depend on it.

### Reset per-iteration state inside `[#list]`

`[#assign]` variables are template-scoped, not iteration-scoped — a value assigned in one `[#list]` pass persists into the next. When a variable is assigned only inside a guard (`[#if x?has_content]`), a later iteration whose guard is false still reads the *previous* iteration's value, so the wrong data renders. Reset every such variable to a neutral default at the top of the loop body, before the guards.

```freemarker
[#-- Wrong: principalCategory leaks from the previous product --]
[#list products as product]
    [#if product.categories?has_content]
        [#assign principalCategory = product.categories[0] /]
    [/#if]
    [#if principalCategory?has_content]...[/#if]
[/#list]

[#-- Correct: reset before the guard --]
[#list products as product]
    [#assign principalCategory = "" /]
    [#if product.categories?has_content]
        [#assign principalCategory = product.categories[0] /]
    [/#if]
    [#if principalCategory?has_content]...[/#if]
[/#list]
```

## Image URLs in Fragments

Do not replace `https://` with `http://` in the URL of an image or a document in fragment markup. One example is `src="${imageURL?replace('https://', 'http://')}"`.

This replacement works only on a local machine. On a UAT environment or a production environment, the replacement sets the asset URL to `http://`. The browser then blocks the request as mixed content, and the image does not load. The browser reports nothing to the user.

Request the asset with the scheme of the current page. Do not rewrite the protocol.

## Date Input Values Are Timezone-Naive

Enforced in the custom element by `local/no-timezone-naive-date` ([`custom-element-safety.md`](./custom-element-safety.md)).

Do not pass a `yyyy-MM-dd` value from an `<input type="date">` to `new Date(...).toISOString()`.

JavaScript reads a plain date string as **midnight UTC**. In a timezone behind UTC, which includes all of the Americas, `.toISOString()` moves the day back by one. A later display in local time moves it back as well. The start date or the expiration date that the code saves is then one day before the date that the user picked.

```ts
// Wrong — 2026-03-15 selected in the US saves/renders as 2026-03-14
function toISODate(value?: string): string | undefined {
	return value ? new Date(value).toISOString() : undefined;
}

// Correct — pin to local noon so the calendar day survives any offset
function toISODate(value?: string): string | undefined {
	return value ? new Date(`${value}T12:00:00`).toISOString() : undefined;
}
```

Prefer a shared helper in `~/utils/dateUtils.ts` over re-deriving this per file.

## Java Code Ordering

In Java classes, declare resource clients before the objects that use them:

```java
// Wrong
Account account = new Account();
account.setName(...);
AccountResource accountResource = AccountResource.builder()...build();

// Correct
AccountResource accountResource = AccountResource.builder()...build();
Account account = new Account();
account.setName(...);
```