'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge, BadgeWithDot } from '@/app/admin/components/ui/nav/badges';
import ConfirmModal from '@/app/admin/components/ConfirmModal';
import { useToast } from '@/app/admin/components/ToastContainer';
import { Button } from '@/app/admin/components/ui/button';
import { Edit01, Trash01 } from '@untitledui/icons';
import type { Campaign } from '@/types/game';

const STATUS_COLOR: Record<string, 'success' | 'blue' | 'gray' | 'warning'> = {
  active: 'success',
  upcoming: 'blue',
  ended: 'gray',
  paused: 'warning',
};

function formatDateShort(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isCampaignActive(campaign: Campaign): boolean {
  const now = new Date();
  return campaign.status === 'active' && now >= new Date(campaign.start_date) && now <= new Date(campaign.end_date);
}

export default function GamesAdminPage() {
  const router = useRouter();
  const toast = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: '', name: '' });

  useEffect(() => { fetchCampaigns(); }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/game/campaigns');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || data);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/game/campaigns/${deleteConfirm.id}`, { method: 'DELETE' });
    if (res.ok) {
      setCampaigns(campaigns.filter((c) => c.id !== deleteConfirm.id));
      toast.success('Campaign deleted', `"${deleteConfirm.name}" has been removed`);
    } else {
      const error = await res.json();
      toast.error('Delete failed', error.error || 'Failed to delete campaign');
    }
    setDeleteConfirm({ show: false, id: '', name: '' });
  };

  const filtered = campaigns.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      {/* Page header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Game Campaigns</h1>
          <p className="text-gray-600 mt-1">Manage pixel art game campaigns, rewards, and leaderboards</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/games/scan">
            <Button variant="secondary" size="md">Quick Scan</Button>
          </Link>
          <Link href="/admin/games/new">
            <Button variant="primary" size="md">Create Campaign</Button>
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Table header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">All Campaigns</h2>
            <p className="text-sm text-gray-500 mt-0.5">Pixel art game campaigns with rewards and leaderboards</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search campaigns…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-48"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="paused">Paused</option>
              <option value="ended">Ended</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm text-gray-500">No campaigns found</p>
            <Link href="/admin/games/new">
              <Button variant="secondary" size="sm">Create your first campaign</Button>
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Campaign</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Timer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Rewards</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Links</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((campaign) => {
                const isActive = isCampaignActive(campaign);
                const c = campaign as any;
                return (
                  <tr
                    key={campaign.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/admin/games/${campaign.id}`)}
                  >
                    <td className="px-6 py-3">
                      <p className="font-medium text-gray-900">{campaign.name}</p>
                      {c.display_title && c.display_title !== campaign.name && (
                        <p className="text-xs text-gray-400">{c.display_title}</p>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <BadgeWithDot color={isActive ? 'success' : STATUS_COLOR[campaign.status] ?? 'gray'} size="sm">
                        {isActive ? 'Active' : campaign.status}
                      </BadgeWithDot>
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      <div>{formatDateShort(campaign.start_date)}</div>
                      <div className="text-xs text-gray-400">→ {formatDateShort(campaign.end_date)}</div>
                    </td>
                    <td className="px-6 py-3 text-gray-700">
                      {campaign.timer_duration}s
                    </td>
                    <td className="px-6 py-3">
                      <p className="font-medium text-gray-900">{campaign.reward_total} total</p>
                      <p className="text-xs text-gray-400">First {c.winner_count || 100} win</p>
                    </td>
                    <td className="px-6 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/game/${campaign.id}`}
                          target="_blank"
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Play ↗
                        </Link>
                        <Link
                          href={`/leaderboard/${campaign.id}`}
                          target="_blank"
                          className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                        >
                          Display ↗
                        </Link>
                        <Link
                          href={`/admin/games/${campaign.id}/leaderboard`}
                          className="text-xs text-green-600 hover:text-green-800 font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Leaderboard
                        </Link>
                        <Link
                          href={`/admin/games/${campaign.id}/rewards`}
                          className="text-xs text-orange-600 hover:text-orange-800 font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Rewards
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/games/${campaign.id}`}>
                          <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded" title="Edit">
                            <Edit01 className="w-4 h-4" />
                          </button>
                        </Link>
                        <button
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded"
                          title="Delete"
                          onClick={() => setDeleteConfirm({ show: true, id: campaign.id, name: campaign.name })}
                        >
                          <Trash01 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteConfirm.show}
        variant="danger"
        title="Delete Campaign"
        message={`Are you sure you want to delete "${deleteConfirm.name}"? This will also delete all associated sessions, scores, and rewards. This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, id: '', name: '' })}
      />
    </>
  );
}
