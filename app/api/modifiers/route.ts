import { NextRequest, NextResponse } from 'next/server'
import { getModifiers, saveModifiers } from '@/lib/db.js'

// GET /api/modifiers - Get all modifiers with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const formatId = searchParams.get('formatId')
    
    let modifiers = await getModifiers()
    
    // Filter by type
    if (type) {
      modifiers = modifiers.filter((mod: any) => mod.type === type)
    }
    
    // Filter by status
    if (status) {
      modifiers = modifiers.filter((mod: any) => mod.status === status)
    }
    
    // Filter by format availability
    if (formatId) {
      modifiers = modifiers.filter((mod: any) => 
        mod.availableForFormatIds && mod.availableForFormatIds.includes(formatId)
      )
    }
    
    return NextResponse.json(modifiers)
  } catch (error) {
    console.error('Error fetching modifiers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch modifiers' },
      { status: 500 }
    )
  }
}

// POST /api/modifiers - Create a new modifier
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }
    
    if (!body.type) {
      return NextResponse.json(
        { error: 'Type is required' },
        { status: 400 }
      )
    }
    
    const modifiers = await getModifiers()
    
    // Generate ID and slug
    const id = `modifier-${Date.now()}`
    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    
    // Check for duplicate slug
    const existingSlug = modifiers.find((m: any) => m.slug === slug)
    if (existingSlug) {
      return NextResponse.json(
        { error: 'A modifier with this slug already exists' },
        { status: 400 }
      )
    }
    
    const newModifier = {
      id,
      name: body.name,
      slug,
      type: body.type,
      description: body.description || null,
      image: body.image || null,
      price: body.price || 0,
      allergens: body.allergens || [],
      dietaryFlags: body.dietaryFlags || [],
      availableForFormatIds: body.availableForFormatIds || [],
      status: body.status || 'active',
      sortOrder: body.sortOrder || modifiers.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    modifiers.push(newModifier)
    await saveModifiers(modifiers)
    
    return NextResponse.json(newModifier, { status: 201 })
  } catch (error) {
    console.error('Error creating modifier:', error)
    return NextResponse.json(
      { error: 'Failed to create modifier' },
      { status: 500 }
    )
  }
}
