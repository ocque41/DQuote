# SPRINT 2 PLAN

## Item 1: Public proposal runtime page
- Build `/proposals/[shareId]` route that loads proposal, slides, and options for public viewing.

### Acceptance Criteria
- [x] Visiting `/proposals/<seedShareId>` renders Intro → choice → add-ons → review flow powered by fetched data.
- [x] Slides and options load from Prisma by `shareId` without server errors.

## Item 2: Interactive selections + summary
- Implement OptionCard, QuantityStepper, AddOnToggle, ProgressSteps, and SummaryTray components with live pricing feedback.

### Acceptance Criteria
- [x] Selecting A/B choices or toggling add-ons updates local state and visible totals without reloads.
- [x] Sticky SummaryTray displays subtotal, tax, and total using values from the pricing endpoint.

## Item 3: Pricing API
- Expose `/api/pricing` POST handler that validates input and computes totals based on selections.

### Acceptance Criteria
- [x] Request body is validated via Zod `.safeParse`, returning 400 on invalid payloads.
- [x] Successful calls respond with `{ subtotal, tax, total }` numbers reflecting current selections.

# SPRINT 3 PLAN

## Item 1: Pricing rules engine foundations
- Implement deterministic rule evaluation in `src/server/pricing/rules.ts` covering require, mutex, fixed/percent discounts, and taxes.

### Acceptance Criteria
- [x] Rules combine into a single calculator that produces consistent totals for a given proposal configuration.
- [x] Unit tests cover require/mutex conflict cases and ensure discounts/taxes apply as expected.

## Item 2: API integration and validation
- Wire the new rules engine into the pricing service invoked by `/api/pricing`, maintaining Zod validation paths.

### Acceptance Criteria
- [x] API responses reflect rule outcomes for shared demo data and error on invalid combinations.
- [x] Existing pricing tests (or new ones) verify integration without regressions in previous behavior.

## Item 3: Summary tray micro-interactions
- Surface short-lived price delta indicators (e.g., `+€X`) within `SummaryTray` when selections change.

### Acceptance Criteria
- [x] Totals and transient delta messaging update in sync with pricing responses.
- [x] Interaction remains accessible/responsive on desktop and mobile breakpoints.

# SPRINT 4 PLAN

## Item 1: Portfolio tagging data plumbing
- Extend catalog items and assets with shared tag metadata, expose matching assets in the proposal loader, and surface them through the pricing selections service.

### Acceptance Criteria
- [x] Catalog items and assets in the seed data include overlapping tags that can be matched at runtime.
- [x] Server-side proposal query returns 2–4 tagged assets aligned with the active option selections for use in the portfolio panel.

## Item 2: Dynamic PortfolioPanel UI
- Introduce a portfolio panel component beneath the slide viewport that listens to selection changes and renders the server-provided assets.

### Acceptance Criteria
- [x] Portfolio panel updates immediately as core choices or add-ons are toggled.
- [x] Matching case studies and proofs render with imagery and titles relevant to the user’s current configuration.
