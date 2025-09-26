# User Story: Owner builds template & catalog
As an agency owner, I want to manage catalog items and templates, so that my team can spin up proposals quickly.

## Acceptance Criteria
- [ ] I can define catalog items with pricing, tags, and linked assets.
- [ ] Proposal templates store ordered slides with option placeholders.
- [ ] Seed script bootstraps an org, client, catalog, and demo proposal.

## UI Notes
- Provide simple dashboard cards summarizing catalog and templates.
- Highlight template slide order visually (future enhancement).
- Include "Create from template" call-to-action on proposals list.

## Data/Schema Touchpoints
- Tables: Org, CatalogItem, Asset, ProposalTemplate, Slide, Option.
- Events: none initially.

## Edge Cases
- Ensure slug uniqueness for org.
- Prevent deletion of catalog items that are used in active proposals without confirmation.
- Support multi-org in future by scoping queries by `orgId`.
