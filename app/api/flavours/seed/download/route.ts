import { NextResponse } from 'next/server';
import { flavoursSeed } from '@/lib/seeds/flavours';

/**
 * GET /api/flavours/seed/download
 * Download example flavour seed file
 */
export async function GET() {
  try {
    // Convert seed data to JSON string with pretty formatting
    const jsonContent = JSON.stringify(flavoursSeed, null, 2);
    
    // Create response with JSON file
    return new NextResponse(jsonContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="flavours-seed-example.json"',
      },
    });
  } catch (error) {
    console.error('Error generating seed file:', error);
    return NextResponse.json(
      { error: 'Failed to generate seed file' },
      { status: 500 }
    );
  }
}
