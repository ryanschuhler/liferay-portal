# Liferay One Workspace

These instructions add to the instructions at the repository root. When the two sets of instructions disagree, obey this file.

## Architecture

This workspace is a Liferay SaaS workspace of client extensions. It contains no OSGi module and no Ant build. The `client-extensions/` directory holds these 6 client extensions:

- `liferay-one-batch/` — the batch client extension that imports Object definitions, list types, and other headless resources.
- `liferay-one-custom-element/` — one React element that serves the page groups for Marketplace, Support, and Admin.
- `liferay-one-etc-spring-boot/` — the custom REST endpoints, the subscriber for Salesforce Pub/Sub, the crons, and the clients for each integration.
- `liferay-one-global-css/` — the styles that every page shares.
- `liferay-one-instance-settings/` — the global configuration of the Liferay instance.
- `liferay-one-site-initializer/` — one site with all Object definitions, all roles, and all fragments.

## Related Repos

The migration scripts and the ETL scripts load the data for this product. They live in a sibling `scripts` checkout. GitHub holds that checkout as `liferay-one/scripts`. The usual path to it from here is `../../../scripts`. The scripts in `one/scripts/migration/` write the objects that `client-extensions/liferay-one-batch/batch/` defines. They write through the headless APIs and through the `liferay-one-etc-spring-boot` endpoints.

A rename in this workspace breaks a loader script in that checkout, and the break gives no warning. Grep that checkout before you change an object ERC, a field name, an endpoint path, or an enum value. Record what the change breaks. Repair the script in a companion ticket against that repository. Never repair it in a workspace PR ([`rules/pr-hygiene.md`](./rules/pr-hygiene.md) — one workspace, one PR).

The `/one-team` skill runs a team of 4 agents against either repository. Read [`skills/one-team/SKILL.md`](./skills/one-team/SKILL.md).

## Development

Run these commands from `workspaces/liferay-one-workspace/`.

- Start environment: Run `/one-env-up` skill.
- Stop environment: Run `/one-env-down` skill.
- Reset environment: Run `/one-env-reset` skill.
- Liferay MCP setup: Run `/one-mcp` skill.
- **Build:** `./gradlew build`
- **Format:** Run the `/format-source` skill.
- **Lint:** Run `yarn lint` for the rules that apply to one file. Run `yarn lint:structure` for the checks on the import graph ([`rules/custom-element-structure.md`](./rules/custom-element-structure.md)).
- **Deploy:** Run the `/one-deploy` skill.
- **Pre-commit:** Run the format step first. Run the build next. Do not deploy a build that fails.
- **Rebase:** Run the `/one-rebase` skill.
- PR: Run the `/one-pr` skill.

## Rules

`.agents/rules/` holds the coding standards and the PR conventions. The review feedback from Brian Chan is the source of these rules. Read the rules before you write code. Read the rules before you review code.

- [`rules/code-style.md`](./rules/code-style.md) — how to sort a list, how to write a log message, how to join strings, FreeMarker, and the order of Java statements
- [`rules/concurrency.md`](./rules/concurrency.md) — the shared state on a Spring singleton, the fields that hold a formatter, and the races between React effects
- [`rules/custom-element-structure.md`](./rules/custom-element-structure.md) — where a file lives in the custom element: the folders under `src`, the service tiers, the difference between a read and a write, and the place for a page or a component
- [`rules/custom-element-safety.md`](./rules/custom-element-safety.md) — the rules in the custom element that a user sees when they fail: CSRF, XSS, injection into a filter, pagination with no limit, and a date with no timezone
- [`rules/data-access.md`](./rules/data-access.md) — how to read one row, the calls to a service in a loop, and the limits on pagination
- [`rules/naming.md`](./rules/naming.md) — the case of a brand name, the name of a file, and the name of a REST controller
- [`rules/object-naming.md`](./rules/object-naming.md) — the pattern for an ERC, the name of an Object, and the case of a field
- [`rules/page-folder-structure.md`](./rules/page-folder-structure.md) — one subfolder for each component of a sub-page
- [`rules/spring-boot-analysis.md`](./rules/spring-boot-analysis.md) — SpotBugs on the Java code: what it covers, what it cannot cover, and the open findings
- [`rules/simplified-technical-english.md`](./rules/simplified-technical-english.md) — ASD-STE100: the controlled language for every word that a person reads
- [`rules/pr-hygiene.md`](./rules/pr-hygiene.md) — the scope of a PR, merge conflicts, and commit messages

## Specs

`.agents/specs/` describes the stable shape of this workspace. Read the specs before you make an implementation decision. The specs show you where something lives and why. No file under `.agents/` is authoritative. The object definitions in `client-extensions/liferay-one-batch/batch/` and the controllers in `liferay-one-etc-spring-boot` hold the source of truth. They define the ERCs, the fields, the list types, and the endpoints. A spec that disagrees with the source of truth is stale.

- [`specs/workspace.md`](./specs/workspace.md) — the layout of the shell, the client extensions, and the naming conventions
- [`specs/data-model.md`](./specs/data-model.md) — the full index of entities, the registry of ERCs and FriendlyURLs, and the field mappings

Read the code for the API surface, for the map of the pages and the routes, and for the contracts of each integration. The Spring Boot controllers are in `liferay-one-etc-spring-boot`. The service layer and `src/pages/` are in `liferay-one-custom-element`. This code changes frequently, and a separate spec of it becomes incorrect.