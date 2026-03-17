# Platform Sprites Guide

## Overview

The platform sprite system adds visual variety to your game by supporting 4 different platform types:
- **Wood Platform** - Brown wooden platform with grain texture
- **Stone Platform** - Gray stone blocks with mortar lines
- **Ice Platform** - Light blue ice with crystalline highlights
- **Rope Bridge** - Wooden planks with rope (automatically used for highest platform)

## Sprite Specifications

Each platform sprite must be **120×40 pixels** (2x resolution) and divided into 3 sections:

```
┌─────────────┬─────────────┬─────────────┐
│   Start     │   Middle    │    End      │
│   40×40px   │   40×40px   │   40×40px   │
└─────────────┴─────────────┴─────────────┘
```

- **Start section** (0-40px): Left edge with decorative cap
- **Middle section** (40-80px): Repeatable center pattern
- **End section** (80-120px): Right edge with decorative cap

The game will automatically:
1. Use the bridge sprite for the highest platform
2. Randomize wood, stone, and ice sprites for other platforms
3. Scale sprites to display at 60×20px (1x resolution)
4. Apply 3-slice scaling for platforms wider than 60px

## File Format

- **Format**: PNG with transparency
- **Size**: 120×40 pixels
- **Resolution**: 2x (displays as 60×20px in-game)
- **Max file size**: 2MB per sprite

## Default Sprites

Default SVG templates are provided in `public/game/sprites/`:
- `platform-wood.svg`
- `platform-stone.svg`
- `platform-ice.svg`
- `bridge-rope.svg`

Convert these to PNG at 120×40px for use in the game.

## Database Migration

Run the migration to add platform sprite fields to the database:

```bash
# Development
npm run tsx scripts/run-platform-sprites-migration.ts

# Production (via Vercel CLI or direct database access)
psql $DATABASE_URL < lib/game/migrations/007_add_platform_sprites.sql
```

This adds 4 new columns to the `campaigns` table:
- `platform_wood_sprite_url`
- `platform_stone_sprite_url`
- `platform_ice_sprite_url`
- `bridge_sprite_url`

## Usage in CMS

1. Go to `/admin/games/[id]` to edit a campaign
2. Click the "Game Assets" tab
3. Scroll to "Platform Sprites (New!)" section
4. Upload your 4 platform sprites:
   - Wood Platform
   - Stone Platform
   - Ice Platform
   - Rope Bridge

The game will automatically use these sprites when players start the game.

## Technical Implementation

### Database Schema

```sql
ALTER TABLE campaigns
ADD COLUMN platform_wood_sprite_url TEXT,
ADD COLUMN platform_stone_sprite_url TEXT,
ADD COLUMN platform_ice_sprite_url TEXT,
ADD COLUMN bridge_sprite_url TEXT;
```

### Game Scene Integration

The `GameScene` class in `lib/game/scenes/GameScene.ts`:
1. Loads platform sprites in `preload()`
2. Detects highest platform in `createPlatforms()`
3. Uses bridge sprite for highest platform
4. Randomizes other platform types
5. Applies 3-slice scaling via `createPlatformSprite()`

### API Integration

Platform sprite URLs are passed through:
1. Campaign edit form → API route
2. API route → Database
3. Game session API → Game scene
4. Game scene → Phaser renderer

## Fallback Behavior

If platform sprites are not uploaded:
1. Falls back to legacy `platform_sprite_url` (single texture)
2. If no legacy texture, uses default brown rectangles

## Example: Converting SVG to PNG

Using ImageMagick:

```bash
cd public/game/sprites
convert platform-wood.svg -resize 120x40 platform-wood.png
convert platform-stone.svg -resize 120x40 platform-stone.png
convert platform-ice.svg -resize 120x40 platform-ice.png
convert bridge-rope.svg -resize 120x40 bridge-rope.png
```

Or use an online converter like:
- https://cloudconvert.com/svg-to-png
- https://convertio.co/svg-png/

## Troubleshooting

**Sprites not appearing in game:**
- Check that sprites are exactly 120×40 pixels
- Verify PNG format with transparency
- Ensure file size is under 2MB
- Check browser console for loading errors

**Platforms look stretched:**
- Verify sprite dimensions are correct
- Check that middle section tiles seamlessly
- Ensure start/end sections are distinct

**Bridge not appearing on highest platform:**
- Verify bridge sprite is uploaded
- Check that highest platform is correctly detected
- Ensure bridge sprite follows 3-section format

## Future Enhancements

Potential improvements:
- Platform-specific physics (ice = slippery)
- Animated platform sprites
- Per-platform sprite assignment in level editor
- Platform sprite preview in CMS
- Sprite validation on upload
