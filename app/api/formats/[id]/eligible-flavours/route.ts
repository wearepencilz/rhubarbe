import { NextRequest, NextResponse } from 'next/server'
import { getFormats, getFlavours } from '@/lib/db.js'
import { filterEligibleFlavours } from '@/lib/validation'

// GET /api/formats/[id]/eligible-flavours - Get format and its eligible flavours
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formats = await getFormats()
    const format = formats.find((f: any) => f.id === params.id)
    
    if (!format) {
      return NextResponse.json(
        { error: 'Format not found' },
        { status: 404 }
      )
    }
    
    // Get all flavours
    const allFlavours = await getFlavours()
    
    // Filter to only eligible flavours for this format
    const eligibleFlavours = await filterEligibleFlavours(allFlavours, format.category)
    
    return NextResponse.json({
      format,
      eligibleFlavours,
      count: eligibleFlavours.length
    })
  } catch (error) {
    console.error('Error fetching eligible flavours:', error)
    return NextResponse.json(
      { error: 'Failed to fetch eligible flavours' },
      { status: 500 }
    )
  }
}
