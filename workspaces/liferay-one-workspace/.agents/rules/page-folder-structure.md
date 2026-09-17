# Page Folder Structure

Every sub-page component inside a section under `src/pages/` must live in its own named subfolder, not directly in the section root.

This file gives the rules for the section root. [`custom-element-structure.md`](./custom-element-structure.md) gives the rules for the rest of the custom element. That file covers the folders under `src`, the service tiers, and the components that belong under a page.

## The Rule

Within any section directory (e.g., `pages/MyAccount/`, `pages/ProductPurchase/`), the **only** files permitted directly at the section root are:

- `{Section}.tsx` — the root page component
- `{Section}Router.tsx` — the router component, which `main.tsx` lazy loads
- `{section}Routes.tsx` — the route definitions
- `{Section}.css` — section-level styles
- `components/` — sub-components used within the section
- `hooks/` — hooks used within the section
- `types/` — type definitions, one named file per concern
- `utils/` — utilities, one named file per concern

The list holds no `types.ts` and no `utils.ts`. A file with either name collects unrelated code, so it becomes a folder. [`custom-element-structure.md`](./custom-element-structure.md) gives the rest of the layout.

Everything else — route guards, redirects, step pages, detail pages — must be in its own subfolder named after the component:

```
# Wrong
pages/MyAccount/AccountGuard.tsx
pages/ProductPurchase/AccountSelection.tsx

# Correct
pages/MyAccount/AccountGuard/AccountGuard.tsx
pages/ProductPurchase/AccountSelection/AccountSelection.tsx
```

## Existing Correct Structure (use as reference)

`pages/Admin/` follows this pattern — every sub-page has its own folder: `Apps/`, `Environments/`, `LicenseKeyUploads/`, `MPSummary/`, etc.

## Import Path Impact

When a file moves into a subfolder, update its relative imports accordingly:

- Imports of sibling files (`./Projects/projects`) become `../Projects/projects`
- Imports of parent-level utilities (`./components/...`, `./hooks/...`) become `../components/...`, `../hooks/...`
- Absolute `~/pages/...` imports require the new folder segment in the path