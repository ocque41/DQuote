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
