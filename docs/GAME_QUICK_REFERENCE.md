# Game Quick Reference

Quick reference for common game development tasks.

---

## Adjusting Game Physics

**File:** `lib/game/phaser-config.ts`

```typescript
// Make player jump higher
export const PLAYER_JUMP_VELOCITY = -520; // More negative = higher jump

// Make player move faster
export const PLAYER_SPEED = 200; // Higher = faster

// Adjust gravity
export const GRAVITY = 700; // Higher = falls faster
```

**After changing:** Existing campaigns will use new physics automatically on next play.

---

## Creating New Campaign with Custom Layout

**File:** `app/admin/games/new/CreateCampaignForm.tsx`

Update the `levelConfig` object in `handleSubmit`:

```typescript
const levelConfig = {
  platforms: [
    { x: 0, y: 358, width: 635, height: 16 },
    // Add more platforms...
  ],
  iceCreams: [
    { x: 915, y: 93 }, // Goal position
  ],
  ingredients: [
    { x: 128, y: 125 },
    { x: 518, y: 141 },
    { x: 884, y: 342 },
  ],
  hazards: [],
  spawnPoint: { x: 48, y: 286 },
  worldWidth: 1208, // Total scrollable width
};
```

**Coordinate System:**
- Origin (0,0) is top-left
- X increases to the right
- Y increases downward
- Game viewport: 512×448px
- Platform height: 16px recommended

---

## Updating Existing Campaign Layout

**Option 1: Via Admin UI**
1. Go to `/admin/games/[id]`
2. Scroll to "Level Configuration" (if available)
3. Edit JSON directly
4. Save changes

**Option 2: Via Script**
Create `scripts/update-campaign-layout.ts`:

```typescript
import { updateById } from '@/lib/db-game';

const newLayout = {
  platforms: [...],
  iceCreams: [...],
  ingredients: [...],
  spawnPoint: {...},
  worldWidth: 1208,
};

await updateById('campaigns', 'campaign-id-here', {
  level_config: JSON.stringify(newLayout)
});
```

Run: `npx tsx scripts/update-campaign-layout.ts`

---

## Changing Winner Count

**For New Campaigns:**
Set in create form at `/admin/games/new`

**For Existing Campaigns:**
1. Go to `/admin/games/[id]`
2. Update "Winner Count" field
3. Save changes

**In Code:**
```typescript
// Default winner count
winner_count: 100, // First 100 completers get rewards
```

---

## Customizing Reward Messages

**File:** `app/admin/games/[id]/CampaignEditForm.tsx` or create form

```typescript
reward_type: 'Free Scoop',
reward_description: 'Redeem for one free scoop of any flavour',
ticket_success_title: '🎉 You Won!',
ticket_success_message: 'Show this code at the counter to claim your reward!',
```

These appear on the results screen when a player wins.

---

## Adding Custom Sprites

**Via Admin UI:**
1. Go to `/admin/games/[id]`
2. Scroll to "Game Assets (Sprites)"
3. Upload images for each asset type
4. Save changes

**Recommended Sizes:**
- Player: 32×48px
- Ice Cream: 32×32px
- Ingredient: 24×24px
- Platform: Any width, 16px height (tileable)
- Background: Match world width × 448px (or tileable)
- Hazard: 20×20px

**Format:** PNG with transparency recommended

---

## Changing Game Resolution

**File:** `lib/game/phaser-config.ts`

```typescript
export const GAME_WIDTH = 512;  // Horizontal resolution
export const GAME_HEIGHT = 448; // Vertical resolution
```

**Important:** If you change resolution:
1. Update all platform Y positions proportionally
2. Update spawn point
3. Update fall threshold in GameScene.ts
4. Test all jumps are still reachable

---

## Adjusting Timer Duration

**Per Campaign:**
Set in campaign form (10-300 seconds)

**Default:**
```typescript
timer_duration: 60, // seconds
```

---

## Modifying Score Formula

**File:** `lib/game/scenes/GameScene.ts`

In `collectIceCream` method:

```typescript
// Current formula
this.score = 1000 + (this.timeRemaining * 10) + (this.ingredientsCollected * 50);

// Examples:
// More time bonus: (this.timeRemaining * 20)
// More ingredient bonus: (this.ingredientsCollected * 100)
// Add difficulty multiplier: * difficultyLevel
```

---

## Changing Fall Detection

**File:** `lib/game/scenes/GameScene.ts`

In `update` method:

