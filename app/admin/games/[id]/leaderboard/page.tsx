import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { findById, getLeaderboard } from '@/lib/db-game';
import type { Campaign } from '@/types/game';

interface PageProps {
  params: {
    id: string;
  };
}

export const metadata: Metadata = {
  title: 'Campaign Leaderboard | Admin',
};

async function getCampaign(id: string): Promise<Campaign | null> {
  try {
    return await findById<Campaign>('campaigns', id);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return null;
  }
}

async function getLeaderboardData(campaignId: string) {
  try {
    return await getLeaderboard(campaignId, 100);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

export default async function LeaderboardPage({ params }: PageProps) {
  const campaign = await getCampaign(params.id);

  if (!campaign) {
    notFound();
  }

  const leaderboard = await getLeaderboardData(params.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/games"
          className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
        >
          ← Back to Campaigns
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
        <p className="text-gray-600 mt-1">{campaign.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Total Players</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {leaderboard.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Golden Spoon Members</div>
          <div className="text-3xl font-bold text-yellow-600 mt-2">
            {leaderboard.filter((p) => p.is_golden_spoon).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Highest Score</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">
            {leaderboard[0]?.score || 0}
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Top 100 Players
          </h2>
        </div>

        {leaderboard.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">No scores yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaderboard.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className={`text-lg font-bold ${
                            entry.rank === 1
                              ? 'text-yellow-500'
                              : entry.rank === 2
                              ? 'text-gray-400'
                              : entry.rank === 3
                              ? 'text-orange-600'
                              : 'text-gray-900'
                          }`}
                        >
                          #{entry.rank}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {entry.player_name}
                        </span>
                        {entry.is_golden_spoon && (
                          <span className="ml-2 text-yellow-500" title="Golden Spoon Member">
                            🥄
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-blue-600">
                        {entry.score}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {entry.completion_time}s
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {new Date(entry.created_at).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
