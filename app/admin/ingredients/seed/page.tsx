'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

type SeedMode = 'skip' | 'merge' | 'replace';

export default function SeedIngredientsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<SeedMode>('skip');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleSeed = async () => {
    if (!confirm(`Are you sure you want to seed ingredients in '${mode}' mode?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/ingredients/seed?mode=${mode}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to seed ingredients');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExample = () => {
    window.location.href = '/api/ingredients/seed/download';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/json') {
        setError('Please upload a JSON file');
        return;
      }
      setUploadedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!uploadedFile) {
      setError('Please select a file first');
      return;
    }

    if (!confirm(`Upload and seed ingredients from file in '${mode}' mode?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const fileContent = await uploadedFile.text();
      const jsonData = JSON.parse(fileContent);

      const response = await fetch(`/api/ingredients/seed/upload?mode=${mode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload ingredients');
      }

      setResult(data);
      setUploadedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
          onClick={() => router.push('/admin/ingredients')}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          ← Back to Ingredients
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-semibold mb-2">Seed Ingredients</h1>
        <p className="text-gray-600 mb-8">
          Populate the database with initial ingredient data from the seed file.
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
                    Only add ingredients that don't already exist. Safe for production.
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
                    Update existing ingredients by ID and add new ones. Use with caution.
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
                    Delete all existing ingredients and replace with seed data. Cannot be undone!
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="font-medium mb-4">Seed from Built-in Data</h2>
            <button
              onClick={handleSeed}
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                mode === 'replace'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Seeding...' : `Seed from Built-in Data (${mode})`}
            </button>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="font-medium mb-4">Upload Custom Seed File</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Select JSON file to upload
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploadedFile && (
                  <p className="text-sm text-green-600 mt-2">
                    Selected: {uploadedFile.name}
                  </p>
                )}
              </div>
              <button
                onClick={handleUpload}
                disabled={loading || !uploadedFile}
                className="w-full py-3 px-4 rounded-lg font-medium transition-colors bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Uploading...' : 'Upload and Seed'}
              </button>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="font-medium mb-4">Download Example File</h2>
            <button
              onClick={handleDownloadExample}
              className="w-full py-3 px-4 rounded-lg font-medium transition-colors bg-gray-600 hover:bg-gray-700 text-white"
            >
              Download Example Seed File
            </button>
            <p className="text-sm text-gray-600 mt-2">
              Download the example file to learn the format and customize your own seed data.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="font-medium text-red-800">Error</div>
              <div className="text-sm text-red-600 mt-1">{error}</div>
            </div>
          )}

          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="font-medium text-green-800 mb-2">Success!</div>
              <div className="text-sm text-green-700 space-y-1">
                <div>Mode: {mode}</div>
                <div>Existing ingredients: {result.stats.existing}</div>
                <div>New ingredients added: {result.stats.seeded}</div>
                {result.stats.skipped > 0 && (
                  <div>Skipped (already exist): {result.stats.skipped}</div>
                )}
                {result.stats.replaced > 0 && (
                  <div>Updated/Replaced: {result.stats.replaced}</div>
                )}
              </div>
              <button
                onClick={() => router.push('/admin/ingredients')}
                className="mt-4 text-sm text-green-700 hover:text-green-800 font-medium"
              >
                View Ingredients →
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="font-medium mb-3">About Seeding</h2>
        <div className="text-sm text-gray-600 space-y-2">
          <p>
            The seed file contains {22} predefined ingredients including dairy bases, 
            fruits, herbs, and specialty items.
          </p>
          <p>
            Seed data is located at <code className="px-1 py-0.5 bg-white rounded">lib/seeds/ingredients.ts</code>
          </p>
          <p>
            You can modify the seed file to add or update ingredients before seeding.
          </p>
        </div>
      </div>
    </div>
  );
}
