import { NextRequest, NextResponse } from 'next/server'
import { getProducts, saveProducts } from '@/lib/db.js'

// POST /api/products/[id]/sync - Sync product to Shopify
export async function POST(
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
    
    const product = products[index]
    
    // TODO: Implement actual Shopify API integration
    // For now, we'll simulate a sync
    
    try {
      // Simulate Shopify API call
      // In production, this would call the Shopify Storefront or Admin API
      
      // Update sync status
      products[index] = {
        ...product,
        syncStatus: 'synced',
        lastSyncedAt: new Date().toISOString(),
        syncError: null,
        updatedAt: new Date().toISOString()
      }
      
      await saveProducts(products)
      
      return NextResponse.json({
        success: true,
        product: products[index],
        message: 'Product synced to Shopify successfully'
      })
    } catch (shopifyError: any) {
      // Handle Shopify API errors
      products[index] = {
        ...product,
        syncStatus: 'error',
        lastSyncedAt: new Date().toISOString(),
        syncError: shopifyError.message || 'Unknown Shopify error',
        updatedAt: new Date().toISOString()
      }
      
      await saveProducts(products)
      
      return NextResponse.json(
        { 
          error: 'Shopify sync failed',
          details: shopifyError.message
        },
        { status: 502 }
      )
    }
  } catch (error) {
    console.error('Error syncing product:', error)
    return NextResponse.json(
      { error: 'Failed to sync product' },
      { status: 500 }
    )
  }
}
