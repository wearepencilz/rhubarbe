import { NextRequest, NextResponse } from 'next/server'
import { getProducts, saveProducts } from '@/lib/db.js'

// GET /api/products - Get all products with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const formatId = searchParams.get('formatId')
    const onlineOrderable = searchParams.get('onlineOrderable')

    let products = await getProducts()

    if (status) {
      products = products.filter((p: any) => p.status === status)
    }
    if (formatId) {
      products = products.filter((p: any) => p.formatId === formatId)
    }
    if (onlineOrderable === 'true') {
      products = products.filter((p: any) => p.onlineOrderable === true)
    }

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const products = await getProducts()
    const id = `product-${Date.now()}`

    const newProduct = {
      id,
      title: body.title,
      slug: body.slug || id,
      status: body.status || 'draft',
      description: body.description || null,
      shortCardCopy: body.shortCardCopy || null,
      image: body.image || null,
      price: body.price || 0,
      compareAtPrice: body.compareAtPrice || null,
      tags: body.tags || [],
      shopifyProductId: body.shopifyProductId || null,
      shopifyProductHandle: body.shopifyProductHandle || null,
      inventoryTracked: body.inventoryTracked || false,
      inventoryQuantity: body.inventoryQuantity || null,
      onlineOrderable: body.onlineOrderable || false,
      pickupOnly: body.pickupOnly || false,
      keyNotes: body.keyNotes || [],
      tastingNotes: body.tastingNotes || null,
      ingredients: body.ingredients || [],
      translations: body.translations || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    products.push(newProduct)
    await saveProducts(products)

    return NextResponse.json(newProduct, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
