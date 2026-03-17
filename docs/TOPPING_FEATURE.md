# Topping Feature

## Overview

Offerings can now have toppings added to them. Toppings are a special type of Flavour that can be optionally added to any offering (e.g., Tajín on watermelon sorbet, hot fudge on vanilla gelato).

## Changes Made

### 1. Type System Updates (`types/index.ts`)

#### New FlavourType
Added `'topping'` to the `FlavourType` enum:
```typescript
export type FlavourType = 
  | 'gelato'
  | 'sorbet'
  | 'special'
  | 'tasting-component'
  | 'topping';  // NEW: Toppings/sauces (e.g., Tajin, hot fudge)
```

#### Updated Offering Interface
Added `toppingIds` field to track available toppings:
```typescript
export interface Offering {
  // ... existing fields
  toppingIds?: string[];  // NEW: Optional toppings (references to Flavour.id where type='topping')
  // ... rest of fields
}
```

#### Updated OfferingFull Interface
Added `toppings` field for hydrated topping data:
```typescript
export interface OfferingFull extends Offering {
  format: Format;
  primaryFlavours: Flavour[];
  secondaryFlavours?: Flavour[];
  components?: Component[];
  toppings?: Flavour[];  // NEW: Toppings (where type='topping')
}
```

### 2. Availability Dates

The `Offering` interface already includes:
- `availabilityStart?: string` - ISO 8601 date when offering becomes available
- `availabilityEnd?: string` - ISO 8601 date when offering is no longer available

These fields control when an offering is visible and orderable.

### 3. Seed Data (`lib/seeds/flavours.ts`)

Added three example topping flavours:

1. **Tajín** - Chili-lime seasoning (vegan, gluten-free)
2. **Hot Fudge** - Warm chocolate sauce (contains dairy)
3. **Olive Oil Drizzle** - EVOO with sea salt (vegan, gluten-free)

## Usage Examples

### Creating an Offering with Toppings

```typescript
const offering: Offering = {
  id: "watermelon-sorbet-cup",
  internalName: "Watermelon Sorbet Cup",
  publicName: "Watermelon Sorbet",
  slug: "watermelon-sorbet-cup",
  status: "active",
  formatId: "cup-format-id",
  primaryFlavourIds: ["watermelon-sorbet-id"],
  toppingIds: ["tajin-topping", "olive-oil-drizzle"], // Available toppings
  availabilityStart: "2026-06-01T00:00:00Z",  // Available from June 1
  availabilityEnd: "2026-08-31T23:59:59Z",    // Until August 31
  price: 650,
  // ... other fields
};
```

### Querying Toppings

To get all available toppings:
```typescript
const toppings = await getFlavours().then(flavours => 
  flavours.filter(f => f.type === 'topping' && f.status === 'active')
);
```

### Admin UI Considerations

When building the admin interface for offerings:

1. **Topping Selector**: Show only flavours where `type === 'topping'`
2. **Date Pickers**: Use `availabilityStart` and `availabilityEnd` for scheduling
3. **Validation**: Ensure topping IDs reference valid Flavour records with `type='topping'`

### Customer-Facing UI

When displaying offerings to customers:

1. **Check Availability**: Filter offerings by current date against `availabilityStart`/`availabilityEnd`
2. **Show Toppings**: Display available toppings as optional add-ons
3. **Pricing**: Toppings can have their own pricing logic (to be implemented in cart/checkout)

## Database Queries

### Get Offerings with Toppings (Hydrated)

```typescript
async function getOfferingWithToppings(offeringId: string): Promise<OfferingFull> {
  const offering = await getOffering(offeringId);
  const allFlavours = await getFlavours();
  
  return {
    ...offering,
    toppings: offering.toppingIds
      ? allFlavours.filter(f => offering.toppingIds.includes(f.id))
      : undefined
  };
}
```

### Get Active Offerings by Date Range

```typescript
function getActiveOfferings(date: Date = new Date()): Offering[] {
  const offerings = await getOfferings();
  const isoDate = date.toISOString();
  
  return offerings.filter(o => {
    const afterStart = !o.availabilityStart || o.availabilityStart <= isoDate;
    const beforeEnd = !o.availabilityEnd || o.availabilityEnd >= isoDate;
    return o.status === 'active' && afterStart && beforeEnd;
  });
}
```

## Next Steps

To fully implement this feature, you'll need to:

1. **Admin UI**: Add topping selector to offering create/edit forms
2. **API Routes**: Update offering CRUD endpoints to handle `toppingIds`
3. **Validation**: Ensure toppingIds reference valid topping-type flavours
4. **Customer UI**: Add topping selection to product pages and cart
5. **Pricing Logic**: Implement topping pricing (free vs. paid add-ons)
6. **Shopify Sync**: Decide how toppings map to Shopify variants or line items
