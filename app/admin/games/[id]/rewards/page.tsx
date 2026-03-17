import { notFound } from 'next/navigation';
import { findById, raw } from '@/lib/db-game';
import Link from 'next/link';

interface RewardWithScore {
  id: string;
  claim_code: string;
  player_name: string;
  contact_phone: string | null;
  contact_email: string | null;
  reward_type: string;
  created_at: Date;
  expiration_date: Date;
  claimed_at: Date | null;
  claimed_by: string | null;
  score: number;
  completion_time: number;
  completion_order: number;
}

export default async function RewardsTrackingPage({
  params,
}: {
  params: { id: string };
}) {
  const campaign = await findById('campaigns', params.id);

  if (!campaign) {
    notFound();
  }

  // Get all rewards for this campaign with score details
  const rewardsResult = await raw<RewardWithScore>(`
    SELECT 
      r.id,
      r.claim_code,
      r.player_name,
      r.contact_phone,
      r.contact_email,
      r.reward_type,
      r.created_at,
      r.expiration_date,
      r.claimed_at,
      r.claimed_by,
      s.score,
      s.completion_time,
      ROW_NUMBER() OVER (ORDER BY s.created_at) as completion_order
    FROM rewards r
    JOIN scores s ON r.score_id = s.id
    WHERE r.campaign_id = $1
    ORDER BY s.created_at ASC
  `, [params.id]);

  const rewards = rewardsResult.rows;
  const claimedCount = rewards.filter(r => r.claimed_at).length;
  const unclaimedCount = rewards.length - claimedCount;
  const expiredCount = rewards.filter(r => !r.claimed_at && new Date(r.expiration_date) < new Date()).length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reward Tracking</h1>
            <p className="text-gray-600">{campaign.name}</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/games/scan"
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
            >
              <span className="text-xl">🔍</span>
              Quick Scan
            </Link>
            <Link
              href={`/admin/games/${params.id}`}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Back to Campaign
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Rewards</p>
            <p className="text-3xl font-bold text-gray-900">{rewards.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <p className="text-sm text-green-700">Claimed</p>
            <p className="text-3xl font-bold text-green-900">{claimedCount}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <p className="text-sm text-yellow-700">Unclaimed</p>
            <p className="text-3xl font-bold text-yellow-900">{unclaimedCount}</p>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-4">
            <p className="text-sm text-red-700">Expired</p>
            <p className="text-3xl font-bold text-red-900">{expiredCount}</p>
          </div>
        </div>
      </div>

      {/* Rewards Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Claim Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Won At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rewards.map((reward, index) => {
                const isExpired = !reward.claimed_at && new Date(reward.expiration_date) < new Date();
                const isClaimed = !!reward.claimed_at;
                
                return (
                  <tr key={reward.id} className={isClaimed ? 'bg-green-50' : isExpired ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      #{index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{reward.player_name}</div>
                      <div className="text-sm text-gray-500">Score: {reward.score}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-mono font-bold text-gray-900">{reward.claim_code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reward.contact_phone && (
                        <div>📱 {reward.contact_phone}</div>
                      )}
                      {reward.contact_email && (
                        <div>✉️ {reward.contact_email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reward.completion_time}s
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(reward.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isClaimed ? (
                        <div>
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Claimed
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(reward.claimed_at!).toLocaleDateString()}
                          </div>
                          {reward.claimed_by && (
                            <div className="text-xs text-gray-500">
                              by {reward.claimed_by}
                            </div>
                          )}
                        </div>
                      ) : isExpired ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Expired
                        </span>
                      ) : (
                        <div>
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Unclaimed
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            Expires {new Date(reward.expiration_date).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {!isClaimed && !isExpired && (
                        <Link
                          href={`/admin/games/${params.id}/claim/${reward.claim_code}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Mark Claimed
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {rewards.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No rewards allocated yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
