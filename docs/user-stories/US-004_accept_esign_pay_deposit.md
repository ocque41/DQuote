# User Story: Accept, e-sign, & pay deposit
As a prospect, I want to accept and pay in one place, so that I can immediately lock in the event team.

## Acceptance Criteria
- [ ] Clicking accept updates proposal status to `ACCEPTED` and logs an event.
- [ ] Stripe Checkout launches with the current selections as line items.
- [ ] Success and cancel URLs deep link back to the in-app dashboard.

## UI Notes
- Accept CTA should be primary with deposit CTA secondary.
- Provide optional "Book kickoff demo" button after acceptance.
- Show loading states when actions are in-flight.

## Data/Schema Touchpoints
- Tables: Proposal, Quote, Event.
- Events: `accept`, `pay`.

## Edge Cases
- Handle Stripe failures by surfacing the error and allowing retry.
- Prevent duplicate accept calls via disabled state.
- Ensure proposals without deposits still allow acceptance.
