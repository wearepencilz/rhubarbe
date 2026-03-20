import { NextRequest, NextResponse } from 'next/server'
import { getProducts, saveProducts } from '@/lib/db.js'
import { availabilityCache } from '@/lib/cache/availability-cache'

// GET /api/products/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const products = await getProducts()
    const product = products.find((p: any) => p.id === params.id)

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

// PUT /api/products/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const products = await getProducts()
    const index = products.findIndex((p: any) => p.id === params.id)

    if (index === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Validate availability_mode if provided
    if (body.availabilityMode !== undefined) {
      const validModes = ['always_available', 'scheduled', 'pattern_based', 'hidden']
      if (!validModes.includes(body.availabilityMode)) {
        return NextResponse.json(
          { error: `Invalid availability_mode. Must be one of: ${validModes.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Validate quantity rules if provided
    if (body.defaultMinQuantity !== undefined && body.defaultMinQuantity < 1) {
      return NextResponse.json({ error: 'default_min_quantity must be at least 1' }, { status: 400 })
    }
    if (body.defaultQuantityStep !== undefined && body.defaultQuantityStep < 1) {
      return NextResponse.json({ error: 'default_quantity_step must be at least 1' }, { status: 400 })
    }

    products[index] = {
      ...products[index],
      ...body,
      id: params.id,
      createdAt: products[index].createdAt,
      updatedAt: new Date().toISOString(),
    }

    await saveProducts(products)

    // Invalidate availability cache
    availabilityCache.invalidate(`availability:${params.id}`)
    availabilityCache.invalidate(`products:orderable:`)

    return NextResponse.json(products[index])
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

// PATCH /api/products/[id] — partial update (same logic as PUT)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return PUT(request, { params })
}

// DELETE /api/products/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const products = await getProducts()
    const index = products.findIndex((p: any) => p.id === params.id)

    if (index === -1) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    products.splice(index, 1)
    await saveProducts(products)

    // Invalidate availability cache
    availabilityCache.invalidate(`availability:${params.id}`)
    availabilityCache.invalidate(`products:orderable:`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
