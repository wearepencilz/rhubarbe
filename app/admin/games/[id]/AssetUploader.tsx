'use client';

import { useState } from 'react';
import Image from 'next/image';

interface AssetUploaderProps {
  label: string;
  description: string;
  currentUrl?: string;
  onUpload: (url: string) => void;
  recommendedSize?: string;
}

export default function AssetUploader({
  label,
  description,
  currentUrl,
  onUpload,
  recommendedSize,
}: AssetUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentUrl);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('image', file); // Changed from 'file' to 'image' to match API

      // Upload to API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();
      console.log('Asset uploaded successfully:', data);
      setPreviewUrl(data.url);
      onUpload(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(undefined);
    onUpload('');
  };

  return (
    <div className="space-y-2 border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-900">
            {label}
          </label>
          <p className="text-xs text-gray-600 mt-1">
            {description}
          </p>
          {recommendedSize && (
            <p className="text-xs font-medium text-blue-600 mt-1">
              📏 {recommendedSize}
            </p>
          )}
        </div>
      </div>

      {previewUrl ? (
        <div className="mt-3 relative inline-block">
          <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50 bg-[length:16px_16px] bg-[linear-gradient(45deg,#f0f0f0_25%,transparent_25%,transparent_75%,#f0f0f0_75%,#f0f0f0),linear-gradient(45deg,#f0f0f0_25%,transparent_25%,transparent_75%,#f0f0f0_75%,#f0f0f0)] bg-[position:0_0,8px_8px]">
            <Image
              src={previewUrl}
              alt={label}
              width={96}
              height={96}
              className="pixelated max-w-[96px] max-h-[96px] object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
            title="Remove sprite"
          >
            ×
          </button>
          <p className="text-xs text-gray-500 mt-2">Click × to remove</p>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
            <span className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium">
              {uploading ? 'Uploading...' : '📁 Choose File'}
            </span>
          </label>
          <span className="text-xs text-gray-500">PNG, JPG, GIF, WebP (max 2MB)</span>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
