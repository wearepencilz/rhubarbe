import { NextRequest, NextResponse } from 'next/server'
import { getProducts, saveProducts, getFormats, getFlavours, getModifiers, getLaunches } from '@/lib/db.js'
import { validateProductComposition } from '@/lib/validation'

// GET /api/products/[id] - Get a single product with expanded relationships
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const products = await getProducts()
    const product = products.find((p: any) => p.id === params.id)
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    
    // Optionally expand relationships
    const { searchParams } = new URL(request.url)
    const expand = searchParams.get('expand')
    
    if (expand === 'true') {
      const formats = await getFormats()
      const flavours = await getFlavours()
      const modifiers = await getModifiers()
      
      const expandedProduct = {
        ...product,
        format: formats.find((f: any) => f.id === product.formatId),
        primaryFlavours: flavours.filter((f: any) => product.primaryFlavourIds?.includes(f.id)),
        secondaryFlavours: flavours.filter((f: any) => product.secondaryFlavourIds?.includes(f.id)),
        components: flavours.filter((f: any) => product.componentIds?.includes(f.id)),
        toppings: modifiers.filter((m: any) => product.toppingIds?.includes(m.id))
      }
      
      return NextResponse.json(expandedProduct)
    }
    
    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - Update a product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const products = await getProducts()
    const index = products.findIndex((p: any) => p.id === params.id)
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    
    // If format or flavours are being updated, validate composition
    if (body.formatId || body.primaryFlavourIds || body.secondaryFlavourIds || body.componentIds) {
      const formats = await getFormats()
      const formatId = body.formatId || products[index].formatId
      const format = formats.find((f: any) => f.id === formatId)
      
      if (!format) {
        return NextResponse.json(
          { error: 'Format not found' },
          { status: 400 }
        )
      }
      
      const flavours = await getFlavours()
      const allFlavourIds = [
        ...(body.primaryFlavourIds || products[index].primaryFlavourIds || []),
        ...(body.secondaryFlavourIds || products[index].secondaryFlavourIds || []),
        ...(body.componentIds || products[index].componentIds || [])
      ]
      const productFlavours = flavours.filter((f: any) => allFlavourIds.includes(f.id))
      
      const updatedProduct = { ...products[index], ...body }
      const validation = await validateProductComposition(updatedProduct, format, productFlavours)
      
      if (!validation.valid) {
        return NextResponse.json(
          { 
            error: 'Product composition validation failed',
            validationErrors: validation.errors
          },
          { status: 400 }
        )
      }
    }
    
    // Update product
    products[index] = {
      ...products[index],
      ...body,
      id: params.id, // Preserve ID
      createdAt: products[index].createdAt, // Preserve creation date
      updatedAt: new Date().toISOString()
    }
    
    await saveProducts(products)
    
    return NextResponse.json(products[index])
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const products = await getProducts()
    const index = products.findIndex((p: any) => p.id === params.id)
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    
    // Remove this product from any launches that reference it
    const launches = await getLaunches()
    const updatedLaunches = launches.map((launch: any) => {
      if (launch.featuredProductIds && launch.featuredProductIds.includes(params.id)) {
        return {
          ...launch,
          featuredProductIds: launch.featuredProductIds.filter((id: string) => id !== params.id)
        }
      }
      return launch
    })
    
    // Save updated launches if any were modified
    const { saveLaunches } = await import('@/lib/db.js')
    await saveLaunches(updatedLaunches)
    
    // Delete the product
    products.splice(index, 1)
    await saveProducts(products)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
