# Review Criteria

This file states what a Liferay One review covers, in both lanes: the lenses to apply, their weighting, what does not count as a finding, and how to write up a finding. Every reviewer reads this file. The interactive `/one-review` skill and the `one-team` reviewer charter (`../one-team/roles/reviewer.md`) both work from it, so a finding from either one means the same thing. Review logic belongs in this file and nowhere else. Add a new heuristic here, not to a caller.

The lane is either **workspace** (`liferay-one-workspace` — client extensions, objects, site content) or **scripts** (the sibling `liferay-one/scripts` checkout — `one/` ETL and migration scripts). A lens that reads the same in both lanes carries no tag.

## Rule Files

Read the rule files for the lane first. They hold the detail that the lenses below do not repeat. They are not a separate review pass. Report a violation under whichever lens found it.

| Lane | Rule files under `.agents/rules/` |
| --- | --- |
| Workspace | `code-style.md`, `concurrency.md`, `custom-element-safety.md`, `custom-element-structure.md`, `data-access.md`, `naming.md`, `object-naming.md`, `page-folder-structure.md`, `pr-hygiene.md`, `simplified-technical-english.md`, `spring-boot-analysis.md` |
| Scripts | `architecture.md`, `code-quality.md`, `no-comments.md`, `script-conventions.md`, `sensitive-data.md`, plus `data-access.md` from the workspace, because the scripts call the same APIs over far more records |

## The Lenses, in Order

The order is the weighting. A concurrency defect outranks a maintainability suggestion, so spend the effort in that order. Where a lens names a rule file, that file is the checklist. The lens adds the weighting and the judgments the file cannot make.

1. **Correctness** — logic errors, null paths, error paths, and edge cases. Weight the silent failures highest: a swallowed exception, an empty catch block, a `catch` that logs and returns a default, an authorization check that grants access when it fails, a `?? ''` that hides a missing value. Scripts lane: idempotency is a correctness property. A script that duplicates records or counts a record twice on a second run is a blocker, even when the first run finished clean. A swallowed error on one item leaves the data half loaded, which is a real defect. An exit code of zero is not evidence that the run was correct.

1. **Concurrency** — local testing does not cover this lens, so the reviewer carries all of it. Weight it heaviest on a Java change. `concurrency.md` is the checklist: singleton beans, the three sanctioned shapes for mutable state after startup, formatter fields, check-then-act, and races in a React effect. Name these four shapes, because each one reads as ordinary code.

	- A `HashMap` or an `ArrayList` held as a shared field where a concurrent collection belongs.
	- A double-checked lock whose guarded field is not `volatile`, which publishes an object before its constructor finishes.
	- `count++` on a shared field where an `AtomicLong` belongs.
	- A React effect or callback with an incomplete dependency array, which keeps the values from the first render.

	A field that a `@Scheduled` tick, an `@Async` method, a startup warm-up, or a Pub/Sub subscriber reaches is concurrent, even when only one endpoint writes it. Scripts lane: the scripts are single-threaded, so this lens reduces to an unawaited promise and to shared mutable module state across a paginated run.

1. **Efficiency** — `data-access.md` is the checklist: a service call inside a loop, a page fetched to take `[0]`, a value re-derived on every iteration, unbounded pagination, serial awaits. Weight this lens heaviest in the scripts lane, where the same code runs over hundreds of thousands of records.

1. **Completeness** — the code implements every stated acceptance criterion, and a test covers each one. The code implements nothing the ticket did not ask for. In a `one-team` run, `plan.md` holds the criteria and `test-report.md` holds the evidence. A missing test is a finding only where the surrounding code holds a test pattern to follow. The scripts repository holds no such pattern, so a missing test is never a finding there.

