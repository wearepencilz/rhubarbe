# Game Map Design Guide

## Overview

The pixel art game uses a coordinate-based level system where you define platform positions, ingredient locations, and the ice cream goal. This guide will help you design custom maps.

## Game Dimensions

- **Game Width**: 512px (visible screen)
- **Game Height**: 448px (visible screen)
- **World Width**: 1024px (default - 2 screens wide, scrolls horizontally)
- **Aspect Ratio**: 512:448 (3:4 vertical, like classic Mario)

## Sprite Sizes

### Character & Objects
- **Player Sprite**: 32×48px (width × height)
- **Ice Cream**: 32×32px (square)
- **Ingredients**: 24×24px (square)
- **Hazards**: 20×20px (square)

### Platforms
- **Height**: 16px (recommended for consistency)
- **Width**: Variable (80-400px typical)
- **Texture**: Any size, should be tileable/repeatable pattern

### Background
- **Full World**: 1024×448px (covers entire scrolling area)
- **Single Screen**: 512×448px (repeats if smaller)

## Creating Platform Textures

Platform textures should be **tileable** - they repeat horizontally to fill the platform width.

### Recommended Sizes
- **16×16px**: Classic tile size, repeats cleanly
- **32×16px**: Wider pattern
- **64×16px**: More detailed pattern

### Tips
- Make edges seamless (left edge matches right edge)
- Use pixel art style for consistency
- Keep it simple - platforms are background elements
- Test by placing side-by-side to check tiling

## Map Layout Structure

```json
{
  "platforms": [
    { "x": 0, "y": 400, "width": 160, "height": 16 }
  ],
  "iceCreams": [
    { "x": 900, "y": 360 }
  ],
  "ingredients": [
    { "x": 140, "y": 260 }
  ],
  "hazards": [
    { "x": 450, "y": 530 }
  ],
  "spawnPoint": { "x": 40, "y": 360 },
  "worldWidth": 1024
}
```

## Coordinate System

- **Origin (0,0)**: Top-left corner
- **X-axis**: Left to right (0 to worldWidth)
- **Y-axis**: Top to bottom (0 to 448)

### Key Y-Coordinates
- **Top of screen**: y = 0
- **Mid-level platforms**: y = 280-320 (good for ingredients)
- **Ground level**: y = 400 (bottom platforms)
- **Bottom of screen**: y = 448
- **Fall threshold**: y > 460 (player dies)

## Design Tips

### Platform Placement
1. **Ground Level** (y=400): Main walking surface with gaps
   - Leave 60-80px gaps for challenge
   - Player falls through gaps = game over

2. **Mid-Level** (y=280-320): Platforms for ingredients
   - Vary heights for visual interest (±20-40px)
   - Space 80-120px apart horizontally
   - Make them jumpable (player can reach from ground or other platforms)

3. **Platform Width**: 80-160px typical
   - Too narrow = frustrating
   - Too wide = boring

### Ingredient Placement
- Place 20-40px above platforms (floating effect)
- Spread across the level (not all in one area)
- Put some on higher platforms for challenge
- Typical: 3-5 ingredients per level

### Ice Cream Goal
- Place at the end of the level (x > 800 for 1024px world)
- On a platform or slightly above ground
- Should be reachable after collecting all ingredients

### Spawn Point
- Start of level (x = 40-80)
- On a platform (y = platform.y - 48 to account for player height)

## Example Layouts

### Easy Layout (Beginner-Friendly)
```json
{
  "platforms": [
    { "x": 0, "y": 400, "width": 200, "height": 16 },
    { "x": 280, "y": 400, "width": 200, "height": 16 },
    { "x": 560, "y": 400, "width": 464, "height": 16 },
    { "x": 150, "y": 320, "width": 100, "height": 16 },
    { "x": 400, "y": 320, "width": 100, "height": 16 }
  ],
  "iceCreams": [{ "x": 900, "y": 360 }],
  "ingredients": [
    { "x": 190, "y": 280 },
    { "x": 440, "y": 280 }
  ],
  "spawnPoint": { "x": 50, "y": 352 },
  "worldWidth": 1024
}
```

