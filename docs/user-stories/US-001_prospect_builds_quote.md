# User Story: Prospect builds quote
As a prospect, I want to walk through an interactive proposal deck, so that I can configure the perfect package without going back and forth via email.

## Acceptance Criteria
- [ ] I can review curated option cards per slide with descriptions, pricing, and recommended badges.
- [ ] My selections automatically persist when I navigate between slides and reload the share link.
- [ ] Quantities and add-ons can be adjusted inline with immediate feedback.

## UI Notes
- Sticky summary tray with running totals on desktop.
- Progress indicator at top of slide stage.
- Cards should animate subtly when selected.

## Data/Schema Touchpoints
- Tables: Proposal, Slide, Option, Selection, Quote.
- Events: `view`, `select`.

## Edge Cases
- All options deselected should surface a helpful error state before continuing.
- Handle expired or unavailable proposals gracefully.
- Ensure multiple viewers see synced selections in near real-time.
