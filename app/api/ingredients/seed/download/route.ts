import { NextResponse } from 'next/server';
import { ingredientsSeed } from '@/lib/seeds/ingredients';

/**
 * GET /api/ingredients/seed/download
 * Download example ingredient seed file
 */
export async function GET() {
  try {
    // Convert seed data to JSON string with pretty formatting
    const jsonContent = JSON.stringify(ingredientsSeed, null, 2);
    
    // Create response with JSON file
    return new NextResponse(jsonContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="ingredients-seed-example.json"',
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
