import { NextRequest, NextResponse } from 'next/server'
import { getModifiers, saveModifiers, getProducts } from '@/lib/db.js'

// GET /api/modifiers/[id] - Get a single modifier
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const modifiers = await getModifiers()
    const modifier = modifiers.find((m: any) => m.id === params.id)
    
    if (!modifier) {
      return NextResponse.json(
        { error: 'Modifier not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(modifier)
  } catch (error) {
    console.error('Error fetching modifier:', error)
    return NextResponse.json(
      { error: 'Failed to fetch modifier' },
      { status: 500 }
    )
  }
}

// PUT /api/modifiers/[id] - Update a modifier
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const modifiers = await getModifiers()
    const index = modifiers.findIndex((m: any) => m.id === params.id)
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Modifier not found' },
        { status: 404 }
      )
    }
    
    // Validate slug uniqueness if changed
    if (body.slug && body.slug !== modifiers[index].slug) {
      const existingSlug = modifiers.find((m: any) => m.slug === body.slug)
      if (existingSlug) {
        return NextResponse.json(
          { error: 'A modifier with this slug already exists' },
          { status: 400 }
        )
      }
    }
    
    // Update modifier
    modifiers[index] = {
      ...modifiers[index],
      ...body,
      id: params.id, // Preserve ID
      createdAt: modifiers[index].createdAt, // Preserve creation date
      updatedAt: new Date().toISOString()
    }
    
    await saveModifiers(modifiers)
    
    return NextResponse.json(modifiers[index])
  } catch (error) {
    console.error('Error updating modifier:', error)
    return NextResponse.json(
      { error: 'Failed to update modifier' },
      { status: 500 }
    )
  }
}

// DELETE /api/modifiers/[id] - Delete a modifier
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const modifiers = await getModifiers()
    const index = modifiers.findIndex((m: any) => m.id === params.id)
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Modifier not found' },
        { status: 404 }
      )
    }
    
    // Check referential integrity - is this modifier used in any products?
    const products = await getProducts()
    const usedInProducts = products.filter((p: any) => 
      p.toppingIds && p.toppingIds.includes(params.id)
    )
    
    if (usedInProducts.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete modifier that is used in products',
          usedIn: usedInProducts.map((p: any) => ({ id: p.id, name: p.internalName }))
        },
        { status: 400 }
      )
    }
    
    modifiers.splice(index, 1)
    await saveModifiers(modifiers)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting modifier:', error)
    return NextResponse.json(
      { error: 'Failed to delete modifier' },
      { status: 500 }
    )
  }
}
