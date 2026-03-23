import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

// Runtime config for Vercel
export const runtime = 'nodejs';
export const maxDuration = 30; // 30 seconds max for upload

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const altText = formData.get('altText') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: JPG, PNG, WebP, AVIF, GIF, SVG.` },
        { status: 400 }
      );
    }

    // Validate file size (10 MB max)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: `File size exceeds 10 MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)} MB` },
        { status: 400 }
      );
    }

    // Normalize filename per requirements
    const normalizeFilename = (name: string): string => {
      const nameWithoutExt = name.substring(0, name.lastIndexOf('.')) || name;
      const ext = name.substring(name.lastIndexOf('.'));
      return nameWithoutExt
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '') + ext.toLowerCase();
    };

    const normalizedName = normalizeFilename(file.name);
    const timestamp = Date.now();
    const filename = `${timestamp}-${normalizedName}`;

    // Check environment and Vercel Blob availability
    const hasVercelBlob = !!(process.env.PUB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN);
    const isVercel = process.env.VERCEL === '1';
    const isProduction = process.env.NODE_ENV === 'production';

    // Production Strategy:
    // 1. If BLOB_READ_WRITE_TOKEN exists → Use Vercel Blob (CDN delivery)
    // 2. If on Vercel without token → Return error (filesystem is read-only)
    // 3. If local development → Use local filesystem (public/uploads/)
    
    // Use Vercel Blob in production or when explicitly configured
    if (hasVercelBlob) {
      try {
        const { put } = await import('@vercel/blob');
        
        const blob = await put(filename, file, {
          access: 'public',
          addRandomSuffix: false,
          token: process.env.PUB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN,
        });
        
        console.log('✓ Uploaded to Vercel Blob:', blob.url);
        
        return NextResponse.json({ 
          url: blob.url,
          filename: filename,
          size: file.size,
          type: file.type,
          altText: altText || '',
          storage: 'vercel-blob',
        });
      } catch (blobError: any) {
        console.error('⚠ Vercel Blob upload failed:', blobError);
        
        // In production on Vercel, if Blob fails, return error (don't fallback to filesystem)
        if (isVercel || isProduction) {
          return NextResponse.json(
            { error: `Blob upload failed: ${blobError.message || 'Unknown error'}` },
            { status: 500 }
          );
        }
        
        // In development, fall through to local storage
        console.warn('Falling back to local storage in development');
      }
    }

    // Development: Save to local public/uploads directory
    // Note: This won't work in production on Vercel (read-only filesystem)
    if (isVercel && !hasVercelBlob) {
      return NextResponse.json(
        { error: 'Image upload not configured. Please add BLOB_READ_WRITE_TOKEN to your Vercel environment variables.' },
        { status: 500 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, buffer);
    
    const url = `/uploads/${filename}`;
    console.log('✓ File saved locally:', url);
    
    return NextResponse.json({ 
      url,
      filename: filename,
      size: file.size,
      type: file.type,
      altText: altText || '',
      storage: 'local',
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
