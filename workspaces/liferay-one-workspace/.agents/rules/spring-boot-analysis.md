# Spring Boot Static Analysis

`liferay-one-etc-spring-boot` is 378 Java files, and until now the only tool that read them was the Liferay source formatter, which checks whitespace and import order. Nothing looked at what the code did.

SpotBugs now does. It runs as part of `check`, so `./gradlew build` includes it.

```bash
./gradlew :client-extensions:liferay-one-etc-spring-boot:spotbugsMain
```

The report lands at `build/reports/spotbugs/main.html`, with the XML beside it.

## What It Is And Is Not

SpotBugs reads bytecode, so it finds the defects that survive review: a charset that depends on the machine, a static array every caller can mutate, a null check on something that was never null.

It does not find the defect class this lane is most exposed to. [`concurrency.md`](./concurrency.md) describes shared mutable state on singleton beans — a `HashMap` held as a field, a double-checked lock whose field is not `volatile`, a `SimpleDateFormat` reused across threads — and SpotBugs catches only the most literal of those. That file is still the checklist a reviewer works from, and it outranks anything here.

## Configuration

`ignoreFailures` is on, so a finding reports without breaking the build. Turn it off once the count reaches zero.

`spotbugs-exclude.xml` holds two exclusions:

- the `liferay-release-tool-ee` sources, which are sparse-checked into this project's source set and are not ours to fix, and
- `EI_EXPOSE_REP` and `EI_EXPOSE_REP2`, which fire on every getter returning a mutable field. In a codebase of DTOs that is noise, not signal.

Everything else reports. Add an exclusion only for a rule that is wrong here, never to quiet a finding that is right.

## What It Found

47 findings on the first run.

| Bug | Count | Why it matters |
| --- | --- | --- |
| `MS_MUTABLE_ARRAY` | 23 | A `public static final` array is only final in its reference. Any caller can assign into it, and in a Spring singleton every request shares it. Return a `List.of(...)` or a copy. |
| `CT_CONSTRUCTOR_THROW` | 14 | A constructor that throws after partially building the object leaves it reachable through a finalizer. |
| `DM_DEFAULT_ENCODING` | 5 | The defect worth reading first. |
| `MS_EXPOSE_REP` | 2 | A static mutable handed to a caller. |
| `RCN_REDUNDANT_NULLCHECK_OF_NONNULL_VALUE` | 1 | A null check on a value that cannot be null, so the branch it guards is dead. |
| `DM_BOXED_PRIMITIVE_FOR_PARSING` | 1 | `Integer.valueOf(s)` where `Integer.parseInt(s)` is meant. |

### The Encoding Findings

Three of the five `DM_DEFAULT_ENCODING` hits are in `getAuthorization`, `_getAuthorization`, and `_getAccessToken` — the methods that build outbound credentials. Converting a string to bytes without naming a charset uses whatever the JVM defaults to, which is UTF-8 on a developer's machine and whatever the container's locale says in production. A credential containing any non-ASCII byte encodes differently in the two places, so the call authenticates locally and fails deployed, with nothing in the stack trace pointing at the cause.

Name the charset: `StandardCharsets.UTF_8`, always.

## Ledger

| Finding | Open |
| --- | --- |
| `MS_MUTABLE_ARRAY` | 23 |
| `CT_CONSTRUCTOR_THROW` | 14 |
| `DM_DEFAULT_ENCODING` | 5 |
| `MS_EXPOSE_REP` | 2 |
| `RCN_REDUNDANT_NULLCHECK_OF_NONNULL_VALUE` | 1 |
| `DM_BOXED_PRIMITIVE_FOR_PARSING` | 1 |
| `SE_COMPARATOR_SHOULD_BE_SERIALIZABLE` | 1 |

New code is held to the rule regardless of the ledger. The counts only go down.
