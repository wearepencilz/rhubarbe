import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getSyncJobs } from '@/lib/db';
import type { SyncJob, ErrorResponse } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const session = await auth();
  
  if (!session) {
    const errorResponse: ErrorResponse = {
      error: 'Unauthorized',
      code: 'AUTH_REQUIRED',
      timestamp: new Date().toISOString()
    };
    return NextResponse.json(errorResponse, { status: 401 });
  }

  try {
    const jobs = await getSyncJobs() as SyncJob[];
    const job = jobs.find(j => j.id === params.jobId);
    
    if (!job) {
      const errorResponse: ErrorResponse = {
        error: 'Sync job not found',
        code: 'NOT_FOUND',
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }
    
    return NextResponse.json(job);
  } catch (error: any) {
    console.error('Error fetching sync job status:', error);
    const errorResponse: ErrorResponse = {
      error: 'Failed to fetch sync job status',
      details: error.message,
      timestamp: new Date().toISOString()
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
