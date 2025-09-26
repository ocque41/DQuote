# SPRINT 4 PLAN

## Item 1: Configure shadcn registry for @cumulus components
- Ensure the project knows how to resolve the `@cumulus` registry so component downloads succeed locally.

### Acceptance Criteria
- [x] `components.json` includes a `registries` entry pointing `@cumulus` to the project's registry endpoint.
- [x] Verified the registry by fetching `@cumulus/button` JSON from the local server (documented that the CLI requires `NO_PROXY` for localhost).

## Item 2: Document how to use the custom registry
- Add contributor guidance describing the custom registry configuration and the command needed to pull components.

### Acceptance Criteria
- [x] README notes the `@cumulus` registry URL and example `shadcn add` usage.
- [x] `pnpm lint` passes after documentation updates.
