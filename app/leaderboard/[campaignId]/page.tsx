import { notFound } from 'next/navigation';
import { findById } from '@/lib/db-game';
import LeaderboardDisplay from '@/components/game/LeaderboardDisplay';

interface PageProps {
  params: {
    campaignId: string;
  };
}

export const revalidate = 5; // Revalidate every 5 seconds

export default async function PublicLeaderboardPage({ params }: PageProps) {
  const campaign = await findById('campaigns', params.campaignId);

  if (!campaign) {
    notFound();
  }

  const displayTitle = (campaign as any).display_title || campaign.name;
  const description = (campaign as any).description;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">
            🏆 {displayTitle}
          </h1>
          {description && (
            <p className="text-xl text-gray-600 mb-4">{description}</p>
          )}
          <div className="inline-block bg-white rounded-full px-6 py-2 shadow-md">
            <p className="text-sm text-gray-500">
              Updates automatically every 5 seconds
            </p>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <LeaderboardDisplay campaignId={params.campaignId} />
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pb-8">
          <p className="text-gray-500 text-sm">
            Play at Janine Ice Cream Shop to get on the leaderboard!
          </p>
        </div>
      </div>
    </div>
  );
}