1. **Security** — check each of the following.

	- Every endpoint carries the right OAuth2 scopes, which the `client-extension.yaml` of the extension declares.
	- No insecure direct object reference (IDOR): an ERC or an ID parameter taken from the request must not reach another account's record.
	- The permission check runs before the mutation, not after it.
	- A filename that a user supplies cannot traverse a path, and no redirect goes to an unvalidated URL.
	- No secret, token, or personal datum appears in the code, in the configuration, or in the log output.
	- Nothing that arrives from outside is deserialized into a live object graph.

	**Injection is a blocker wherever the code pastes a value into a query instead of binding it.** Two shapes qualify: an OData filter built by concatenating a request value rather than through `SearchBuilder`, and a statement for the local store built by interpolating into its SQL rather than binding a `$parameter`. Every store under `one/scripts/local-store/` already binds a `$parameter`.

	Workspace lane: `dangerouslySetInnerHTML` on a value that comes from Salesforce, Jira, Koroneiki, or Marketplace is the primary XSS vector. Default JSX interpolation is safe.

	Scripts lane: each of these three is a blocker. A write path that does not call `confirmRemoteEnvironment()`. A hardcoded host or credential. A sensitive file in the diff, which `sensitive-data.md` lists.

1. **Regression risk — every file the change reaches, not the diff alone.** A review starts at the diff and never ends there. The defect that a diff-scoped read misses lives in a file the diff never touched. That code still compiles and still looks correct on its own. Work this lens as an explicit pass, not as a thought while you read the diff.

	List every symbol the diff changes, renames, or deletes: function and method signatures, exported components and hooks, service methods, REST paths and payload shapes, shared types, object ERCs and field ERCs, list-type values, config keys, environment variables, columns in the local store. Find every reference to each symbol, across `<TARGET>` and across the consuming repository. Then **read each call site against the new behavior**. A symbol whose references nobody read is an open finding, not a pass. Name in the report which symbols you traced and how many references each one had. This lens gains the most from a fan-out, and the blast-radius step of the skill is where the fan-out happens.

	Look for these at each site, hardest to catch first:

	- **A behavior change behind an unchanged signature.** The method now returns `null` where it threw an exception. Or it returns an empty page where it returned every row, writes a second record, or narrows a filter. No mechanical check finds this: every call site still compiles and every existing test still passes. It is the most valuable defect this lens finds.
	- **Parameters added or reordered while the types still match.** The compiler reports no error, and the arguments land in the wrong parameters. `code-style.md` requires alphabetical parameters, so any rename that re-sorts a signature causes this often. Read each call site. A build that passes is not evidence that the call sites are correct.
	- **A return type that is now wider or nullable**, which an existing caller dereferences with no guard. Also a thrown exception type that the `catch` in a caller no longer matches.
	- **References that a grep for the symbol name does not find** — ERCs and field names in the batch object definitions, in site-initializer JSON, and in FreeMarker templates, plus dynamic string keys, endpoint paths assembled from fragments, and OAuth2 scope strings. Search the string form as well as the identifier.
	- **A deleted symbol whose callers remain**, and a shared component whose prop keeps its name while its meaning changes.

	Order counts as much as the call sites. A change to the timing of the code, to its frequency, or to what it leaves behind on a second run is a regression. That holds even when every signature is unchanged.

1. **Cross-repo consistency** — the product and the scripts that load its data share one contract: the ERCs, the field names, the endpoint paths, the payload shapes. Workspace lane: grep every value the diff changes against `<SCRIPTS>/one/`. A break in the contract becomes work in a companion ticket. Never fix it in this diff. Scripts lane: verify every value the diff writes against the object definitions (`client-extensions/liferay-one-batch/batch/`) and against the `liferay-one-etc-spring-boot` controllers. Never verify a value against a specification, because nothing under `.agents/` is authoritative. An invented or stale ERC is a blocker: it loads orphaned data and reports no error.

1. **Architecture and pattern conformance** — the code follows the patterns already in place. Where the surrounding code uses one pattern, a new pattern needs a stated reason. Workspace lane: the objects and ERCs come from the batch definitions, each service file maps to the URL it calls, and each page follows the existing router split. `custom-element-structure.md` is the checklist for the custom element. The linter enforces every rule in it that a single file can prove, plus the two rules that need the whole import graph. Run `yarn lint` and `yarn lint:structure`, then read the warnings on the changed files rather than deriving them by eye. A warning the diff introduces is a finding. A warning the diff inherits is not. Scripts lane: apply the three-layer rule and the two script patterns, per `architecture.md` and `script-conventions.md`. A skipped layer is a finding. In both lanes a hand edit to generated output is a blocker. The generator overwrites the edit on the next run, so the change belongs in whatever the generator reads, or in the code that calls it.

