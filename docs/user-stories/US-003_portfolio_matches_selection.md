# User Story: Portfolio matches selection
As a prospect, I want to see proof aligned to my choices, so that I can trust the team can deliver what I'm selecting.

## Acceptance Criteria
- [ ] Selecting an option surfaces assets that share tags with the catalog item.
- [ ] Portfolio slide renders a grid of at least two assets when available.
- [ ] Assets without tags still render under a "more inspo" fallback section.

## UI Notes
- Support images and video links with responsive aspect ratios.
- Show tag chips to reinforce why an asset is recommended.
- Provide a message when no assets match selection yet.

## Data/Schema Touchpoints
- Tables: Asset, CatalogItem, Option.
- Events: `portfolio_open`.

## Edge Cases
- Handle large video URLs gracefully without autoplay.
- Fallback to placeholder imagery when remote asset fails to load.
- Ensure private assets (future feature) are filtered for unauthorized viewers.
