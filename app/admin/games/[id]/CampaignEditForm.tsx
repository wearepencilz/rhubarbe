'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Campaign } from '@/types/game';
import AssetUploader from './AssetUploader';
import { Button } from '@/app/admin/components/ui/button';
import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';

interface CampaignEditFormProps {
  campaign: Campaign;
}

export default function CampaignEditForm({ campaign }: CampaignEditFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Helper to convert UTC date from database to local datetime-local format
  // The database stores dates in UTC, but datetime-local inputs need local time
  const toLocalDateTimeString = (utcDateString: Date | string): string => {
    // Parse the UTC date string
    const utcDate = new Date(utcDateString);
    
    // Get local time components (JavaScript Date automatically converts to local timezone)
    const year = utcDate.getFullYear();
    const month = String(utcDate.getMonth() + 1).padStart(2, '0');
    const day = String(utcDate.getDate()).padStart(2, '0');
    const hours = String(utcDate.getHours()).padStart(2, '0');
    const minutes = String(utcDate.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    name: campaign.name,
    display_title: (campaign as any).display_title || '',
    description: (campaign as any).description || '',
    status: campaign.status as string,
    start_date: toLocalDateTimeString(campaign.start_date),
    end_date: toLocalDateTimeString(campaign.end_date),
    timer_duration: campaign.timer_duration,
    reward_total: campaign.reward_total,
    winner_count: (campaign as any).winner_count || 100,
    reward_type: (campaign as any).reward_type || '',
    reward_description: (campaign as any).reward_description || '',
    ticket_success_title: (campaign as any).ticket_success_title || '',
    ticket_success_message: (campaign as any).ticket_success_message || '',
    player_sprite_url: (campaign as any).player_sprite_url || '',
    player_jump_sprite_url: (campaign as any).player_jump_sprite_url || '',
    walk_sprite_url: (campaign as any).walk_sprite_url || '',
    sprite_frame_width: (campaign as any).sprite_frame_width || 32,
    sprite_frame_height: (campaign as any).sprite_frame_height || 48,
    sprite_walk_frames: (campaign as any).sprite_walk_frames || 4,
    sprite_frame_rate: (campaign as any).sprite_frame_rate || 10,
    icecream_sprite_url: (campaign as any).icecream_sprite_url || '',
    ingredient_sprite_url: (campaign as any).ingredient_sprite_url || '',
    platform_sprite_url: (campaign as any).platform_sprite_url || '',
    platform_wood_sprite_url: (campaign as any).platform_wood_sprite_url || '',
    platform_stone_sprite_url: (campaign as any).platform_stone_sprite_url || '',
    platform_ice_sprite_url: (campaign as any).platform_ice_sprite_url || '',
    bridge_sprite_url: (campaign as any).bridge_sprite_url || '',
    background_url: (campaign as any).background_url || '',
    hazard_sprite_url: (campaign as any).hazard_sprite_url || '',
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'rewards' | 'assets'>('basic');

  // Handle ESC key to close delete confirmation modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showDeleteConfirm) {
        setShowDeleteConfirm(false);
      }
    };
    
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showDeleteConfirm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('Submitting campaign update with data:', formData);
      
      const response = await fetch(`/api/game/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          display_title: formData.display_title,
          description: formData.description,
          status: formData.status,
          start_date: new Date(formData.start_date).toISOString(),
          end_date: new Date(formData.end_date).toISOString(),
          timer_duration: parseInt(formData.timer_duration.toString()),
          reward_total: parseInt(formData.reward_total.toString()),
          winner_count: parseInt(formData.winner_count.toString()),
          reward_type: formData.reward_type,
          reward_description: formData.reward_description,
          ticket_success_title: formData.ticket_success_title,
          ticket_success_message: formData.ticket_success_message,
          player_sprite_url: formData.player_sprite_url,
          player_jump_sprite_url: formData.player_jump_sprite_url,
          walk_sprite_url: formData.walk_sprite_url,
          sprite_frame_width: formData.sprite_frame_width,
          sprite_frame_height: formData.sprite_frame_height,
          sprite_walk_frames: formData.sprite_walk_frames,
          sprite_frame_rate: formData.sprite_frame_rate,
          icecream_sprite_url: formData.icecream_sprite_url,
          ingredient_sprite_url: formData.ingredient_sprite_url,
          platform_sprite_url: formData.platform_sprite_url,
          platform_wood_sprite_url: formData.platform_wood_sprite_url,
          platform_stone_sprite_url: formData.platform_stone_sprite_url,
          platform_ice_sprite_url: formData.platform_ice_sprite_url,
          bridge_sprite_url: formData.bridge_sprite_url,
          background_url: formData.background_url,
          hazard_sprite_url: formData.hazard_sprite_url,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Campaign update failed:', data);
        throw new Error(data.error || 'Failed to update campaign');
      }

      const result = await response.json();
      console.log('Campaign updated successfully:', result);
      
      setSuccess(true);
      router.refresh();
    } catch (err) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update campaign');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/game/campaigns/${campaign.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete campaign');
      }

      router.push('/admin/games');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete campaign');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'basic'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Basic Settings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rewards')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'rewards'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Rewards
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('assets')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'assets'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Game Assets
          </button>
        </nav>
      </div>

      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Edit Campaign Settings
        </h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            Campaign updated successfully!
          </div>
        )}

        {/* Basic Settings Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-4">
            {/* Name */}
            <div>
              <Input
                label="Campaign Name (Internal)"
                type="text"
                value={formData.name}
                onChange={(value) => setFormData({ ...formData, name: value })}
                isRequired
                helperText="Internal identifier for admin use"
              />
            </div>

            {/* Display Title */}
            <div>
              <Input
                label="Display Title"
                type="text"
                value={formData.display_title}
                onChange={(value) => setFormData({ ...formData, display_title: value })}
                placeholder="Leave empty to use campaign name"
                helperText="Title shown to players (defaults to campaign name if empty)"
              />
            </div>

            {/* Description */}
            <div>
              <Textarea
                label="Description"
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Campaign description shown to players"
                rows={3}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="ended">Ended</option>
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Timer Duration */}
            <div>
              <Input
                label="Timer Duration (seconds)"
                type="number"
                value={String(formData.timer_duration)}
                onChange={(value) => setFormData({ ...formData, timer_duration: parseInt(value) })}
                isRequired
                helperText="How long players have to complete the game"
              />
            </div>
          </div>
        )}

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="Winner Count"
              type="number"
              value={String(formData.winner_count)}
              onChange={(value) => setFormData({ ...formData, winner_count: parseInt(value) })}
              isRequired
              helperText="First X players to complete get rewards"
            />
          </div>
          <div>
            <Input
              label="Total Rewards"
              type="number"
              value={String(formData.reward_total)}
              onChange={(value) => setFormData({ ...formData, reward_total: parseInt(value) })}
              isRequired
              helperText="Number of physical rewards available"
            />
          </div>
        </div>

        {/* Reward Configuration */}
        <div>
          <h3 className="text-md font-semibold text-gray-900 mb-4">
            Reward Details
          </h3>
          
          <div className="space-y-4">
            {/* Reward Type */}
            <div>
              <Input
                label="Reward Type"
                type="text"
                value={formData.reward_type}
                onChange={(value) => setFormData({ ...formData, reward_type: value })}
                placeholder="e.g., Free Scoop, 10% Off"
              />
            </div>

            {/* Reward Description */}
            <div>
              <Textarea
                label="Reward Description"
                value={formData.reward_description}
                onChange={(value) => setFormData({ ...formData, reward_description: value })}
                placeholder="e.g., Redeem for one free scoop of any flavour"
                rows={2}
              />
            </div>

            {/* Ticket Success Title */}
            <div>
              <Input
                label="Ticket Success Title"
                type="text"
                value={formData.ticket_success_title}
                onChange={(value) => setFormData({ ...formData, ticket_success_title: value })}
                placeholder="e.g., 🎉 You Won!"
                helperText="Title shown when player wins a reward"
              />
            </div>

            {/* Ticket Success Message */}
            <div>
              <Textarea
                label="Ticket Success Message"
                value={formData.ticket_success_message}
                onChange={(value) => setFormData({ ...formData, ticket_success_message: value })}
                placeholder="e.g., Show this code at the counter to claim your reward!"
                rows={2}
                helperText="Instructions shown with the claim code"
              />
            </div>
          </div>
        </div>
      </div>
    )}

        {/* Game Assets Tab */}
        {activeTab === 'assets' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-4">
                Player Character
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AssetUploader
              label="Player Sprite (Idle/Standing)"
              description="Character standing still - used for idle state and as fallback"
              recommendedSize="32×48px (width × height)"
              currentUrl={formData.player_sprite_url}
              onUpload={(url) => setFormData({ ...formData, player_sprite_url: url })}
            />

            <AssetUploader
              label="Player Jump Sprite"
              description="Character in air - switches automatically when jumping"
              recommendedSize="32×48px (width × height)"
              currentUrl={formData.player_jump_sprite_url}
              onUpload={(url) => setFormData({ ...formData, player_jump_sprite_url: url })}
            />
          </div>

          {/* Walking Animation (Optional) */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              Walking Animation (Optional)
            </h4>
            <p className="text-sm text-blue-700 mb-4">
              Add a sprite sheet for smooth walking animation. If not provided, the idle sprite will be used when moving.
            </p>

            <div className="mb-4">
              <AssetUploader
                label="Walk Sprite Sheet"
                description="Horizontal sprite sheet with walk cycle frames"
                recommendedSize="128×48px (4 frames @ 32×48px each)"
                currentUrl={formData.walk_sprite_url}
                onUpload={(url) => setFormData({ ...formData, walk_sprite_url: url })}
              />
            </div>

            {/* Animation Configuration - only show if walk sprite is uploaded */}
            {formData.walk_sprite_url && (
              <div className="pt-4 border-t border-blue-200">
                <h5 className="text-xs font-semibold text-blue-900 mb-3">Animation Settings</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Input
                      label="Frame Width (px)"
                      type="number"
                      value={String(formData.sprite_frame_width)}
                      onChange={(value) => setFormData({ ...formData, sprite_frame_width: parseInt(value) || 32 })}
                      size="sm"
                    />
                  </div>
                  <div>
                    <Input
                      label="Frame Height (px)"
                      type="number"
                      value={String(formData.sprite_frame_height)}
                      onChange={(value) => setFormData({ ...formData, sprite_frame_height: parseInt(value) || 48 })}
                      size="sm"
                    />
                  </div>
                  <div>
                    <Input
                      label="Walk Frames"
                      type="number"
                      value={String(formData.sprite_walk_frames)}
                      onChange={(value) => setFormData({ ...formData, sprite_walk_frames: parseInt(value) || 4 })}
                      size="sm"
                    />
                  </div>
                  <div>
                    <Input
                      label="Frame Rate (FPS)"
                      type="number"
                      value={String(formData.sprite_frame_rate)}
                      onChange={(value) => setFormData({ ...formData, sprite_frame_rate: parseInt(value) || 10 })}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

            {/* Other Game Assets */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-4">
                Other Game Assets
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Upload custom sprites for collectibles and environment. Leave empty to use defaults.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <AssetUploader
              label="Ice Cream Sprite"
              description="Goal collectible - player must reach this to win"
              recommendedSize="32×32px (square)"
              currentUrl={formData.icecream_sprite_url}
              onUpload={(url) => setFormData({ ...formData, icecream_sprite_url: url })}
            />

            <AssetUploader
              label="Ingredient Sprite"
              description="Collectible items - must collect all 3 before ice cream unlocks"
              recommendedSize="24×24px (square)"
              currentUrl={formData.ingredient_sprite_url}
              onUpload={(url) => setFormData({ ...formData, ingredient_sprite_url: url })}
            />

          </div>

          {/* Platform Sprites Section */}
          <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-purple-900 mb-2">
              🎨 Platform Sprites (New!)
            </h4>
            <p className="text-sm text-purple-700 mb-4">
              Upload 4 platform sprites for visual variety. Each sprite is 60×20px with 3 sections: left (20px), center (20px), right (20px). The center section repeats for platform length. The bridge is used for the highest platform.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AssetUploader
                label="Wood Platform"
                description="Brown wooden platform with grain texture"
                recommendedSize="60×20px (left, center, right sections)"
                currentUrl={formData.platform_wood_sprite_url}
                onUpload={(url) => setFormData({ ...formData, platform_wood_sprite_url: url })}
              />

              <AssetUploader
                label="Stone Platform"
                description="Gray stone blocks with mortar lines"
                recommendedSize="60×20px (left, center, right sections)"
                currentUrl={formData.platform_stone_sprite_url}
                onUpload={(url) => setFormData({ ...formData, platform_stone_sprite_url: url })}
              />

              <AssetUploader
                label="Ice Platform"
                description="Light blue ice with crystalline highlights"
                recommendedSize="60×20px (left, center, right sections)"
                currentUrl={formData.platform_ice_sprite_url}
                onUpload={(url) => setFormData({ ...formData, platform_ice_sprite_url: url })}
              />

              <AssetUploader
                label="Rope Bridge"
                description="Wooden planks with rope - for highest platform"
                recommendedSize="60×20px (left, center, right sections)"
                currentUrl={formData.bridge_sprite_url}
                onUpload={(url) => setFormData({ ...formData, bridge_sprite_url: url })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">

            <AssetUploader
              label="Hazard Sprite"
              description="Dangerous obstacles - touching these ends the game"
              recommendedSize="20×20px (square)"
              currentUrl={formData.hazard_sprite_url}
              onUpload={(url) => setFormData({ ...formData, hazard_sprite_url: url })}
            />

              <AssetUploader
                label="Background Image"
                description="Game background - displayed behind all game elements"
                recommendedSize="1600×600px (full scrolling world)"
                currentUrl={formData.background_url}
                onUpload={(url) => setFormData({ ...formData, background_url: url })}
              />
            </div>

            {/* Sprite Guidelines */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                📐 Sprite Guidelines
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use PNG format with transparency for best results</li>
                <li>• Pixel art should use nearest-neighbor scaling (no anti-aliasing)</li>
                <li>• Keep file sizes under 2MB per sprite</li>
                <li>• Platform textures should tile seamlessly (repeatable edges)</li>
                <li>• Walk sprite sheet: horizontal layout with frames side-by-side</li>
                <li>• All sprites will be rendered with pixel-perfect scaling</li>
              </ul>
            </div>
          </div>
        </div>
        )}

        {/* Actions - Always visible at bottom */}
        <div className="border-t border-gray-200 mt-6 pt-6 flex justify-between items-center">
          <Button
            type="button"
            variant="danger"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Campaign
          </Button>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/admin/games')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={saving}
              isDisabled={saving}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Campaign?
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this campaign? This will also delete all
              associated game sessions, scores, and rewards. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                isDisabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                isLoading={deleting}
                isDisabled={deleting}
              >
                Delete Campaign
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