1. **Repo rules** — everything the style rules of the lane require. In the workspace, `code-style.md` and `naming.md` cover sorted entries, log conventions, wording, casing, and file naming. In the scripts repository, `no-comments.md` and `script-conventions.md` cover any comment in new or modified code, a `console.log`, a hand-written OData filter, and a Liferay call outside `liferay-headless-rest-client`. Three more rules that no rule file states:

	- The Liferay clients in `services/liferay.ts` already retry a transient failure at the ky layer. A manual retry loop around one of their calls is therefore a finding.
	- The batch engine numbers `failedItems[].itemIndex` from **1**, so a map back to the submitted array reads `array[itemIndex - 1]`.
	- Every store under `one/scripts/local-store/` builds its schema with `CREATE TABLE IF NOT EXISTS` against a `.db` file that is already on disk. A column added to that DDL therefore never reaches an existing store. A new column needs an explicit `ALTER TABLE` migration. A reviewer who reads the DDL edit alone sees a change that does nothing.

1. **Simplicity and maintainability** — dead code, needless abstraction, duplicated logic, narrative comments, a method that does too many things. Also a name that says nothing (`temp`, `data`, `obj`) outside a short scope, or a name that no longer describes the thing after a refactor. Four more shapes:

	- A value hardcoded where a named constant or a config entry belongs, subject to the calibration in Known False Positives below.
	- A `switch` or an `if` chain that duplicates logic and that returns a wrong result, with no error, when the next case arrives.
	- Three or more near-duplicates that one abstraction would replace.
	- A signature so specific that every caller has to restructure around it.

	Report the complexity that the next reader pays for. Suggest a direction. Do not write the refactor.

A diff that changes a file outside its target repository is a blocker in both lanes. File it under whichever lens explains how the file got there.

## Mechanical Sweep

In the workspace, Prettier covers `liferay-one-custom-element/src/**/*.{ts,tsx,css}` and its `@vite/**/*.ts` only. No whitespace formatter covers the other files: the batch object definitions, the site initializer JSON and FreeMarker, the `client-extension.yaml` files, the global CSS, the `.properties` files, and the Markdown. This sweep finds the defects in that gap, so scope it to the changed files outside the Prettier paths.

The sweep is pattern matching alone, so it is the one part of a review to give to a `haiku` subagent:

- Trailing whitespace, spaces and tabs in one pass: `grep -nE "[[:blank:]]+$"`. Use this form rather than `grep -P`. The BSD grep on macOS does not support `-P`, so a command that uses it fails when that grep comes first on `PATH`.
- More than one consecutive blank line
- Tabs and spaces mixed against the convention of the file
- Two spaces in the middle of a line, outside an aligned block or a string literal
- A blank line at the top of a file, and a missing final newline on a file that is not Markdown
- A misspelling in an identifier, which stays in the code longest after a merge
- A misspelling in a user-visible string, a language key, a log message, or a comment
- Identifier casing against the convention of the file — `camelCase` for a variable, a method, and a field, `PascalCase` for a type and a class, `UPPER_SNAKE_CASE` for a constant, and the `_` prefix on a private field wherever the surrounding file already uses it

Report the identifier typos and the string typos apart from the whitespace. Someone fixes a typo one at a time, and fixes the whitespace in one pass.

Match the file, not a general rule. Where the existing file indents with tabs, or prefixes its private fields, the new code does the same. A reported violation that is the settled style of the file is a false positive.

## Automated Pass

Workspace lane: run the `code-review` skill. Use the reviewer that reads the working diff, not the plugin that comments on a GitHub pull request. Run its fan-out on `sonnet`, and set the model explicitly on every `Agent` call. The lens work already covers the bug scan and the rule adherence. This pass adds the history that the diff does not show: git blame on the modified lines, review comments from earlier pull requests that touched the same files, guidance in the surrounding code comments. Weight the output of the pass on that history, and drop what the lenses already found.

