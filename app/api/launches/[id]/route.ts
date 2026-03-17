import { NextRequest, NextResponse } from 'next/server'
import { getLaunches, saveLaunches, getProducts } from '@/lib/db.js'

// GET /api/launches/[id] - Get a single launch
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const launches = await getLaunches()
    const launch = launches.find((l: any) => l.id === params.id)
    
    if (!launch) {
      return NextResponse.json(
        { error: 'Launch not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(launch)
  } catch (error) {
    console.error('Error fetching launch:', error)
    return NextResponse.json(
      { error: 'Failed to fetch launch' },
      { status: 500 }
    )
  }
}

// PUT /api/launches/[id] - Update a launch
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const launches = await getLaunches()
    const index = launches.findIndex((l: any) => l.id === params.id)
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Launch not found' },
        { status: 404 }
      )
    }
    
    // Validate slug uniqueness if changed
    if (body.slug && body.slug !== launches[index].slug) {
      const existingSlug = launches.find((l: any) => l.slug === body.slug)
      if (existingSlug) {
        return NextResponse.json(
          { error: 'A launch with this slug already exists' },
          { status: 400 }
        )
      }
    }
    
    // Update launch
    launches[index] = {
      ...launches[index],
      ...body,
      id: params.id, // Preserve ID
      createdAt: launches[index].createdAt, // Preserve creation date
      updatedAt: new Date().toISOString()
    }
    
    await saveLaunches(launches)
    
    return NextResponse.json(launches[index])
  } catch (error) {
    console.error('Error updating launch:', error)
    return NextResponse.json(
      { error: 'Failed to update launch' },
      { status: 500 }
    )
  }
}

// DELETE /api/launches/[id] - Delete a launch
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const launches = await getLaunches()
    const index = launches.findIndex((l: any) => l.id === params.id)
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Launch not found' },
        { status: 404 }
      )
    }
    
    // Check referential integrity - launches don't have dependencies
    // (they reference other objects, but nothing references them)
    
    launches.splice(index, 1)
    await saveLaunches(launches)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting launch:', error)
    return NextResponse.json(
      { error: 'Failed to delete launch' },
      { status: 500 }
    )
  }
}
