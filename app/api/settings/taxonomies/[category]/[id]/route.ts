import { NextRequest, NextResponse } from 'next/server'
import { update, remove, isValueUnique } from '@/lib/db/queries/taxonomies'
import { validateTaxonomyDeletion } from '@/lib/validation'
import { auth } from '@/lib/auth'

// PUT /api/settings/taxonomies/[category]/[id] - Update taxonomy value
export async function PUT(
  request: NextRequest,
  { params }: { params: { category: string; id: string } }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    // Validate uniqueness if value is being changed
    if (body.value) {
      const unique = await isValueUnique(params.category, body.value, params.id)
      if (!unique) {
        return NextResponse.json(
          { error: 'A taxonomy value with this name already exists in this category' },
          { status: 400 }
        )
      }
    }

    const updatedValue = await update(params.id, body)
    return NextResponse.json(updatedValue)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/settings/taxonomies/[category]/[id] - Delete taxonomy value
export async function DELETE(
  request: NextRequest,
  { params }: { params: { category: string; id: string } }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Check if value is in use (still uses lib/validation which reads from JSON for non-migrated entities)
    const validation = await validateTaxonomyDeletion(params.category, params.id)

    if (!validation.canDelete) {
      return NextResponse.json(
        {
          error: 'Cannot delete taxonomy value because it is in use',
          usedBy: validation.usedBy
        },
        { status: 409 }
      )
    }

    await remove(params.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
