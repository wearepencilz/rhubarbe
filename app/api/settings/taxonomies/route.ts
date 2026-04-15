import { NextRequest, NextResponse } from 'next/server'
import { getAllGroupedByCategory } from '@/lib/db/queries/taxonomies'
import { auth } from '@/lib/auth'

// GET /api/settings/taxonomies - Get all taxonomies grouped by category
export async function GET() {
  try {
    const taxonomies = await getAllGroupedByCategory()
    const res = NextResponse.json({ taxonomies })
    res.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300')
    return res
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
