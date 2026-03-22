import { NextRequest, NextResponse } from 'next/server'
import { getProducts, saveProducts } from '@/lib/db.js'
import { availabilityCache } from '@/lib/cache/availability-cache'
import { updateProduct as syncToShopify } from '@/lib/shopify/admin'

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

    // Sync to Shopify if product is linked
    const saved = products[index];
    let syncError = null;
    if (saved.shopifyProductId) {
      try {
        const descriptionHtml = [
          saved.title ? `<h2>${saved.title}</h2>` : '',
          saved.description ? `<p>${saved.description}</p>` : '',
        ].filter(Boolean).join('\n');

        await syncToShopify({
          shopifyProductId: saved.shopifyProductId,
          title: saved.title || saved.name || saved.slug,
          descriptionHtml,
          status: saved.status === 'active' ? 'ACTIVE' : 'DRAFT',
          tags: saved.tags || [],
          price: saved.price ? (saved.price / 100).toFixed(2) : undefined,
          // Sync variant prices if product has variants with Shopify IDs
          ...(saved.variants && saved.variants.length > 0 && saved.variants.some((v: any) => v.shopifyVariantId) ? {
            variants: saved.variants
              .filter((v: any) => v.shopifyVariantId)
              .map((v: any) => ({
                id: v.shopifyVariantId,
                price: ((v.price || saved.price) / 100).toFixed(2),
              })),
          } : {}),
          metafields: [
            {
              namespace: 'translations',
              key: 'title_fr',
              value: saved.translations?.fr?.title || saved.title || '',
              type: 'single_line_text_field',
            },
            {
              namespace: 'translations',
              key: 'description_fr',
              value: saved.translations?.fr?.description || saved.description || '',
              type: 'multi_line_text_field',
            },
          ],
        });

        products[index] = {
          ...products[index],
          syncStatus: 'synced',
          lastSyncedAt: new Date().toISOString(),
          syncError: null,
        };
        await saveProducts(products);
      } catch (err: any) {
        syncError = err.message || 'Shopify sync failed';
        console.error('Shopify sync error:', syncError);
        products[index] = {
          ...products[index],
          syncStatus: 'error',
          syncError,
        };
        await saveProducts(products);
      }
    }

    // Invalidate availability cache
    availabilityCache.invalidate(`availability:${params.id}`)
    availabilityCache.invalidate(`products:orderable:`)

    return NextResponse.json({
      ...products[index],
      ...(syncError ? { syncWarning: syncError } : {}),
    })
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