Scripts lane: skip the pass, because the skill fits the workspace. A clean `bun run lint` is a starting point, not a substitute. It says nothing about the layering, the comments, the idempotency, or an invented ERC.

## Evidence

A check either happened during this review or it did not happen. Nothing already in context counts: not a file you read earlier in the session, not a grep you ran while the code was written, not a conclusion you reached before the review began. Treat the thought *I already checked that* as the signal to check it again. It is the one class of check a reviewer skips and never notices. It costs most on the values that matter most. A contract looked up during the implementation was looked up against code that changed after that.

This rule binds a cleared check as much as it binds a finding. A finding cites the `file:line` where you verified it. A lens that reports nothing states what it read to reach that conclusion: one line of files and counts, not a paragraph. Keep a report short by naming the coverage briefly, never by leaving the coverage out. The blast-radius step already separates "traced, nothing found" from "never traced". The same distinction applies to every lens, and to every value the cross-repo lens clears.

Where the reviewing session is not independent of the change, the review depends on this rule. [`SKILL.md`](./SKILL.md) defines the three states of independence and what each state owes.

## Known False Positives

Do not report these. Each one costs the reader more than it saves, and a wrong finding costs more than a missed one.

- **Java method ordering.** The convention sorts methods alphabetically *within* one access-modifier group, not across the file. A `public` method between two `private` methods is correct. `formatSource` enforces the order anyway.
- **Anything a formatter, a linter, or a compiler finds.** Import order, a missing import, a type error, indentation. The build gate covers these. When one remains, write "rerun the formatter" rather than a list of the items.
- **A hardcoded value that stays hardcoded.** A JDK or Liferay constant, a well-known enum or protocol string, a short fixed list that rarely changes, or any value that gains nothing from being dynamic. Report a hardcoded value for one of three reasons only: a new case is already coming, the value differs per environment, or the value belongs in a language key.
- **A defect that already exists on a line the diff never touched**, unless the change now reaches that line.
- **The quality of a comment or of documentation**, beyond the spelling. A *missing* comment is never a finding. This codebase writes no narrative comments by default, and the scripts lane forbids them.
- **A Markdown file with no trailing newline.** `MarkdownWhitespaceCheck` in the Liferay source formatter removes that newline on purpose, so its absence is the convention here, not a mistake.

## Findings

Tag every finding. Sort the findings with the most severe first:

```
[blocker|major|minor|nit] <file>:<line> — <what is wrong>
    why: <consequence, or the rule/pattern file it violates>
    fix: <concrete suggestion>
```

Every finding cites a `file:line`. Verify each one against the code before you write it up. Automated output, from `code-review` or from any subagent, is a list of candidates rather than a list of findings. Tag only a candidate that survives the verification. The `fix:` line gives a direction, not a patch. Name the approach and leave the implementation to whoever owns the change.

Keep the report short. A good review usually fits on one page. Never repeat the diff, because the reader already has it. State the coverage even where a pass found nothing: the independence state, the blast-radius trace with the traced symbols and their reference counts, and the one-line read for each cleared lens, per Evidence above. "Traced, nothing found" and "never traced" take the same space on the page and mean opposite things.

`CHANGES_REQUESTED` requires at least one open `blocker` or `major` finding: something that loads wrong data, breaks a contract, or fails after the merge. Every other result is `APPROVED`. Carry the open `minor` and `nit` findings in that report. Whoever owns the change weighs them, and they are not grounds to hold the branch.

State the counts with the verdict — `APPROVED — 0 blocker, 0 major, 3 minor, 1 nit` — so the verdict summarizes the findings rather than replacing them. `APPROVED` with findings below it is the normal result of a thorough review.

The severity tags decide the verdict, which is why you assign them. A rule that blocks on a finding of any severity removes the difference between the tags. An invented ERC and a misspelled local variable then carry the same weight. A reviewer who can approve nothing gives an approval that means nothing. Nothing here lowers what counts as a finding. Every lens still runs, and you still verify and write up every finding. The severity grades the consequence only.