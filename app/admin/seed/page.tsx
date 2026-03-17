'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type SeedMode = 'skip' | 'merge' | 'replace';

type SeedResult = {
  success: boolean;
  message: string;
  stats: {
    existing: number;
    seeded: number;
    skipped: number;
    replaced: number;
  };
};

export default function SeedDatabasePage() {
  const router = useRouter();
  const [mode, setMode] = useState<SeedMode>('skip');
  const [loading, setLoading] = useState(false);
  const [ingredientsResult, setIngredientsResult] = useState<SeedResult | null>(null);
  const [flavoursResult, setFlavoursResult] = useState<SeedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSeedAll = async () => {
    if (!confirm(`Are you sure you want to seed the database in '${mode}' mode?\n\nThis will seed both ingredients and flavours.`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setIngredientsResult(null);
    setFlavoursResult(null);

    try {
      // Seed ingredients first
      const ingredientsResponse = await fetch(`/api/ingredients/seed?mode=${mode}`, {
        method: 'POST',
      });

      const ingredientsData = await ingredientsResponse.json();

      if (!ingredientsResponse.ok) {
        throw new Error(`Ingredients: ${ingredientsData.error || 'Failed to seed'}`);
      }

      setIngredientsResult(ingredientsData);

      // Then seed flavours
      const flavoursResponse = await fetch(`/api/flavours/seed?mode=${mode}`, {
        method: 'POST',
      });

      const flavoursData = await flavoursResponse.json();

      if (!flavoursResponse.ok) {
        throw new Error(`Flavours: ${flavoursData.error || 'Failed to seed'}`);
      }

      setFlavoursResult(flavoursData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedIngredients = async () => {
    if (!confirm(`Seed ingredients only in '${mode}' mode?`)) return;

    setLoading(true);
    setError(null);
    setIngredientsResult(null);

    try {
      const response = await fetch(`/api/ingredients/seed?mode=${mode}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to seed ingredients');
      }

      setIngredientsResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedFlavours = async () => {
    if (!confirm(`Seed flavours only in '${mode}' mode?`)) return;

    setLoading(true);
    setError(null);
    setFlavoursResult(null);

    try {
      const response = await fetch(`/api/flavours/seed?mode=${mode}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to seed flavours');
      }

      setFlavoursResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin')}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          ← Back to Admin
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-semibold mb-2">Seed Database</h1>
        <p className="text-gray-600 mb-8">
          Populate the database with initial ingredient and flavour data.
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Seeding Mode
            </label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="mode"
                  value="skip"
                  checked={mode === 'skip'}
                  onChange={(e) => setMode(e.target.value as SeedMode)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium">Skip Existing (Recommended)</div>
                  <div className="text-sm text-gray-600">
                    Only add items that don't already exist. Safe for production.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="mode"
                  value="merge"
                  checked={mode === 'merge'}
                  onChange={(e) => setMode(e.target.value as SeedMode)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium">Merge</div>
                  <div className="text-sm text-gray-600">
                    Update existing items by ID and add new ones. Use with caution.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border border-red-200 rounded-lg cursor-pointer hover:bg-red-50">
                <input
                  type="radio"
                  name="mode"
                  value="replace"
                  checked={mode === 'replace'}
                  onChange={(e) => setMode(e.target.value as SeedMode)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-red-700">Replace All (Destructive)</div>
                  <div className="text-sm text-red-600">
                    Delete all existing data and replace with seed data. Cannot be undone!
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="font-medium mb-4">Seed Options</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={handleSeedAll}
                disabled={loading}
                className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                  mode === 'replace'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? 'Seeding...' : 'Seed All'}
              </button>

              <button
                onClick={handleSeedIngredients}
                disabled={loading}
                className="py-3 px-4 rounded-lg font-medium transition-colors bg-gray-600 hover:bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ingredients Only
              </button>

              <button
                onClick={handleSeedFlavours}
                disabled={loading}
                className="py-3 px-4 rounded-lg font-medium transition-colors bg-gray-600 hover:bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Flavours Only
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="font-medium text-red-800">Error</div>
              <div className="text-sm text-red-600 mt-1">{error}</div>
            </div>
          )}

          {(ingredientsResult || flavoursResult) && (
            <div className="space-y-4">
              {ingredientsResult && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="font-medium text-green-800 mb-2">Ingredients Seeded</div>
                  <div className="text-sm text-green-700 space-y-1">
                    <div>Existing: {ingredientsResult.stats.existing}</div>
                    <div>Added: {ingredientsResult.stats.seeded}</div>
                    {ingredientsResult.stats.skipped > 0 && (
                      <div>Skipped: {ingredientsResult.stats.skipped}</div>
                    )}
                    {ingredientsResult.stats.replaced > 0 && (
                      <div>Updated: {ingredientsResult.stats.replaced}</div>
                    )}
                  </div>
                </div>
              )}

              {flavoursResult && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="font-medium text-green-800 mb-2">Flavours Seeded</div>
                  <div className="text-sm text-green-700 space-y-1">
                    <div>Existing: {flavoursResult.stats.existing}</div>
                    <div>Added: {flavoursResult.stats.seeded}</div>
                    {flavoursResult.stats.skipped > 0 && (
                      <div>Skipped: {flavoursResult.stats.skipped}</div>
                    )}
                    {flavoursResult.stats.replaced > 0 && (
                      <div>Updated: {flavoursResult.stats.replaced}</div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/admin/ingredients')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Ingredients →
                </button>
                <button
                  onClick={() => router.push('/admin/flavours')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Flavours →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="font-medium mb-3">About Seeding</h2>
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            <strong>Ingredients:</strong> 22 items including dairy bases, fruits, herbs, 
            spices, and specialty items like Tajín and sun-dried mole.
          </p>
          <p>
            <strong>Flavours:</strong> 10 archived flavours from Janine's archive, 
            including classic pairings and seasonal offerings.
          </p>
          <p>
            Seed files are located at:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li><code className="px-1 py-0.5 bg-white rounded">lib/seeds/ingredients.ts</code></li>
            <li><code className="px-1 py-0.5 bg-white rounded">lib/seeds/flavours.ts</code></li>
          </ul>
          <p className="text-amber-700 font-medium mt-4">
            Important: Always seed ingredients before flavours, as flavours reference ingredient IDs.
          </p>
        </div>
      </div>
    </div>
  );
}
