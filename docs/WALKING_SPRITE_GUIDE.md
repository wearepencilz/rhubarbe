# Walking Sprite System Guide

Complete guide for adding animated walking sprites to the Janine game platform.

## Overview

The walking sprite system allows you to create animated player characters with:
- Idle animation (standing still)
- Walk animation (moving left/right)
- Jump sprite (in the air)

## Quick Start

### 1. Create Sprite Assets

You need 3 sprite images:

**Idle Sprite** (32×48px recommended)
- Single frame showing character standing still
- PNG with transparency

**Walk Sprite Sheet** (128×48px for 4 frames)
- Horizontal sprite sheet with walk cycle frames
- Each frame should be same width (e.g., 4 frames × 32px = 128px total)
- All frames in one row

**Jump Sprite** (32×48px recommended)
- Single frame showing character jumping/in air
- PNG with transparency

### 2. Upload to CMS

1. Go to `/admin/sprites`
2. Click "Add New Sprite"
3. Fill in the form:
   - **Name**: Character name (e.g., "Vanilla Kid")
   - **Description**: Optional description
   - **Frame Width**: Width of single frame (e.g., 32)
   - **Frame Height**: Height of frame (e.g., 48)
   - **Walk Frame Count**: Number of frames in walk sheet (e.g., 4)
   - **Walk Frame Rate**: Animation speed in FPS (e.g., 10)
4. Upload your 3 sprite images
5. Click "Create Sprite"

### 3. Assign to Campaign

1. Go to `/admin/games/[campaign-id]`
2. Scroll to "Player Character" section
3. Select your sprite from the dropdown
4. Click "Save Changes"

## Technical Details

### Database Schema

```sql
CREATE TABLE walking_sprites (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Sprite URLs
  idle_sprite_url TEXT NOT NULL,
  walk_sprite_url TEXT NOT NULL,
  jump_sprite_url TEXT NOT NULL,
  
  -- Configuration
  frame_width INTEGER DEFAULT 32,
  frame_height INTEGER DEFAULT 48,
  walk_frame_count INTEGER DEFAULT 4,
  walk_frame_rate INTEGER DEFAULT 10,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Link to campaigns
ALTER TABLE campaigns 
ADD COLUMN sprite_id UUID REFERENCES walking_sprites(id);
```

### API Endpoints

**GET /api/sprites**
- Returns all walking sprites
- Response: `{ sprites: WalkingSprite[] }`

**POST /api/sprites**
- Create new sprite
- Requires authentication
- Body: `SpriteFormData`

**GET /api/sprites/[id]**
- Get single sprite
- Response: `{ sprite: WalkingSprite }`

**PUT /api/sprites/[id]**
- Update sprite
- Requires authentication

**DELETE /api/sprites/[id]**
- Delete sprite
- Requires authentication

### Game Integration

The sprite system integrates with Phaser game engine:

1. **Session Creation** (`/api/game/sessions`)
   - Fetches sprite config if campaign has `sprite_id`
   - Includes sprite URLs and animation config in response

2. **Game Scene** (`lib/game/scenes/GameScene.ts`)
   - Preloads sprite images and creates sprite sheet
   - Creates walk animation from sprite sheet
   - Switches between idle/walk/jump based on player state

3. **Player Movement**
   - Idle: Shows idle sprite when not moving
   - Walking: Plays walk animation when moving left/right
   - Jumping: Shows jump sprite when in air

## Sprite Creation Tips

### Recommended Sizes
- **Player**: 32×48px (width × height)
- **Walk Sheet**: frame_width × walk_frame_count × frame_height
  - Example: 32px × 4 frames = 128px × 48px

### Frame Count
- **2 frames**: Simple bob animation
- **4 frames**: Standard walk cycle
- **6-8 frames**: Smooth, detailed animation

### Frame Rate
- **6-8 FPS**: Slow, deliberate walk
- **10-12 FPS**: Normal walk speed
- **15+ FPS**: Fast, energetic movement

### File Format
- Use PNG with transparency
- Keep file sizes under 2MB per sprite
- Use pixel art style for retro aesthetic

### Walk Cycle Tips
1. Start with contact pose (foot planted)
2. Add passing pose (legs crossing)
3. Add opposite contact pose
4. Add opposite passing pose
5. Ensure first and last frames connect smoothly

## Example Sprite Sheet Layout

```
Walk Sprite Sheet (4 frames, 32×48px each = 128×48px total):

┌────────┬────────┬────────┬────────┐
│ Frame 1│ Frame 2│ Frame 3│ Frame 4│
│  (32px)│  (32px)│  (32px)│  (32px)│
│        │        │        │        │
│  48px  │  48px  │  48px  │  48px  │
│        │        │        │        │
└────────┴────────┴────────┴────────┘
```

## Migration to Production

### 1. Run Database Migration

```bash
# Connect to production database
psql $DATABASE_URL

# Run migration
\i lib/game/migrations/004_create_walking_sprites.sql
```

### 2. Upload Sprites via Admin

Use the admin interface at `/admin/sprites` to upload sprites in production.

### 3. Update Campaigns

Edit existing campaigns to assign sprites via `/admin/games/[id]`.

## Fallback Behavior

If no walking sprite is assigned:
- System falls back to static sprites (legacy)
- If no static sprites, uses default colored rectangles
- Game remains fully functional

## Troubleshooting

### Sprite Not Animating
- Check frame count matches actual frames in sprite sheet
- Verify frame width/height are correct
- Ensure walk sprite sheet is horizontal layout

### Sprite Appears Stretched
- Verify frame dimensions match actual sprite size
- Check that sprite sheet width = frame_width × frame_count

### Animation Too Fast/Slow
- Adjust frame rate (FPS) in sprite configuration
- Typical range: 8-12 FPS for walk cycles

### Sprite Not Loading
- Check sprite URLs are accessible
- Verify images uploaded successfully
- Check browser console for loading errors

## Admin Interface

### Sprite List (`/admin/sprites`)
- View all sprites with previews
- See sprite dimensions and frame counts
- Quick access to edit/delete

### Create Sprite (`/admin/sprites/new`)
- Upload form with file pickers
- Real-time preview of uploaded images
- Validation for required fields

### Edit Sprite (`/admin/sprites/[id]`)
- Update sprite properties
- Replace sprite images
- Toggle active/inactive status
- Delete sprite (with confirmation)

## Best Practices

1. **Naming**: Use descriptive names (e.g., "Vanilla Kid", "Chocolate Hero")
2. **Consistency**: Keep frame sizes consistent across all sprites
3. **Testing**: Test sprites in game before assigning to active campaigns
4. **Backups**: Keep original sprite files for future edits
5. **Performance**: Optimize PNG files to reduce load times

## Future Enhancements

Potential additions to the sprite system:
- Multiple walk directions (left/right specific animations)
- Additional states (hurt, celebrate, etc.)
- Sprite preview in admin with animation playback
- Bulk sprite upload
- Sprite templates/presets
- Animation editor in admin interface
