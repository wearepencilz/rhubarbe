import { NextRequest, NextResponse } from 'next/server'
import { getProducts, saveProducts, getFormats, getFlavours, getModifiers } from '@/lib/db.js'
import { validateProductComposition, generateProductName } from '@/lib/validation'

// GET /api/products - Get all products with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const formatId = searchParams.get('formatId')
    const onlineOrderable = searchParams.get('onlineOrderable')
    
    let products = await getProducts()
    
    // Filter by status
    if (status) {
      products = products.filter((p: any) => p.status === status)
    }
    
    // Filter by format
    if (formatId) {
      products = products.filter((p: any) => p.formatId === formatId)
    }
    
    // Filter by online orderable
    if (onlineOrderable === 'true') {
      products = products.filter((p: any) => p.onlineOrderable === true)
    }
    
    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.formatId) {
      return NextResponse.json(
        { error: 'Format is required' },
        { status: 400 }
      )
    }
    
    if (!body.primaryFlavourIds || body.primaryFlavourIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one flavour is required' },
        { status: 400 }
      )
    }
    
    // Get related data for validation
    const formats = await getFormats()
    const format = formats.find((f: any) => f.id === body.formatId)
    
    if (!format) {
      return NextResponse.json(
        { error: 'Format not found' },
        { status: 400 }
      )
    }
    
    const flavours = await getFlavours()
    const allFlavourIds = [
      ...(body.primaryFlavourIds || []),
      ...(body.secondaryFlavourIds || []),
      ...(body.componentIds || [])
    ]
    const productFlavours = flavours.filter((f: any) => allFlavourIds.includes(f.id))
    
    // Validate product composition
    const validation = await validateProductComposition(body, format, productFlavours)
    
    if (!validation.valid) {
      return NextResponse.json(
        { 
          error: 'Product composition validation failed',
          validationErrors: validation.errors
        },
        { status: 400 }
      )
    }
    
    const products = await getProducts()
    
    // Generate ID and slug
    const id = `product-${Date.now()}`
    const slug = body.slug || `${format.slug}-${Date.now()}`
    
    // Generate names if not provided
    const names = generateProductName(body, format, productFlavours)
    
    const newProduct = {
      id,
      internalName: body.internalName || names.internalName,
      publicName: body.publicName || names.publicName,
      slug,
      status: body.status || 'draft',
      formatId: body.formatId,
      primaryFlavourIds: body.primaryFlavourIds || [],
      secondaryFlavourIds: body.secondaryFlavourIds || [],
      componentIds: body.componentIds || [],
      toppingIds: body.toppingIds || [],
      description: body.description || null,
      shortCardCopy: body.shortCardCopy || null,
      image: body.image || null,
      price: body.price || 0,
      compareAtPrice: body.compareAtPrice || null,
      availabilityStart: body.availabilityStart || null,
      availabilityEnd: body.availabilityEnd || null,
      location: body.location || [],
      tags: body.tags || [],
      shopifyProductId: body.shopifyProductId || null,
      shopifyProductHandle: body.shopifyProductHandle || null,
      shopifySKU: body.shopifySKU || null,
      posMapping: body.posMapping || null,
      syncStatus: body.syncStatus || 'not-synced',
      lastSyncedAt: body.lastSyncedAt || null,
      syncError: body.syncError || null,
      inventoryTracked: body.inventoryTracked || false,
      inventoryQuantity: body.inventoryQuantity || null,
      batchCode: body.batchCode || null,
      restockDate: body.restockDate || null,
      shelfLifeNotes: body.shelfLifeNotes || null,
      onlineOrderable: body.onlineOrderable || false,
      pickupOnly: body.pickupOnly || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    products.push(newProduct)
    await saveProducts(products)
    
    return NextResponse.json(newProduct, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
