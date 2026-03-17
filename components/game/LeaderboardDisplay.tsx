'use client';

import { useState, useEffect } from 'react';
import type { LeaderboardEntry } from '@/types/game';

interface LeaderboardDisplayProps {
  campaignId: string;
  currentPlayerName?: string;
}

type LeaderboardTab = 'first100' | 'fastest';

export default function LeaderboardDisplay({
  campaignId,
  currentPlayerName,
}: LeaderboardDisplayProps) {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('first100');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [winnerCount, setWinnerCount] = useState(100);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`/api/game/leaderboard/${campaignId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      setEntries(data.entries);
      setTotalPlayers(data.totalPlayers);
      setWinnerCount(data.winnerCount || 100);
      setError(null);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchLeaderboard();
  }, [campaignId]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeaderboard();
    }, 5000);

    return () => clearInterval(interval);
  }, [campaignId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6">Leaderboard</h2>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6">Leaderboard</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <button
          onClick={fetchLeaderboard}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Sort entries based on active tab
  const sortedEntries = [...entries].sort((a, b) => {
    if (activeTab === 'first100') {
      // Sort by created_at (completion order)
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else {
      // Sort by completion_time (fastest)
      return a.completion_time - b.completion_time;
    }
  });

  // Take first winnerCount for first100 tab
  const displayEntries = activeTab === 'first100' ? sortedEntries.slice(0, winnerCount) : sortedEntries;

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">🏆 Leaderboard</h2>
        <div className="text-sm text-gray-500">
          {totalPlayers} {totalPlayers === 1 ? 'player' : 'players'}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('first100')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'first100'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          First {winnerCount} Winners 🎁
        </button>
        <button
          onClick={() => setActiveTab('fastest')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'fastest'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Fastest Times ⚡
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No scores yet!</p>
          <p className="text-sm mt-2">Be the first to play and set a high score.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {displayEntries.map((entry, index) => {
              const isCurrentPlayer = currentPlayerName && entry.player_name === currentPlayerName;
              const displayRank = index + 1;
              
              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                    isCurrentPlayer
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Rank */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        displayRank === 1
                          ? 'bg-yellow-400 text-yellow-900'
                          : displayRank === 2
                          ? 'bg-gray-300 text-gray-700'
                          : displayRank === 3
                          ? 'bg-orange-400 text-orange-900'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {displayRank}
                    </div>

                    {/* Player Name */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-semibold truncate ${
                            isCurrentPlayer ? 'text-blue-900' : 'text-gray-900'
                          }`}
                        >
                          {entry.player_name}
                        </span>

                        {isCurrentPlayer && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-200 text-blue-800">
                            You
                          </span>
                        )}
                        {activeTab === 'first100' && displayRank <= winnerCount && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Winner
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {entry.completion_time}s
                        {activeTab === 'fastest' && (
                          <span className="ml-2">• Score: {entry.score.toLocaleString()}</span>
                        )}
                      </div>
                    </div>

                    {/* Time (only show on first100 tab) */}
                    {activeTab === 'first100' && (
                      <div className="text-right">
                        <div
                          className={`text-xl font-semibold ${
                            isCurrentPlayer ? 'text-blue-600' : 'text-gray-900'
                          }`}
                        >
                          {entry.completion_time}s
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>
                {activeTab === 'first100' 
                  ? `First ${winnerCount} to complete get rewards` 
                  : 'Sorted by fastest completion time'}
              </span>
              <span>
                Updated {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
