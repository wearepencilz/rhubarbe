# Walking Sprite System - Deployment Checklist

## Files Created

### Types
- `types/sprite.ts` - TypeScript interfaces for walking sprites

### Database
- `lib/game/migrations/004_create_walking_sprites.sql` - Database schema

### API Routes
- `app/api/sprites/route.ts` - GET (list), POST (create)
- `app/api/sprites/[id]/route.ts` - GET, PUT, DELETE single sprite

### Admin Pages
- `app/admin/sprites/page.tsx` - Sprite list view
- `app/admin/sprites/new/page.tsx` - Create new sprite
- `app/admin/sprites/[id]/page.tsx` - Edit sprite

### Game Engine Updates
- `lib/game/scenes/GameScene.ts` - Added sprite animation support
- `app/api/game/sessions/route.ts` - Added sprite config to session response
- `components/game/GameContainer.tsx` - Pass sprite config to game scene

### Admin Updates
- `app/admin/games/[id]/CampaignEditForm.tsx` - Added sprite selector

### Documentation
- `WALKING_SPRITE_GUIDE.md` - Complete usage guide
- `WALKING_SPRITE_DEPLOYMENT.md` - This file

## Deployment Steps

### 1. Database Migration (Production)

```bash
# Connect to production database
psql $DATABASE_URL

# Run migration
\i lib/game/migrations/004_create_walking_sprites.sql

# Verify tables created
\dt walking_sprites
\d campaigns
```

Expected output:
- `walking_sprites` table created
- `campaigns.sprite_id` column added

### 2. Deploy Code

```bash
# Commit changes
git add .
git commit -m "Add walking sprite system with CMS integration"

# Push to production
git push origin main

# Or deploy via Vercel
vercel --prod
```

### 3. Verify Deployment

1. **Admin Access**
   - Navigate to `/admin/sprites`
   - Should see empty sprite list with "Add New Sprite" button

2. **Create Test Sprite**
   - Click "Add New Sprite"
   - Upload test sprites (or use placeholders)
   - Verify sprite appears in list

3. **Assign to Campaign**
   - Go to `/admin/games/[campaign-id]`
   - See sprite dropdown in "Player Character" section
   - Select test sprite and save

4. **Test in Game**
   - Play game at `/game/[campaign-id]`
   - Verify animated character appears
   - Check walk animation plays when moving
   - Verify jump sprite shows when in air

## Environment Variables

No new environment variables required. Uses existing:
- `DATABASE_URL` or `POSTGRES_URL` - PostgreSQL connection
- NextAuth configuration for admin authentication

## Database Indexes

The migration creates:
```sql
CREATE INDEX idx_walking_sprites_active ON walking_sprites(is_active);
```

This optimizes queries for active sprites in the campaign editor.

## API Authentication

Sprite management endpoints require authentication:
- GET endpoints: Public (for game loading)
- POST/PUT/DELETE: Require NextAuth session

## File Upload Integration

Sprites use existing upload system:
- Development: `/public/uploads/`
- Production: Vercel Blob (via `/api/upload`)

No additional configuration needed.

## Backward Compatibility

The system maintains full backward compatibility:

1. **Existing Campaigns**: Continue using static sprites or defaults
2. **No Sprite Assigned**: Falls back to legacy behavior
3. **Database**: `sprite_id` column is nullable with `ON DELETE SET NULL`

## Testing Checklist

### Admin Interface
- [ ] Can access `/admin/sprites`
- [ ] Can create new sprite
- [ ] Can upload sprite images
- [ ] Can edit existing sprite
- [ ] Can delete sprite
- [ ] Sprite appears in campaign editor dropdown

### Game Integration
- [ ] Sprite loads in game
- [ ] Idle animation shows when standing
- [ ] Walk animation plays when moving
- [ ] Jump sprite shows when in air
- [ ] Character flips direction correctly
- [ ] Falls back to defaults if sprite missing

### API Endpoints
- [ ] GET `/api/sprites` returns list
- [ ] POST `/api/sprites` creates sprite (authenticated)
- [ ] GET `/api/sprites/[id]` returns single sprite
- [ ] PUT `/api/sprites/[id]` updates sprite (authenticated)
- [ ] DELETE `/api/sprites/[id]` removes sprite (authenticated)

## Rollback Plan

If issues occur, rollback is safe:

1. **Code Rollback**: Previous deployment continues working
2. **Database**: New columns/tables don't affect existing functionality
3. **Campaigns**: Will use static sprites or defaults

To fully rollback database changes:
```sql
-- Remove sprite_id from campaigns
ALTER TABLE campaigns DROP COLUMN IF EXISTS sprite_id;

-- Drop walking_sprites table
DROP TABLE IF EXISTS walking_sprites;
```

## Performance Considerations

### Database
- Sprite queries are minimal (only on campaign load)
- Indexed by `is_active` for fast filtering
- No impact on game session creation performance

### Asset Loading
- Sprites loaded via Phaser's asset loader
- Cached by browser after first load
- Typical sprite sheet: 10-50KB

### Game Performance
- Animation uses Phaser's optimized sprite system
- No performance impact vs static sprites
- Frame rate controlled by configuration

## Monitoring

Watch for:
- Failed sprite uploads (check `/api/upload` logs)
- Missing sprite references (check game console)
- Slow sprite loading (check asset sizes)

## Support

For issues:
1. Check browser console for errors
2. Verify sprite URLs are accessible
3. Check database for sprite records
4. Review Phaser asset loading logs

## Next Steps

After deployment:
1. Create default sprite sets
2. Document sprite creation workflow for team
3. Consider sprite preview in admin
4. Add sprite templates/presets
5. Create sprite creation tutorial for users
