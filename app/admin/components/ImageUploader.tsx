'use client';

import { useState, useRef, DragEvent } from 'react';
import { Button } from '@/app/admin/components/ui/button';
import { Input } from '@/app/admin/components/ui/input';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onDelete?: () => void;
  altText?: string;
  onAltTextChange?: (alt: string) => void;
  aspectRatio?: '1:1' | '4:5' | '16:9';
  label?: string;
  required?: boolean;
}

export default function ImageUploader({
  value,
  onChange,
  onDelete,
  altText = '',
  onAltTextChange,
  aspectRatio = '1:1',
  label = 'Image',
  required = false,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  const maxSizeBytes = 10 * 1024 * 1024; // 10 MB
  const recommendedSizeBytes = 2 * 1024 * 1024; // 2 MB

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Only JPG, PNG, WebP, and AVIF are allowed.';
    }

    // Check file size
    if (file.size > maxSizeBytes) {
      return `File size exceeds 10 MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)} MB`;
    }

    // Warn if file is larger than recommended
    if (file.size > recommendedSizeBytes) {
      console.warn(`File size (${(file.size / 1024 / 1024).toFixed(2)} MB) exceeds recommended 2 MB. Consider compressing.`);
    }

    return null;
  };

  const normalizeFilename = (filename: string): string => {
    return filename
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9.-]/g, '');
  };

  const uploadFile = async (file: File) => {
    setError(null);
    setUploading(true);

    try {
      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Normalize filename
      const normalizedName = normalizeFilename(file.name);
      const renamedFile = new File([file], normalizedName, { type: file.type });

      // Upload
      const formData = new FormData();
      formData.append('image', renamedFile);
      formData.append('altText', altText);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      
      // Log storage type for debugging
      if (data.storage === 'vercel-blob') {
        console.log('✓ Image uploaded to Vercel Blob CDN:', data.url);
      } else {
        console.log('✓ Image uploaded locally:', data.url);
      }
      
      onChange(data.url);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    } else {
      onChange('');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '1:1':
        return 'aspect-square';
      case '4:5':
        return 'aspect-[4/5]';
      case '16:9':
        return 'aspect-video';
      default:
        return 'aspect-square';
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Upload Area */}
      {!value ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={allowedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />

          {uploading ? (
            <div className="py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Uploading...</p>
            </div>
          ) : (
            <>
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[--color-brand-600] hover:text-[--color-brand-700] font-medium"
                >
                  Click to upload
                </button>{' '}
                or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG, WebP, AVIF up to 10MB
              </p>
              <p className="text-xs text-gray-500">
                Recommended: under 2MB for optimal performance
              </p>
            </>
          )}
        </div>
      ) : (
        /* Preview */
        <div className="space-y-3">
          <div className={`relative ${getAspectRatioClass()} w-full max-w-md rounded-lg overflow-hidden border border-gray-300`}>
            <img
              src={value}
              alt={altText || 'Preview'}
              className="w-full h-full object-cover"
            />
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleDelete}
              className="absolute top-2 right-2 !rounded-full !p-2"
              aria-label="Delete image"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm text-[--color-brand-600] hover:text-[--color-brand-700]"
          >
            Replace image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={allowedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Alt Text Field */}
      {onAltTextChange && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alt Text <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={altText}
            onChange={(val) => onAltTextChange(val)}
            placeholder="Describe the image for accessibility"
            isRequired={required}
          />
          <p className="text-xs text-gray-500 mt-1">
            Example: "Blood orange sorbet soft serve twist"
          </p>
        </div>
      )}

      {/* Aspect Ratio Info */}
      <div className="text-xs text-gray-500">
        <p>Aspect ratio: {aspectRatio}</p>
        <p className="mt-1">
          {aspectRatio === '1:1' && 'Square format - ideal for menu cards and product listings'}
          {aspectRatio === '4:5' && 'Portrait format - ideal for Instagram-style posts'}
          {aspectRatio === '16:9' && 'Landscape format - ideal for hero banners'}
        </p>
      </div>
    </div>
  );
}
