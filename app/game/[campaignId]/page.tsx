import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import GameContainer from '@/components/game/GameContainer';
import LeaderboardDisplay from '@/components/game/LeaderboardDisplay';
import { findById } from '@/lib/db-game';
import type { Campaign } from '@/types/game';

interface PageProps {
  params: {
    campaignId: string;
  };
}

/**
 * Fetch campaign data
 */
async function getCampaign(campaignId: string): Promise<Campaign | null> {
  try {
    const campaign = await findById<Campaign>('campaigns', campaignId);
    return campaign;
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return null;
  }
}

/**
 * Check if campaign is active
 */
function isCampaignActive(campaign: Campaign): boolean {
  if (campaign.status !== 'active') return false;
  
  const now = new Date();
  const startDate = new Date(campaign.start_date);
  const endDate = new Date(campaign.end_date);
  
  return now >= startDate && now <= endDate;
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const campaign = await getCampaign(params.campaignId);
  
  if (!campaign) {
    return {
      title: 'Game Not Found | Janine',
    };
  }
  
  return {
    title: `${(campaign as any).display_title || campaign.name} | Janine Game`,
    description: (campaign as any).description || `Play ${campaign.name} and compete for rewards! Find the hidden ice cream before time runs out.`,
    openGraph: {
      title: `${(campaign as any).display_title || campaign.name} | Janine Game`,
      description: (campaign as any).description || `Play ${campaign.name} and compete for rewards!`,
      type: 'website',
    },
  };
}

/**
 * Game page component
 */
export default async function GamePage({ params }: PageProps) {
  const campaign = await getCampaign(params.campaignId);
  
  // Campaign not found
  if (!campaign) {
    notFound();
  }
  
  // Check if campaign is active
  const isActive = isCampaignActive(campaign);
  const now = new Date();
  const startDate = new Date(campaign.start_date);
  const endDate = new Date(campaign.end_date);
  
  // Determine campaign state
  const notStarted = now < startDate;
  const hasEnded = now > endDate;
  const isPaused = campaign.status === 'paused';
  const isUpcoming = campaign.status === 'upcoming';
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {(campaign as any).display_title || campaign.name}
          </h1>
          {(campaign as any).description && (
            <p className="text-gray-600">
              {(campaign as any).description}
            </p>
          )}
        </div>
        
        {/* Campaign Status Messages */}
        {notStarted && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-blue-100 border border-blue-400 text-blue-800 px-6 py-4 rounded-lg">
              <h2 className="font-bold text-lg mb-2">Coming Soon!</h2>
              <p>
                This campaign starts on {startDate.toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZoneName: 'short',
                })}.
              </p>
              <p className="text-sm mt-2">Check back soon to play!</p>
            </div>
          </div>
        )}
        
        {hasEnded && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-gray-100 border border-gray-400 text-gray-800 px-6 py-4 rounded-lg">
              <h2 className="font-bold text-lg mb-2">Campaign Ended</h2>
              <p>
                This campaign ended on {endDate.toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZoneName: 'short',
                })}.
              </p>
              <p className="text-sm mt-2">
                Check out the final leaderboard below to see the winners!
              </p>
            </div>
          </div>
        )}
        
        {isPaused && !notStarted && !hasEnded && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-orange-100 border border-orange-400 text-orange-800 px-6 py-4 rounded-lg">
              <h2 className="font-bold text-lg mb-2">Campaign Paused</h2>
              <p>This campaign is temporarily paused.</p>
              <p className="text-sm mt-2">Please check back later!</p>
            </div>
          </div>
        )}
        
        {isUpcoming && !notStarted && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-4 rounded-lg">
              <h2 className="font-bold text-lg mb-2">Coming Soon</h2>
              <p>This campaign will be available soon!</p>
            </div>
          </div>
        )}
        
        {/* Game Container - only show if active */}
        {isActive && (
          <div className="mb-12">
            <GameContainer campaign={campaign} />
          </div>
        )}
        
        {/* Leaderboard - always show */}
        <div className="max-w-4xl mx-auto">
          <LeaderboardDisplay campaignId={campaign.id} />
        </div>
        
        {/* Campaign Info */}
        <div className="max-w-4xl mx-auto mt-8 text-center text-sm text-gray-500">
          <p>
            Campaign runs from {startDate.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })} to {endDate.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
          <p className="mt-1">
            Timer: {campaign.timer_duration} seconds | Rewards: {(campaign as any).winner_count || 100} winners
          </p>
        </div>
      </div>
    </div>
  );
}
