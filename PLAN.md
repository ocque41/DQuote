# SPRINT 1 PLAN

## Item 1: Prisma data model + migrations
- Model Org, User, Client, CatalogItem, ProposalTemplate, Slide, Option, PricingRule, Proposal, Selection, Quote, Asset, Event with enums to support Sprint 1 flow.
- Produce a --create-only migration (checked in as raw SQL) and an init migration that bootstraps the schema locally.

### Acceptance Criteria
- [x] `prisma/schema.prisma` captures every required model + relation for the proposal runtime, including enum values for slide flow.
- [x] `pnpm run migrate:create` generates SQL that is committed without being applied; `pnpm run migrate:apply` succeeds locally.

## Item 2: Demo dataset seeding
- Populate one organization with catalog, proposal, slides, and selections to exercise the interactive deck runtime.

### Acceptance Criteria
- [x] `pnpm exec prisma db seed` seeds the org, client, catalog items, proposal (status SENT), slides (INTRO, CHOICE_CORE, ADDONS, PORTFOLIO, REVIEW, ACCEPT), options, selections, quote, assets, and events.
- [x] `pnpm exec prisma studio` shows all seeded entities under the expected relations.

## Item 3: Developer docs update
- Document how to run migrations and seed data for Sprint 1 setup.

### Acceptance Criteria
- [x] README gains instructions for running `pnpm run migrate:create`, `pnpm run migrate:apply`, and `pnpm exec prisma db seed`.
- [x] README callouts reference the new seed data context for testing the proposal flow.