```typescript
// Current threshold
if (this.player.y > 460) {
  this.endGame(false);
}

// Adjust 460 to change when player dies from falling
// Higher number = more forgiving
// Lower number = stricter
```

---

## Adding More Ingredients

**In Level Config:**
```typescript
ingredients: [
  { x: 128, y: 125 },
  { x: 518, y: 141 },
  { x: 884, y: 342 },
  { x: 700, y: 200 }, // Add more...
],
```

**Note:** Score formula uses `ingredientsCollected` count automatically.

---

## Changing Animation Speed

**File:** `lib/game/scenes/GameScene.ts`

In `createIngredients` method:

```typescript
this.tweens.add({
  targets: ingredient,
  y: pos.y - 10,      // Distance to move (10px up)
  duration: 1500,     // Time in ms (1500 = 1.5 seconds)
  yoyo: true,         // Return to start
  repeat: -1,         // Infinite loop
  ease: 'Sine.easeInOut',
});
```

---

## Debugging Tips

### Enable Physics Debug Mode
**File:** `lib/game/phaser-config.ts`

```typescript
physics: {
  default: 'arcade',
  arcade: {
    gravity: { y: GRAVITY, x: 0 },
    debug: true, // Shows collision boxes
  },
},
```

### Console Logging
Add to `GameScene.ts`:

```typescript
console.log('Player position:', this.player.x, this.player.y);
console.log('Velocity:', this.player.body.velocity);
console.log('Touching down:', this.player.body.touching.down);
```

### Check Database
```bash
# View campaigns
psql $DATABASE_URL -c "SELECT id, name, status, winner_count FROM campaigns;"

# View scores
psql $DATABASE_URL -c "SELECT player_name, score, completion_time, completion_order FROM scores WHERE campaign_id = 'xxx';"

# View rewards
psql $DATABASE_URL -c "SELECT claim_code, player_name, redeemed_at FROM rewards WHERE campaign_id = 'xxx';"
```

---

## Common Issues

### "Player can't reach platform"
- Increase `PLAYER_JUMP_VELOCITY` (more negative)
- Or lower platform Y position
- Or add intermediate platform

### "Player falls through platform"
- Check platform Y position is correct
- Ensure platform is in `platforms` array
- Verify collision setup in `setupCollisions`

### "Background doesn't tile"
- Check background width matches world width
- Or use tileable texture
- See `createBackground` in GameScene.ts

### "Reward not allocated"
- Check winner_count setting
- Verify completion_order is incrementing
- Check reward_total > 0
- See console logs in score submission

### "Leaderboard not updating"
- Check auto-refresh is enabled (5 second interval)
- Verify API endpoint returns data
- Check browser console for errors

---

## File Locations

### Game Logic
- `lib/game/phaser-config.ts` - Physics constants
- `lib/game/scenes/GameScene.ts` - Main game loop
- `lib/game/reward-allocator.ts` - Reward logic

### Components
- `components/game/GameContainer.tsx` - Game wrapper
- `components/game/LeaderboardDisplay.tsx` - Leaderboard UI

### Admin
- `app/admin/games/` - All admin pages
- `app/api/game/` - All API endpoints

### Database
- `lib/db-game.ts` - Database functions
- `lib/game/migrations/` - Schema migrations

---

## Testing Workflow

1. **Create test campaign**
   ```
   Name: Test Campaign
   Status: Active
   Winner Count: 5
   Timer: 30 seconds
   ```

2. **Play game multiple times**
   - Test with different names
   - Try to complete quickly
   - Try to fail (run out of time)
   - Try to fall off platforms

3. **Check leaderboard**
   - Verify "First 5 Winners" tab shows correct players
   - Verify "Fastest Times" tab shows all players
   - Check winner badges appear

4. **Verify rewards**
   - First 5 completers should get claim codes
   - 6th+ completers should not get rewards
   - Check reward messages are correct

5. **Test admin functions**
   - Edit campaign settings
   - Upload custom sprites
   - Duplicate campaign
   - Delete campaign

---

## Production Checklist

- [ ] Set winner_count to desired value (e.g., 100)
- [ ] Set reward_total to match physical inventory
- [ ] Upload custom sprites (optional)
- [ ] Test game on mobile devices
- [ ] Verify reward redemption process
- [ ] Set campaign dates correctly (EST timezone)
- [ ] Test with multiple concurrent players
- [ ] Monitor database performance
- [ ] Set up reward redemption tracking

---

**Last Updated:** March 10, 2026
