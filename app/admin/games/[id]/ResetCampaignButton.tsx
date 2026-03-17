'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ResetCampaignButtonProps {
  campaignId: string;
  campaignName: string;
}

export default function ResetCampaignButton({
  campaignId,
  campaignName,
}: ResetCampaignButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle ESC key to close confirmation modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showConfirm) {
        setShowConfirm(false);
        setError(null);
      }
    };
    
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showConfirm]);

  const handleReset = async () => {
    setIsResetting(true);
    setError(null);

    try {
      const response = await fetch(`/api/game/campaigns/${campaignId}/reset`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset campaign');
      }

      // Success - refresh the page
      router.refresh();
      setShowConfirm(false);
      alert(`Campaign "${campaignName}" has been reset successfully. All progress, scores, and rewards have been removed.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset campaign');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-yellow-900 mb-2">
          Reset Campaign Progress
        </h3>
        <p className="text-sm text-yellow-700 mb-4">
          This will permanently delete all game sessions, scores, and rewards for this campaign. 
          The campaign settings will remain intact. This action cannot be undone.
        </p>
        <button
          onClick={() => setShowConfirm(true)}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
        >
          Reset Campaign
        </button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Reset Campaign?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to reset <strong>{campaignName}</strong>?
            </p>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently delete:
            </p>
            <ul className="text-sm text-gray-600 mb-6 list-disc list-inside space-y-1">
              <li>All game sessions</li>
              <li>All player scores</li>
              <li>All allocated rewards</li>
              <li>Leaderboard data</li>
            </ul>
            <p className="text-sm font-semibold text-red-600 mb-6">
              This action cannot be undone.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setError(null);
                }}
                disabled={isResetting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isResetting ? 'Resetting...' : 'Yes, Reset Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
