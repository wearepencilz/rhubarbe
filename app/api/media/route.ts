import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import * as mediaQueries from '@/lib/db/queries/media';
import type { ErrorResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const items = await mediaQueries.list({ search });
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json({ error: 'Failed to fetch media', timestamp: new Date().toISOString() } satisfies ErrorResponse, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED', timestamp: new Date().toISOString() } satisfies ErrorResponse, { status: 401 });
  }

  try {
    // Forward to existing upload endpoint logic
    const formData = await request.formData();
    const file = formData.get('image') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded', timestamp: new Date().toISOString() } satisfies ErrorResponse, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type', timestamp: new Date().toISOString() } satisfies ErrorResponse, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File exceeds 10 MB', timestamp: new Date().toISOString() } satisfies ErrorResponse, { status: 400 });
    }

    const normalizedName = file.name.substring(0, file.name.lastIndexOf('.')).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const filename = `${Date.now()}-${normalizedName}`;

    let url: string;
    if (process.env.PUB_READ_WRITE_TOKEN) {
      const { put } = await import('@vercel/blob');
      const blob = await put(filename, file, { access: 'public', addRandomSuffix: false, token: process.env.PUB_READ_WRITE_TOKEN });
      url = blob.url;
    } else {
      const { writeFile, mkdir } = await import('fs/promises');
      const { existsSync } = await import('fs');
      const path = await import('path');
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!existsSync(uploadsDir)) await mkdir(uploadsDir, { recursive: true });
      await writeFile(path.join(uploadsDir, filename), Buffer.from(await file.arrayBuffer()));
      url = `/uploads/${filename}`;
    }

    const record = await mediaQueries.create({
      url,
      filename: file.name,
      alt: { en: '', fr: '' },
      size: file.size,
      mimeType: file.type,
      tags: [],
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json({ error: 'Upload failed', timestamp: new Date().toISOString() } satisfies ErrorResponse, { status: 500 });
  }
}
