'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ClaimRewardPage({
  params,
}: {
  params: { id: string; code: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [reward, setReward] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [claimedBy, setClaimedBy] = useState('');

  useEffect(() => {
    fetchReward();
  }, []);

  const fetchReward = async () => {
    try {
      const response = await fetch(`/api/game/rewards/${params.code}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Reward not found');
      }

      const data = await response.json();
      setReward(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reward');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!claimedBy.trim()) {
      setError('Please enter your name');
      return;
    }

    setClaiming(true);
    setError(null);

    try {
      const response = await fetch(`/api/game/rewards/${params.code}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimedBy }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to claim reward');
      }

      // Refresh reward data
      await fetchReward();
      
      // Show success and redirect after delay
      setTimeout(() => {
        router.push(`/admin/games/${params.id}/rewards`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim reward');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reward...</p>
        </div>
      </div>
    );
  }

  if (error && !reward) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Reward Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href={`/admin/games/${params.id}/rewards`}
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Rewards
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isExpired = new Date(reward.expiration_date) < new Date();
  const isClaimed = !!reward.claimed_at;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        {isClaimed ? (
          // Already Claimed
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-green-900 mb-2">Already Claimed</h1>
            <p className="text-gray-600 mb-4">
              This reward was claimed on {new Date(reward.claimed_at).toLocaleDateString()}
            </p>
            {reward.claimed_by && (
              <p className="text-sm text-gray-500 mb-6">
                Claimed by: {reward.claimed_by}
              </p>
            )}
            <Link
              href={`/admin/games/${params.id}/rewards`}
              className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Back to Rewards
            </Link>
          </div>
        ) : isExpired ? (
          // Expired
          <div className="text-center">
            <div className="text-6xl mb-4">⏰</div>
            <h1 className="text-2xl font-bold text-red-900 mb-2">Reward Expired</h1>
            <p className="text-gray-600 mb-4">
              This reward expired on {new Date(reward.expiration_date).toLocaleDateString()}
            </p>
            <Link
              href={`/admin/games/${params.id}/rewards`}
              className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Back to Rewards
            </Link>
          </div>
        ) : (
          // Ready to Claim
          <div>
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Valid Reward!</h1>
              <p className="text-gray-600">Ready to redeem</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Player</p>
                  <p className="font-semibold text-gray-900">{reward.player_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Claim Code</p>
                  <p className="font-mono font-bold text-lg text-gray-900">{reward.claim_code}</p>
                </div>
                <div>
                  <p className="text-gray-500">Reward</p>
                  <p className="font-semibold text-gray-900">{reward.reward_type}</p>
                </div>
                <div>
                  <p className="text-gray-500">Expires</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(reward.expiration_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name (Staff Member)
              </label>
              <input
                type="text"
                value={claimedBy}
                onChange={(e) => setClaimedBy(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleClaim}
              disabled={claiming || !claimedBy.trim()}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {claiming ? 'Processing...' : 'Mark as Claimed'}
            </button>

            <Link
              href={`/admin/games/${params.id}/rewards`}
              className="block text-center mt-4 text-gray-600 hover:text-gray-900"
            >
              Cancel
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
