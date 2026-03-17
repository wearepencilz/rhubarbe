'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/admin/components/ui/button';
import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';

export default function CreateCampaignForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default dates: start now (local time), end in 7 days
  // datetime-local inputs work in the user's local timezone
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  // Helper to format date for datetime-local input (local timezone)
  const toLocalDateTimeString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    name: '',
    display_title: '',
    description: '',
    status: 'active',
    start_date: toLocalDateTimeString(now),
    end_date: toLocalDateTimeString(weekFromNow),
    timer_duration: 60,
    reward_total: 100,
    winner_count: 100,
    reward_type: 'Free Scoop',
    reward_description: 'Redeem for one free scoop of any flavour',
    ticket_success_title: '🎉 You Won!',
    ticket_success_message: 'Show this code at the counter to claim your reward!',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Default level configuration - 400x500 resolution with 1360x500 world
      const levelConfig = {
        platforms: [
          { x: 0, y: 400, width: 850, height: 20 },      // Ground - Start
          { x: 942, y: 445, width: 133, height: 20 },    // Ground - Gap
          { x: 1069, y: 368, width: 289, height: 20 },   // Ground - End (32px above Start)
          { x: 45, y: 212, width: 196, height: 20 },     // Mid Platform 1
          { x: 520, y: 229, width: 143, height: 20 },    // Mid Platform 2
          { x: 918, y: 176, width: 224, height: 20 },    // Mid Platform 3 (ice cream above)
        ],
        iceCreams: [
          { x: 1020, y: 100 },
        ],
        ingredients: [
          { x: 142, y: 140 },   // Ingredient 1 - Vanilla
          { x: 578, y: 157 },   // Ingredient 2 - Chocolate
          { x: 986, y: 381 },   // Ingredient 3 - Strawberry
        ],
        hazards: [],
        spawnPoint: { x: 53, y: 337 },
        worldWidth: 1360,
      };

      const response = await fetch('/api/game/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          display_title: formData.display_title || formData.name,
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
          level_config: JSON.stringify(levelConfig),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create campaign');
      }

      const campaign = await response.json();
      router.push(`/admin/games/${campaign.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Campaign Details
      </h2>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Name */}
        <div>
          <Input
            label="Campaign Name (Internal) *"
            type="text"
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
            placeholder="e.g., Ice Cream Hunt - Spring 2026"
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
            placeholder="e.g., Spring Ice Cream Hunt"
            helperText="Title shown to players (defaults to campaign name if empty)"
          />
        </div>

        {/* Description */}
        <div>
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
            placeholder="e.g., Find the hidden ice cream before time runs out!"
            rows={3}
            helperText="Campaign description shown to players"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status *
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
          <p className="text-sm text-gray-500 mt-1">
            Set to "Active" to allow players to start playing immediately
          </p>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date & Time *
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
            <p className="text-xs text-gray-500 mt-1">
              Your local time (times are stored in UTC)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date & Time *
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
            <p className="text-xs text-gray-500 mt-1">
              Your local time (times are stored in UTC)
            </p>
          </div>
        </div>

        {/* Timer Duration */}
        <div>
          <Input
            label="Timer Duration (seconds) *"
            type="number"
            value={String(formData.timer_duration)}
            onChange={(value) => setFormData({ ...formData, timer_duration: parseInt(value) })}
            isRequired
            helperText="How long players have to complete the game (10-300 seconds)"
          />
        </div>

        {/* Winner Count */}
        <div>
          <Input
            label="Winner Count *"
            type="number"
            value={String(formData.winner_count)}
            onChange={(value) => setFormData({ ...formData, winner_count: parseInt(value) })}
            isRequired
            helperText="First X players to complete get rewards (e.g., 100 = first 100 winners)"
          />
        </div>

        {/* Total Rewards */}
        <div>
          <Input
            label="Total Rewards *"
            type="number"
            value={String(formData.reward_total)}
            onChange={(value) => setFormData({ ...formData, reward_total: parseInt(value) })}
            isRequired
            helperText="Number of rewards available for top 100 players"
          />
        </div>

        {/* Reward Configuration */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="text-md font-semibold text-gray-900 mb-4">
            Reward Details
          </h3>
          
          <div className="space-y-4">
            {/* Reward Type */}
            <div>
              <Input
                label="Reward Type *"
                type="text"
                value={formData.reward_type}
                onChange={(value) => setFormData({ ...formData, reward_type: value })}
                placeholder="e.g., Free Scoop, 10% Off, Free Topping"
                isRequired
              />
            </div>

            {/* Reward Description */}
            <div>
              <Textarea
                label="Reward Description *"
                value={formData.reward_description}
                onChange={(value) => setFormData({ ...formData, reward_description: value })}
                placeholder="e.g., Redeem for one free scoop of any flavour"
                rows={2}
                isRequired
              />
            </div>

            {/* Ticket Success Title */}
            <div>
              <Input
                label="Ticket Success Title *"
                type="text"
                value={formData.ticket_success_title}
                onChange={(value) => setFormData({ ...formData, ticket_success_title: value })}
                placeholder="e.g., 🎉 You Won!"
                isRequired
                helperText="Title shown when player wins a reward"
              />
            </div>

            {/* Ticket Success Message */}
            <div>
              <Textarea
                label="Ticket Success Message *"
                value={formData.ticket_success_message}
                onChange={(value) => setFormData({ ...formData, ticket_success_message: value })}
                placeholder="e.g., Show this code at the counter to claim your reward!"
                rows={2}
                isRequired
                helperText="Instructions shown with the claim code"
              />
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            Default Game Configuration
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Side-scrolling level (1360px wide - 3.4 screens)</li>
            <li>• 3 ingredients to collect (50 points each)</li>
            <li>• 1 ice cream at the end (goal)</li>
            <li>• 4:5 vertical aspect ratio (400x500)</li>
            <li>• Score = 1000 + (remaining_time × 10) + (ingredients × 50)</li>
          </ul>
          <p className="text-xs text-blue-700 mt-2">
            You can customize the level layout after creation
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-3">
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
          Create Campaign
        </Button>
      </div>
    </form>
  );
}
