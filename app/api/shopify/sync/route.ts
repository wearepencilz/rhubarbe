import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createSyncJob, processSyncJob } from '@/lib/sync/queue';
import type { ErrorResponse } from '@/types';

export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { flavourId, productId } = body;
    
    if (!flavourId || !productId) {
      const errorResponse: ErrorResponse = {
        error: 'flavourId and productId are required',
        code: 'MISSING_PARAMS',
        timestamp: new Date().toISOString()
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }
    
    // Create sync job
    const job = await createSyncJob(flavourId, productId);
    
    // Process job immediately (in production, this would be queued)
    try {
      await processSyncJob(job.id);
      
      return NextResponse.json({
        message: 'Sync completed successfully',
        jobId: job.id,
        status: 'completed'
      });
    } catch (error: any) {
      // Job failed but was logged
      return NextResponse.json({
        message: 'Sync job created but failed to process',
        jobId: job.id,
        status: 'failed',
        error: error.message
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error creating sync job:', error);
    const errorResponse: ErrorResponse = {
      error: 'Failed to create sync job',
      details: error.message,
      timestamp: new Date().toISOString()
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
