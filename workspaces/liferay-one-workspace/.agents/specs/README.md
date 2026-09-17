# Liferay One — Unified Portal Specs

These documents are the source of truth for the implementation of `liferay-one-workspace`. Each document makes a decision detailed enough for an engineer to build from. The engineer needs no follow-up question.

Target workspace: `workspaces/liferay-one-workspace/`

## Reading order

1. [`workspace.md`](./workspace.md) — the layout of the shell, the client extensions, and the naming conventions

1. [`data-model.md`](./data-model.md) — the full index of entities, the registry of ERCs and FriendlyURLs, and the field mappings

Read the code for the API surface, for the map of the pages and the routes,
and for the contracts of each integration. The Spring Boot controllers are
under `client-extensions/liferay-one-etc-spring-boot`. The service layer of the
frontend and `src/pages/` are under
`client-extensions/liferay-one-custom-element`. The conventions are in
`.agents/rules/`. Three earlier specs, `api.md`, `ui.md`, and `integrations/`,
stopped agreeing with the implementation, and we removed them.