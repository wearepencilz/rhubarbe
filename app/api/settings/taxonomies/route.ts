import { NextRequest, NextResponse } from 'next/server'
import { getAllGroupedByCategory } from '@/lib/db/queries/taxonomies'
import { auth } from '@/lib/auth'

// GET /api/settings/taxonomies - Get all taxonomies grouped by category
export async function GET() {
  try {
    const taxonomies = await getAllGroupedByCategory()
    return NextResponse.json({ taxonomies })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
