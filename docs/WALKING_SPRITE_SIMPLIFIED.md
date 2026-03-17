# Walking Sprite System - Simplified Implementation

## Changes Made

The walking sprite system has been simplified to use direct uploads in the campaign editor instead of a separate sprite management interface.

## How It Works

### 1. Upload Sprites in Campaign Editor

Navigate to `/admin/games/[campaign-id]` and go to the "Game Assets" tab:

**Animated Walking Sprite Section:**
- Upload 3 sprite images:
  - **Idle Sprite**: Character standing still
  - **Walk Sprite Sheet**: Horizontal sprite sheet with walk frames
  - **Jump Sprite**: Character in air

- Configure animation settings:
  - **Frame Width**: Width of single frame (e.g., 32px)
  - **Frame Height**: Height of frame (e.g., 48px)
  - **Walk Frames**: Number of frames in walk sheet (e.g., 4)
  - **Frame Rate**: Animation speed in FPS (e.g., 10)

### 2. Fallback to Static Sprites

If no walk sprite sheet is uploaded, you can use static sprites:
- **Player Sprite**: Single image for character
- **Player Jump Sprite**: Single image for jumping

### 3. Game Integration

The game automatically:
- Shows idle sprite when standing still
- Plays walk animation when moving
- Shows jump sprite when in air
- Flips character direction based on movement

## Database Schema

Sprite configuration is stored directly in the `campaigns` table:

```sql
ALTER TABLE campaigns 
ADD COLUMN idle_sprite_url TEXT,
ADD COLUMN walk_sprite_url TEXT,
ADD COLUMN jump_sprite_url TEXT,
ADD COLUMN sprite_frame_width INTEGER DEFAULT 32,
ADD COLUMN sprite_frame_height INTEGER DEFAULT 48,
ADD COLUMN sprite_walk_frames INTEGER DEFAULT 4,
ADD COLUMN sprite_frame_rate INTEGER DEFAULT 10;
```

## Tabs in Campaign Editor

The campaign editor now has 3 organized tabs:

1. **Basic Settings**
   - Campaign name, title, description
   - Status and dates
   - Timer duration

2. **Rewards**
   - Winner count and total rewards
   - Reward type and description
   - Success messages

3. **Game Assets**
   - Animated walking sprites
   - Static sprites (fallback)
   - Other game assets (ice cream, ingredients, platforms, etc.)

## Migration

Run the updated migration:

```bash
psql $DATABASE_URL < lib/game/migrations/004_create_walking_sprites.sql
```

This adds the sprite fields to the campaigns table.

## Benefits of Simplified Approach

1. **No separate sprite management** - Upload directly in campaign
2. **Fewer clicks** - Everything in one place
3. **Per-campaign sprites** - Each campaign can have unique character
4. **Simpler workflow** - No need to create sprite library first
5. **Better organization** - Tabs group related settings

## Sprite Creation Tips

### Walk Sprite Sheet Layout

For a 4-frame walk cycle at 32×48px per frame:

```
Total size: 128×48px (4 frames × 32px width)

┌────────┬────────┬────────┬────────┐
│ Frame 1│ Frame 2│ Frame 3│ Frame 4│
└────────┴────────┴────────┴────────┘
```

### Recommended Settings

- **Casual walk**: 8-10 FPS, 4 frames
- **Energetic walk**: 12-15 FPS, 4-6 frames
- **Slow walk**: 6-8 FPS, 2-4 frames

### File Format

- PNG with transparency
- Under 2MB per file
- Pixel art style recommended

## Testing

1. Upload sprites in campaign editor
2. Save campaign
3. Play game at `/game/[campaign-id]`
4. Verify animations work correctly

## Backward Compatibility

- Existing campaigns continue working
- Static sprites still supported
- Falls back to colored rectangles if no sprites
