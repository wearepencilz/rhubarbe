import { NextRequest, NextResponse } from 'next/server'
import { getProducts, saveProducts } from '@/lib/db.js'

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

    products[index] = {
      ...products[index],
      ...body,
      id: params.id,
      createdAt: products[index].createdAt,
      updatedAt: new Date().toISOString(),
    }

    await saveProducts(products)
    return NextResponse.json(products[index])
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
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
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
