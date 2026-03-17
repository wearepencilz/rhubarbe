import { NextRequest, NextResponse } from 'next/server'
import { getLaunches, saveLaunches } from '@/lib/db.js'

// GET /api/launches - Get all launches with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const featured = searchParams.get('featured')
    
    let launches = await getLaunches()
    
    // Filter by status
    if (status) {
      launches = launches.filter((launch: any) => launch.status === status)
    }
    
    // Filter by featured
    if (featured === 'true') {
      launches = launches.filter((launch: any) => launch.featured === true)
    }
    
    return NextResponse.json(launches)
  } catch (error) {
    console.error('Error fetching launches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch launches' },
      { status: 500 }
    )
  }
}

// POST /api/launches - Create a new launch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }
    
    const launches = await getLaunches()
    
    // Generate ID and slug
    const id = `launch-${Date.now()}`
    const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    
    // Check for duplicate slug
    const existingSlug = launches.find((l: any) => l.slug === slug)
    if (existingSlug) {
      return NextResponse.json(
        { error: 'A launch with this slug already exists' },
        { status: 400 }
      )
    }
    
    const newLaunch = {
      id,
      title: body.title,
      slug,
      status: body.status || 'upcoming',
      heroImage: body.heroImage || null,
      story: body.story || null,
      description: body.description || null,
      activeStart: body.activeStart || null,
      activeEnd: body.activeEnd || null,
      featuredFlavourIds: body.featuredFlavourIds || [],
      featuredProductIds: body.featuredProductIds || [],
      contentBlocks: body.contentBlocks || [],
      relatedEventIds: body.relatedEventIds || [],
      relatedMembershipDropIds: body.relatedMembershipDropIds || [],
      sortOrder: body.sortOrder || launches.length + 1,
      featured: body.featured || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    launches.push(newLaunch)
    await saveLaunches(launches)
    
    return NextResponse.json(newLaunch, { status: 201 })
  } catch (error) {
    console.error('Error creating launch:', error)
    return NextResponse.json(
      { error: 'Failed to create launch' },
      { status: 500 }
    )
  }
}
