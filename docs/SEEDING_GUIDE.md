# Database Seeding Guide

This guide explains how to seed your Janine CMS with initial ingredient and flavour data.

## Overview

The seeding system allows you to populate your database with predefined data in three ways:
1. **Built-in seed data** - Use the included example data
2. **Upload custom files** - Upload your own JSON seed files
3. **Download examples** - Download example files to learn the format

## Accessing Seed Pages

### Ingredients
- Navigate to `/admin/ingredients` and click "Seed Data" button
- Or go directly to `/admin/ingredients/seed`

### Flavours
- Navigate to `/admin/flavours` and click "Seed Data" button
- Or go directly to `/admin/flavours/seed`

### Combined Seeding
- Go to `/admin/seed` to seed both ingredients and flavours at once

## Seeding Modes

### Skip Existing (Recommended)
- Only adds items that don't already exist in the database
- Safe for production use
- Skips items with matching IDs

### Merge
- Updates existing items by ID
- Adds new items that don't exist
- Use with caution - will overwrite existing data

### Replace All (Destructive)
- Deletes all existing data
- Replaces with seed data
- Cannot be undone - use only for fresh setups

## Built-in Seed Data

### Ingredients (22 items)
- Dairy bases: Milk, Cream, Browned Butter
- Fruits: White Peaches, Strawberries, Watermelons, Raspberries, Citrus
- Herbs: Basil, Mint, Thyme
- Specialty: Spruce Tip, Madagascar Vanilla, Tajín, Sun-Dried Mole
- And more...

### Flavours (10 items)
Classic archived flavour pairings:
- Grilled Corn (gelato) + Wild Tomatoes (sorbet)
- Basil Lemon (gelato) + Raspberry (sorbet)
- Mint Lime (gelato) + Melon (sorbet)
- Spruce Tip (gelato) + Wild Blueberry (sorbet)
- Vanilla (gelato) + Strawberry Thyme (sorbet)

## Using the Seed Pages

### 1. Seed from Built-in Data
1. Select your seeding mode (Skip/Merge/Replace)
2. Click "Seed from Built-in Data"
3. Confirm the action
4. View results and navigate to the data

### 2. Upload Custom Seed File
1. Download the example file first to learn the format
2. Modify the JSON file with your data
3. Select your seeding mode
4. Click "Choose File" and select your JSON file
5. Click "Upload and Seed"
6. View results

### 3. Download Example File
1. Click "Download Example Seed File"
2. Open the JSON file to see the format
3. Customize with your own data
4. Upload using the upload feature

## File Format

### Ingredient Seed Format
```json
[
  {
    "id": "unique-id",
    "name": "Ingredient Name",
    "slug": "ingredient-slug",
    "category": "Dairy",
    "roles": ["Base", "Primary Flavour"],
    "tags": ["Creamy", "Rich"],
    "origin": "Location",
    "notes": "Description",
    "isActive": true
  }
]
```

### Flavour Seed Format
```json
[
  {
    "id": "unique-id",
    "name": "Flavour Name",
    "slug": "flavour-slug",
    "type": "Gelato",
    "status": "Active",
    "description": "Full description",
    "shortDescription": "Short description",
    "ingredientIds": ["milk", "cream", "vanilla"],
    "primaryIngredientIds": ["vanilla"],
    "optionalIngredientIds": [],
    "defaultOfferingFormats": ["Soft Serve", "Pint"],
    "canBeTwist": true,
    "canBePint": true,
    "canBeSandwich": false,
    "canBeTasting": true,
    "dietaryNotes": ["Contains dairy"],
    "tags": ["Classic", "Creamy"],
    "isActive": true
  }
]
```

## Important Notes

1. **Seed ingredients before flavours** - Flavours reference ingredient IDs
2. **IDs must be unique** - Duplicate IDs will cause conflicts in merge/skip modes
3. **Validate JSON** - Ensure your JSON is valid before uploading
4. **Backup data** - Always backup before using "Replace All" mode
5. **Test first** - Use "Skip" mode first to test your seed data

## API Endpoints

### Ingredients
- `POST /api/ingredients/seed?mode=skip` - Seed from built-in data
- `POST /api/ingredients/seed/upload?mode=skip` - Upload custom file
- `GET /api/ingredients/seed/download` - Download example file

### Flavours
- `POST /api/flavours/seed?mode=skip` - Seed from built-in data
- `POST /api/flavours/seed/upload?mode=skip` - Upload custom file
- `GET /api/flavours/seed/download` - Download example file

## Troubleshooting

### Upload fails with "Invalid format"
- Ensure your file is valid JSON
- Check that the root element is an array
- Verify all required fields are present

### Some items are skipped
- Check for duplicate IDs in your seed data
- Verify items don't already exist in the database
- Use "Merge" mode to update existing items

### Flavours fail to seed
- Ensure all referenced ingredient IDs exist
- Seed ingredients first before flavours
- Check that ingredient IDs match exactly

## Seed File Locations

Built-in seed data is located at:
- `lib/seeds/ingredients.ts` - Ingredient seed data
- `lib/seeds/flavours.ts` - Flavour seed data

You can modify these files to change the built-in seed data.
