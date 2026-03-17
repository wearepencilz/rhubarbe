'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Campaign } from '@/types/game';
import AssetUploader from './AssetUploader';
import EditPageLayout from '@/app/admin/components/EditPageLayout';
import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';
import { useToast } from '@/app/admin/components/ToastContainer';
import { BadgeWithDot } from '@/app/admin/components/ui/nav/badges';

const STATUS_COLOR: Record<string, 'success' | 'blue' | 'gray' | 'warning'> = {
  active: 'success',
  upcoming: 'blue',
  ended: 'gray',
  paused: 'warning',
};

const toLocalDateTimeString = (dateString: string): string => {
  const d = new Date(dateString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function CampaignEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'rewards' | 'assets'>('basic');
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    display_title: '',
    description: '',
    status: 'upcoming',
    start_date: '',
    end_date: '',
    timer_duration: 60,
    reward_total: 0,
    winner_count: 100,
    reward_type: '',
    reward_description: '',
    ticket_success_title: '',
    ticket_success_message: '',
    player_sprite_url: '',
    player_jump_sprite_url: '',
    walk_sprite_url: '',
    sprite_frame_width: 32,
    sprite_frame_height: 48,
    sprite_walk_frames: 4,
    sprite_frame_rate: 10,
    icecream_sprite_url: '',
    ingredient_sprite_url: '',
    platform_sprite_url: '',
    platform_wood_sprite_url: '',
    platform_stone_sprite_url: '',
    platform_ice_sprite_url: '',
    bridge_sprite_url: '',
    background_url: '',
    hazard_sprite_url: '',
  });
  const [initialData, setInitialData] = useState('');

  useEffect(() => { fetchCampaign(); }, [params.id]);

  const fetchCampaign = async () => {
    try {
      const res = await fetch(`/api/game/campaigns/${params.id}`);
      if (!res.ok) { router.push('/admin/games'); return; }
      const data = await res.json();
      const c = data.campaign || data;
      setCampaign(c);
      const fd = {
        name: c.name || '',
        display_title: c.display_title || '',
        description: c.description || '',
        status: c.status || 'upcoming',
        start_date: toLocalDateTimeString(c.start_date),
        end_date: toLocalDateTimeString(c.end_date),
        timer_duration: c.timer_duration || 60,
        reward_total: c.reward_total || 0,
        winner_count: c.winner_count || 100,
        reward_type: c.reward_type || '',
        reward_description: c.reward_description || '',
        ticket_success_title: c.ticket_success_title || '',
        ticket_success_message: c.ticket_success_message || '',
        player_sprite_url: c.player_sprite_url || '',
        player_jump_sprite_url: c.player_jump_sprite_url || '',
        walk_sprite_url: c.walk_sprite_url || '',
        sprite_frame_width: c.sprite_frame_width || 32,
        sprite_frame_height: c.sprite_frame_height || 48,
        sprite_walk_frames: c.sprite_walk_frames || 4,
        sprite_frame_rate: c.sprite_frame_rate || 10,
        icecream_sprite_url: c.icecream_sprite_url || '',
        ingredient_sprite_url: c.ingredient_sprite_url || '',
        platform_sprite_url: c.platform_sprite_url || '',
        platform_wood_sprite_url: c.platform_wood_sprite_url || '',
        platform_stone_sprite_url: c.platform_stone_sprite_url || '',
        platform_ice_sprite_url: c.platform_ice_sprite_url || '',
        bridge_sprite_url: c.bridge_sprite_url || '',
        background_url: c.background_url || '',
        hazard_sprite_url: c.hazard_sprite_url || '',
      };
      setFormData(fd);
      setInitialData(JSON.stringify(fd));
    } catch (error) {
      console.error('Error fetching campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/game/campaigns/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          start_date: new Date(formData.start_date).toISOString(),
          end_date: new Date(formData.end_date).toISOString(),
          timer_duration: parseInt(String(formData.timer_duration)),
          reward_total: parseInt(String(formData.reward_total)),
          winner_count: parseInt(String(formData
.winner_count)),
          sprite_frame_width: parseInt(String(formData.sprite_frame_width)),
          sprite_frame_height: parseInt(String(formData.sprite_frame_height)),
          sprite_walk_frames: parseInt(String(formData.sprite_walk_frames)),
          sprite_frame_rate: parseInt(String(formData.sprite_frame_rate)),
        }),
      });
      if (res.ok) {
        toast.success('Campaign saved', `"${formData.name}" has been updated`);
        setInitialData(JSON.stringify(formData));
        router.refresh();
      } else {
        const data = await res.json();
        toast.error('Save failed', data.error || 'Failed to update campaign');
      }
    } catch (err) {
      toast.error('Save failed', 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/game/campaigns/${params.id}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/admin/games');
    } else {
      const data = await res.json();
      toast.error('Delete failed', data.error || 'Failed to delete campaign');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const isDirty = JSON.stringify(formData) !== initialData;

  return (
    <EditPageLayout
      title="Edit Campaign"
      backHref="/admin/games"
      backLabel="Back to Campaigns"
      onSave={handleSave}
      onDelete={handleDelete}
      onCancel={() => router.push('/admin/games')}
      saving={saving}
      maxWidth="7xl"
      isDirty={isDirty}
    >
      <div className="grid grid-cols-3 gap-6">

        {/* Left: main form */}
        <div className="col-span-2 space-y-6">

          {/* Tab nav */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {(['basic', 'rewards', 'assets'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors capitalize ${
                      activeTab === tab
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab === 'basic' ? 'Basic Settings' : tab === 'rewards' ? 'Rewards' : 'Game Assets'}
                  </button>
                ))}
              </nav>
            </div>

            <div className="px-6 py-6 space-y-5">

              {/* Basic Settings */}
              {activeTab === 'basic' && (
                <>
                  <div className="pb-4 border-b border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-900">Campaign details</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Name, schedule, and game timer settings.</p>
                  </div>
                  <Input label="Campaign Name (Internal)" type="text" isRequired value={formData.name} onChange={(v) => setFormData({ ...formData, name: v })} helperText="Internal identifier for admin use" />
                  <Input label="Display Title" type="text" value={formData.display_title} onChange={(v) => setFormData({ ...formData, display_title: v })} placeholder="Leave empty to use campaign name" helperText="Title shown to players" />
                  <Textarea label="Description" value={formData.description} onChange={(v) => setFormData({ ...formData, description: v })} placeholder="Campaign description shown to players" rows={3} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="ended">Ended</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                      <input type="datetime-local" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                      <input type="datetime-local" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                    </div>
                  </div>
                  <Input label="Timer Duration (seconds)" type="number" isRequired value={String(formData.timer_duration)} onChange={(v) => setFormData({ ...formData, timer_duration: parseInt(v) || 60 })} helperText="How long players have to complete the game" />
                </>
              )}

              {/* Rewards */}
              {activeTab === 'rewards' && (
                <>
                  <div className="pb-4 border-b border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-900">Reward configuration</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Winner slots, reward type, and claim messaging.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Winner Count" type="number" isRequired value={String(formData.winner_count)} onChange={(v) => setFormData({ ...formData, winner_count: parseInt(v) || 100 })} helperText="First X players to complete get rewards" />
                    <Input label="Total Rewards" type="number" isRequired value={String(formData.reward_total)} onChange={(v) => setFormData({ ...formData, reward_total: parseInt(v) || 0 })} helperText="Number of physical rewards available" />
                  </div>
                  <Input label="Reward Type" type="text" value={formData.reward_type} onChange={(v) => setFormData({ ...formData, reward_type: v })} placeholder="e.g., Free Scoop, 10% Off" />
                  <Textarea label="Reward Description" value={formData.reward_description} onChange={(v) => setFormData({ ...formData, reward_description: v })} placeholder="e.g., Redeem for one free scoop of any flavour" rows={2} />
                  <Input label="Ticket Success Title" type="text" value={formData.ticket_success_title} onChange={(v) => setFormData({ ...formData, ticket_success_title: v })} placeholder="e.g., 🎉 You Won!" helperText="Title shown when player wins a reward" />
                  <Textarea label="Ticket Success Message" value={formData.ticket_success_message} onChange={(v) => setFormData({ ...formData, ticket_success_message: v })} placeholder="e.g., Show this code at the counter to claim your reward!" rows={2} helperText="Instructions shown with the claim code" />
                </>
              )}

              {/* Game Assets */}
              {activeTab === 'assets' && (
                <>
                  <div className="pb-4 border-b border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-900">Player character</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Sprites for idle, jump, and walk animation.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <AssetUploader label="Player Sprite (Idle)" description="Character standing still" recommendedSize="32×48px" currentUrl={formData.player_sprite_url} onUpload={(url) => setFormData({ ...formData, player_sprite_url: url })} />
                    <AssetUploader label="Player Jump Sprite" description="Character in air" recommendedSize="32×48px" currentUrl={formData.player_jump_sprite_url} onUpload={(url) => setFormData({ ...formData, player_jump_sprite_url: url })} />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">Walking Animation (Optional)</h4>
                    <p className="text-sm text-blue-700 mb-4">Sprite sheet for smooth walking. Falls back to idle if not provided.</p>
                    <AssetUploader label="Walk Sprite Sheet" description="Horizontal sprite sheet with walk cycle frames" recommendedSize="128×48px (4 frames @ 32×48px)" currentUrl={formData.walk_sprite_url} onUpload={(url) => setFormData({ ...formData, walk_sprite_url: url })} />
                    {formData.walk_sprite_url && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-blue-200">
                        <Input label="Frame Width (px)" type="number" value={String(formData.sprite_frame_width)} onChange={(v) => setFormData({ ...formData, sprite_frame_width: parseInt(v) || 32 })} size="sm" />
                        <Input label="Frame Height (px)" type="number" value={String(formData.sprite_frame_height)} onChange={(v) => setFormData({ ...formData, sprite_frame_height: parseInt(v) || 48 })} size="sm" />
                        <Input label="Walk Frames" type="number" value={String(formData.sprite_walk_frames)} onChange={(v) => setFormData({ ...formData, sprite_walk_frames: parseInt(v) || 4 })} size="sm" />
                        <Input label="Frame Rate (FPS)" type="number" value={String(formData.sprite_frame_rate)} onChange={(v) => setFormData({ ...formData, sprite_frame_rate: parseInt(v) || 10 })} size="sm" />
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Collectibles & environment</h3>
                    <p className="text-sm text-gray-500 mb-4">Leave empty to use defaults.</p>
                    <div className="grid grid-cols-2 gap-6">
                      <AssetUploader label="Ice Cream Sprite" description="Goal collectible" recommendedSize="32×32px" currentUrl={formData.icecream_sprite_url} onUpload={(url) => setFormData({ ...formData, icecream_sprite_url: url })} />
                      <AssetUploader label="Ingredient Sprite" description="Collectible items" recommendedSize="24×24px" currentUrl={formData.ingredient_sprite_url} onUpload={(url) => setFormData({ ...formData, ingredient_sprite_url: url })} />
                      <AssetUploader label="Hazard Sprite" description="Dangerous obstacles" recommendedSize="20×20px" currentUrl={formData.hazard_sprite_url} onUpload={(url) => setFormData({ ...formData, hazard_sprite_url: url })} />
                      <AssetUploader label="Background Image" description="Game background" recommendedSize="1600×600px" currentUrl={formData.background_url} onUpload={(url) => setFormData({ ...formData, background_url: url })} />
                    </div>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-purple-900 mb-1">Platform Sprites</h4>
                    <p className="text-sm text-purple-700 mb-4">60×20px each with left/center/right sections. Center repeats for platform length.</p>
                    <div className="grid grid-cols-2 gap-4">
                      <AssetUploader label="Wood Platform" description="Brown wooden platform" recommendedSize="60×20px" currentUrl={formData.platform_wood_sprite_url} onUpload={(url) => setFormData({ ...formData, platform_wood_sprite_url: url })} />
                      <AssetUploader label="Stone Platform" description="Gray stone blocks" recommendedSize="60×20px" currentUrl={formData.platform_stone_sprite_url} onUpload={(url) => setFormData({ ...formData, platform_stone_sprite_url: url })} />
                      <AssetUploader label="Ice Platform" description="Light blue ice" recommendedSize="60×20px" currentUrl={formData.platform_ice_sprite_url} onUpload={(url) => setFormData({ ...formData, platform_ice_sprite_url: url })} />
                      <AssetUploader label="Rope Bridge" description="For highest platform" recommendedSize="60×20px" currentUrl={formData.bridge_sprite_url} onUpload={(url) => setFormData({ ...formData, bridge_sprite_url: url })} />
                    </div>
                  </div>
                </>
              )}

            </div>
          </div>

        </div>

        {/* Right: metadata + links */}
        <div className="col-span-1 space-y-6">

          {/* Campaign metadata */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Campaign info</h2>
            </div>
            <div className="px-6 py-4 space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Status</p>
                <BadgeWithDot color={STATUS_COLOR[formData.status] ?? 'gray'} size="sm">{formData.status}</BadgeWithDot>
              </div>
              {campaign && (
                <>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Campaign ID</p>
                    <p className="font-mono text-xs text-gray-600 break-all">{campaign.id}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Created</p>
                    <p className="text-gray-700">{new Date(campaign.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Last updated</p>
                    <p className="text-gray-700">{new Date(campaign.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Rewards remaining</p>
                    <p className="text-gray-700">{campaign.reward_remaining} / {campaign.reward_total}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Public URLs */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Public URLs</h2>
              <p className="text-sm text-gray-500 mt-0.5">Share these links with players.</p>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Game</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-50 px-3 py-1.5 rounded border border-gray-200 text-xs truncate">/game/{params.id}</code>
                  <Link href={`/game/${params.id}`} target="_blank" className="text-xs text-blue-600 hover:text-blue-800 font-medium shrink-0">Open ↗</Link>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Leaderboard display</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-50 px-3 py-1.5 rounded border border-gray-200 text-xs truncate">/leaderboard/{params.id}</code>
                  <Link href={`/leaderboard/${params.id}`} target="_blank" className="text-xs text-blue-600 hover:text-blue-800 font-medium shrink-0">Open ↗</Link>
                </div>
                <p className="text-xs text-gray-400 mt-1">Clean view for TV/monitor displays</p>
              </div>
            </div>
          </div>

          {/* Admin links */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Admin</h2>
            </div>
            <div className="px-6 py-4 space-y-2">
              <Link href={`/admin/games/${params.id}/leaderboard`} className="flex items-center justify-between text-sm text-gray-700 hover:text-blue-600 py-1">
                <span>Leaderboard</span>
                <span className="text-gray-400">→</span>
              </Link>
              <Link href={`/admin/games/${params.id}/rewards`} className="flex items-center justify-between text-sm text-gray-700 hover:text-blue-600 py-1">
                <span>Rewards</span>
                <span className="text-gray-400">→</span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </EditPageLayout>
  );
}
