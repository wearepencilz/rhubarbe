# Scripts Directory

This directory contains utility scripts for database operations, migrations, and data management.

## Available Scripts

### migrate-existing-products.ts

Migration script that adds availability fields to existing products for the preorder operations feature.

See [README-migrate-existing-products.md](./README-migrate-existing-products.md) for detailed documentation.

```bash
npx tsx scripts/migrate-existing-products.ts
```

### seed-import.ts

This script adapts legacy seed data to the current CMS schema without modifying the UI or existing fields.

## Usage

```bash
# Run the seed import
npx tsx scripts/seed-import.ts
```

## What It Does

The script maps your legacy data structure to the current CMS schema:

### Ingredients
- Maps `category` and `roles` directly (compatible types)
- Converts `tags` to `descriptors`
- Infers `allergens` and `dietaryFlags` from category and name
- Sets `seasonal` flag based on tags
- Adds required timestamps

### Flavours
- Maps `type` (Gelato → gelato, Sorbet → sorbet)
- Infers `baseStyle` from type (Gelato → dairy, Sorbet → fruit)
- Converts ingredient IDs to `FlavourIngredient` objects with display order
- Calculates `allergens` and `dietaryTags` from linked ingredients
- Maps eligibility flags (`canBeTwist`, `canBePint`, `canBeSandwich`)
- Sets `status` based on `isActive`
- Converts `tags` to `keyNotes`

### Formats
- Maps `itemCategory` to `category` (Soft Serve/Twist/Pint → frozen)
- Infers `servingStyle` from format type
- Maps flavour constraints (`minFlavours`, `maxFlavours`)
- Sets `allowMixedTypes` for Twist format
- Maps `allowsOptionalAddOns` to `canIncludeAddOns`

## Output

Creates/updates these files:
- `public/data/ingredients.json`
- `public/data/formats.json`
- `public/data/flavours.json`

## Extending the Script

To add more seed data, edit the arrays in `seed-import.ts`:
- `legacyIngredients`
- `legacyFormats`
- `legacyFlavours`

The mapping functions handle the conversion automatically.
