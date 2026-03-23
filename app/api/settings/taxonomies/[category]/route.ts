import { NextRequest, NextResponse } from 'next/server'
import { getByCategory, create, isValueUnique } from '@/lib/db/queries/taxonomies'
import { auth } from '@/lib/auth'

// GET /api/settings/taxonomies/[category] - Get specific taxonomy category
export async function GET(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  try {
    const values = await getByCategory(params.category)
    return NextResponse.json({ values })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/settings/taxonomies/[category] - Add new taxonomy value
export async function POST(
  request: NextRequest,
  { params }: { params: { category: string } }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    // Validate uniqueness
    const unique = await isValueUnique(params.category, body.value)
    if (!unique) {
      return NextResponse.json(
        { error: 'A taxonomy value with this name already exists in this category' },
        { status: 400 }
      )
    }

    const newValue = await create(params.category, body)
    return NextResponse.json(newValue, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
