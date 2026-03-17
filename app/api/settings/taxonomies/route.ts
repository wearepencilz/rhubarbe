import { NextRequest, NextResponse } from 'next/server'
import { getTaxonomies, saveTaxonomies } from '@/lib/db'
import { auth } from '@/lib/auth'

// GET /api/settings/taxonomies - Get all taxonomies
export async function GET() {
  try {
    const taxonomies = await getTaxonomies()
    return NextResponse.json({ taxonomies })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/settings/taxonomies - Bulk update taxonomies
export async function PUT(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    await saveTaxonomies(body)
    return NextResponse.json(body)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
