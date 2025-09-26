# User Story: Live totals & pricing rules
As a sales operator, I want pricing to update automatically with guardrails, so that buyers only see compliant totals.

## Acceptance Criteria
- [ ] Pricing API returns subtotal, tax, and total for a set of selections within 300ms.
- [ ] Discount/tax rules from `PricingRule` can be extended without redeploying.
- [ ] Summary tray highlights deposit owed when configured.

## UI Notes
- Summary shows subtotal, tax, total, and deposit (if present).
- Display informative copy when totals fail to load.
- Highlight savings when discount rules apply (future iteration).

## Data/Schema Touchpoints
- Tables: Option, PricingRule, Quote, Selection.
- Events: `select`, `deselect`.

## Edge Cases
- Zero selections should return zero totals without errors.
- Handle currency mismatch between override and catalog item gracefully.
- Enforce max quantity constraints when computing totals.
