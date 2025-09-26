# User Story: Analytics on slide completion
As a revenue leader, I want to monitor how prospects interact with slides, so that I can optimize the proposal flow.

## Acceptance Criteria
- [ ] Events log slide views, selections, acceptances, and payments with timestamps.
- [ ] Analytics dashboard lists the most recent 25 events with proposal context.
- [ ] API/actions emit events when viewers accept or pay via the flow.

## UI Notes
- Table view with event type, proposal name, and ISO timestamp.
- Future: add charts for drop-off by slide.
- Link to the live proposal from each row.

## Data/Schema Touchpoints
- Tables: Event, Proposal.
- Events: `view`, `select`, `accept`, `pay`.

## Edge Cases
- Handle empty state when no events exist yet.
- Ensure analytics page remains responsive with larger datasets (pagination later).
- Avoid leaking sensitive data in event payloads.
