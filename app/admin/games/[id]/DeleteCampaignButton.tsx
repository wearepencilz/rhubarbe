'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DeleteCampaignButtonProps {
  campaignId: string;
  campaignName: string;
}

export default function DeleteCampaignButton({
  campaignId,
  campaignName,
}: DeleteCampaignButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/game/campaigns/${campaignId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete campaign');
      }

      router.push('/admin/games');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete campaign');
      setDeleting(false);
    }
  };

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Delete Campaign
      </button>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-red-900 font-semibold mb-2">
        Are you sure you want to delete "{campaignName}"?
      </p>
      <p className="text-red-700 text-sm mb-4">
        This will permanently delete the campaign and all associated scores. This action cannot be undone.
      </p>

      {error && (
        <div className="mb-4 bg-red-100 border border-red-300 text-red-800 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {deleting ? 'Deleting...' : 'Yes, Delete'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={deleting}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
