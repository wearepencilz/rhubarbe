# Taxonomy Migration - Unified Tag System

## What Changed

The project now uses a unified taxonomy system instead of separate services and categories lists. All tags (services, categories, and any other project classifications) are managed in one place.

## Benefits

- Single source of truth for all project tags
- Easier to manage and maintain
- Tags can be used flexibly as services OR categories
- Prevents duplicate tags across different lists
- Tracks usage count for each tag
- Supports future filtering and linking features

## Migration Summary

The migration script (`scripts/migrate-taxonomy.js`) automatically:
- Extracted all unique tags from existing projects
- Combined services and categories into one unified list
- Calculated usage counts for each tag
- Backed up old taxonomy structure
- Saved the new unified taxonomy to `settings.json`

## Current Taxonomy Structure

Each tag now has:
- `id`: Unique identifier
- `name`: Tag name (e.g., "Design", "Shopify Migration")
- `link`: Optional URL for filtering or info pages
- `type`: Classification (currently "general", can be extended)
- `usageCount`: Number of projects using this tag

## Managing Tags in CMS

### Location
CMS → Tags & Taxonomy

### Features
- Add new tags with the "+ Add Tag" button
- Drag and drop to reorder tags
- Edit tag names and links
- Remove unused tags (warns if tag is in use)
- See usage count for each tag

### Using Tags in Projects

When creating or editing a project:
- **Category**: Select ONE tag (single-select)
- **Services**: Select MULTIPLE tags (multi-select)
- Both fields use the same unified taxonomy list
- Can create new tags on-the-fly while editing projects

## Cleanup Recommendations

Run `node scripts/cleanup-taxonomy.js` to identify tags that might need merging.

Current issues found:
- "Design, development" (used 2×) - Should be split into separate "Design" and "Development" tags
- "Design,development,marketing" (used 1×) - Should be split into separate tags

### How to Merge Tags

1. Go to CMS → Tags & Taxonomy
2. Find the combined tag (e.g., "Design, development")
3. Note which projects use it
4. Edit those projects to use separate tags instead
5. Remove the combined tag
6. Save changes

## Technical Details

### Files Modified
- `src/cms/TaxonomyForm.jsx` - Now manages single unified list
- `src/cms/ProjectForm.jsx` - Uses unified taxonomy for both services and category
- `src/cms/CMSDashboard.jsx` - Updated navigation label
- `public/data/settings.json` - Contains new `taxonomy` array

### Data Structure

Before:
```json
{
  "taxonomyServices": [...],
  "taxonomyCategories": [...]
}
```

After:
```json
{
  "taxonomy": [
    {
      "id": "tag-1772125602371-0",
      "name": "Design",
      "link": "",
      "type": "general",
      "usageCount": 1
    }
  ],
  "taxonomyBackup": {
    "services": [...],
    "categories": [...],
    "migratedAt": "2026-02-26T..."
  }
}
```

## Future Enhancements

The unified taxonomy system is ready for:
- Tag-based filtering on public pages
- Tag detail pages with project listings
- Tag categories/types (service vs category vs industry)
- Tag hierarchies (parent/child relationships)
- Tag synonyms and aliases
- SEO optimization per tag
