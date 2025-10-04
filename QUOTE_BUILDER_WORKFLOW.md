# Quote Builder with Catalog Items Workflow

## Overview

The quote builder now connects to your catalog items, enabling a Zapier-like flow where you build interactive presentations by selecting products from your catalog.

## How It Works

### 1. Create Catalog Items (Items Page)

First, create your products/services in `/app/items`:

- **Name**: Product name (e.g., "DJ Package")
- **Description**: Product details
- **Base Price**: Starting price
- **Tags**: For portfolio matching
- **Variants** (1-2): These become your A/B options in the presentation
  - Variant A: First choice option
  - Variant B: Second choice option
  - Each variant has: name, description, image, optional price override

**Example**:
- Item: "DJ Service"
  - Variant A: "Gold Package" - €2,100
  - Variant B: "Platinum Package" - €3,500

### 2. Build Quote Presentation (Quote Terminal)

Navigate to `/app/quotes/new` to build your interactive quote:

#### Add Slides

Create your presentation flow with different slide types:
- **Intro**: Welcome slide
- **Choice**: A/B decision point (uses catalog item variants)
- **Add-on**: Optional extras
- **Review**: Summary slide

#### Connect Catalog Items to Slides

For **Choice** and **Add-on** slides:

1. Click "Select from Catalog" button
2. Search and select a catalog item
3. **Auto-population happens**:
   - Slide title = Item name
   - Option A = Variant 1 (name, description, price, image)
   - Option B = Variant 2 (name, description, price, image)
4. Options remain editable if you need to customize

#### Build Conditional Paths

- Set "Next Slide" for each option to create branching logic
- Different selections can lead to different paths
- Create a Zapier-like flow map in the "Flow Map" view

### 3. Preview & Test

Switch to **Preview** tab to experience the presentation as your client would:
- Navigate through slides
- See variant images
- View real-time pricing
- Test conditional paths

## Key Features

### Visual Flow Builder

- **Builder Tab**: Edit slides and connect catalog items
- **Flow Map Tab**: See your presentation logic as a diagram
- **Preview Tab**: Experience the client view

### Catalog Integration

- ✅ Select from existing catalog items
- ✅ Auto-populate variant details (A/B options)
- ✅ Images from variants display in presentation
- ✅ Pricing synced from catalog
- ✅ Still allows manual editing after selection

### Presentation Flow

Like Zapier's flow builder, you can:
- Add slides step-by-step
- Each slide represents a decision point
- Variants = the choices presented to the client
- Conditional paths based on selections
- Final result = configured product + total price

## Example Workflow

1. **Items Page**: Create "Event DJ Package" with two variants:
   - Gold: €2,100
   - Platinum: €3,500

2. **Quote Builder**: Create new quote
   - Add Intro slide: "Welcome to your custom event package"
   - Add Choice slide: Click "Select from Catalog" → Choose "Event DJ Package"
     - Option A auto-filled with "Gold" details
     - Option B auto-filled with "Platinum" details
   - Add Add-on slide: "Extra lighting package"
   - Add Review slide

3. **Preview**: Test the flow
   - Client sees two options with images
   - Selects Platinum package
   - Total updates in real-time
   - Portfolio assets match based on tags

4. **Client Journey**: Interactive presentation where:
   - Each click refines their product choice
   - Price updates live
   - Final result = their custom configured product

## Technical Details

### Data Structure

```typescript
QuoteSlide {
  catalogItemId?: string;  // Link to catalog item
  catalogItemName?: string; // Display name
  optionA?: {
    name: string;          // From variant 1
    description: string;
    price: number;
    imageUrl?: string;
    catalogItemId: string; // Reference
  };
  optionB?: {
    // From variant 2
  };
}
```

### Components

- `CatalogItemSelector`: Dialog to browse and select catalog items
- `NewQuoteBuilder`: Main quote builder with catalog integration
- Auto-population logic in `handleCatalogItemSelected`

## Next Steps

Consider implementing:
- Drag-and-drop slide reordering
- Duplicate slides
- Save as template
- Clone existing quotes
- Real-time collaboration