### Medium Layout (Varied Heights)
```json
{
  "platforms": [
    { "x": 0, "y": 400, "width": 160, "height": 16 },
    { "x": 220, "y": 400, "width": 160, "height": 16 },
    { "x": 440, "y": 400, "width": 160, "height": 16 },
    { "x": 660, "y": 400, "width": 364, "height": 16 },
    { "x": 100, "y": 300, "width": 80, "height": 16 },
    { "x": 240, "y": 280, "width": 80, "height": 16 },
    { "x": 400, "y": 320, "width": 80, "height": 16 },
    { "x": 580, "y": 290, "width": 80, "height": 16 },
    { "x": 750, "y": 310, "width": 80, "height": 16 }
  ],
  "iceCreams": [{ "x": 900, "y": 360 }],
  "ingredients": [
    { "x": 140, "y": 260 },
    { "x": 280, "y": 240 },
    { "x": 620, "y": 250 }
  ],
  "spawnPoint": { "x": 40, "y": 352 },
  "worldWidth": 1024
}
```

### Hard Layout (Longer, More Gaps)
```json
{
  "platforms": [
    { "x": 0, "y": 400, "width": 120, "height": 16 },
    { "x": 200, "y": 400, "width": 120, "height": 16 },
    { "x": 400, "y": 400, "width": 120, "height": 16 },
    { "x": 600, "y": 400, "width": 120, "height": 16 },
    { "x": 800, "y": 400, "width": 120, "height": 16 },
    { "x": 1000, "y": 400, "width": 224, "height": 16 },
    { "x": 150, "y": 280, "width": 80, "height": 16 },
    { "x": 350, "y": 260, "width": 80, "height": 16 },
    { "x": 550, "y": 300, "width": 80, "height": 16 },
    { "x": 750, "y": 270, "width": 80, "height": 16 }
  ],
  "iceCreams": [{ "x": 1150, "y": 360 }],
  "ingredients": [
    { "x": 190, "y": 240 },
    { "x": 390, "y": 220 },
    { "x": 590, "y": 260 },
    { "x": 790, "y": 230 }
  ],
  "spawnPoint": { "x": 40, "y": 352 },
  "worldWidth": 1280
}
```

## Visual Design Tools

### Option 1: Graph Paper Method
1. Print grid paper (1 square = 16px)
2. Draw your level layout
3. Count squares to get coordinates
4. Convert to JSON

### Option 2: Image Editor (Recommended)
1. Create 1024×448px canvas in Photoshop/GIMP/Aseprite
2. Enable grid (16px × 16px)
3. Draw rectangles for platforms
4. Place dots for ingredients/ice cream
5. Note coordinates from ruler/info panel
6. Convert to JSON

### Option 3: Online Tools
- **Tiled Map Editor**: Free tilemap editor (export as JSON)
- **Piskel**: Pixel art editor with grid
- **Aseprite**: Professional pixel art tool

## Testing Your Map

1. Edit campaign in admin panel
2. Update `level_config` JSON
3. Save and test the game
4. Iterate based on playability

### Common Issues
- **Can't reach platform**: Increase platform width or reduce gap
- **Too easy**: Add more gaps, vary heights more
- **Too hard**: Reduce gaps, add more platforms
- **Ingredients unreachable**: Check platform positions

## Physics Reference

- **Player Speed**: 200 px/s horizontal
- **Jump Height**: ~120px (can reach platforms 100px above)
- **Jump Distance**: ~150px horizontal (can cross 130px gaps)
- **Gravity**: 800 px/s²

## Uploading Custom Sprites

### In Admin Panel
1. Go to campaign edit page
2. Scroll to "Game Assets (Sprites)" section
3. Click "Choose File" for each sprite type
4. Upload PNG files (max 2MB)
5. Click "Save Changes"

### Sprite Requirements
- **Format**: PNG with transparency
- **Style**: Pixel art (no anti-aliasing)
- **Size**: Match recommended dimensions above
- **File Size**: Under 2MB per sprite

## Advanced: Custom World Width

You can make longer levels by increasing `worldWidth`:
- **1024px**: 2 screens (default)
- **1536px**: 3 screens
- **2048px**: 4 screens

Longer levels = more challenge but also more time needed.

## Need Help?

The default level configuration in the campaign creation form is a good starting point. Copy it and modify coordinates to create your custom layout!
