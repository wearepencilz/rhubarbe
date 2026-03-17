import { NextRequest, NextResponse } from 'next/server'
import { updateTaxonomyValue, deleteTaxonomyValue } from '@/lib/db'
import { validateTaxonomyDeletion, validateTaxonomyUniqueness } from '@/lib/validation'
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
      const isUnique = await validateTaxonomyUniqueness(params.category, body.value, params.id)
      if (!isUnique) {
        return NextResponse.json(
          { error: 'A taxonomy value with this name already exists in this category' },
          { status: 400 }
        )
      }
    }
    
    const updatedValue = await updateTaxonomyValue(params.category, params.id, body)
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
    // Check if value is in use
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
    
    await deleteTaxonomyValue(params.category, params.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
