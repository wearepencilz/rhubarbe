import { NextRequest, NextResponse } from 'next/server';
import * as productQueries from '@/lib/db/queries/products';
import { availabilityCache } from '@/lib/cache/availability-cache';
import { updateProduct as syncToShopify } from '@/lib/shopify/admin';
import { createTaxExemptVariant } from '@/lib/tax/create-exempt-variant';
import { syncExemptVariantPrice } from '@/lib/tax/sync-exempt-variant-price';

// GET /api/products/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await productQueries.getById(params.id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

// PUT /api/products/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Check product exists
    const existing = await productQueries.getById(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Validate availability_mode if provided
    if (body.availabilityMode !== undefined) {
      const validModes = ['always_available', 'scheduled', 'pattern_based', 'hidden'];
      if (!validModes.includes(body.availabilityMode)) {
        return NextResponse.json(
          { error: `Invalid availability_mode. Must be one of: ${validModes.join(', ')}` },
          { status: 400 },
        );
      }
    }

    // Validate taxBehavior if provided
    if (body.taxBehavior !== undefined) {
      const validBehaviors = ['always_taxable', 'always_exempt', 'quantity_threshold'];
      if (!validBehaviors.includes(body.taxBehavior)) {
        return NextResponse.json(
          { error: `Invalid taxBehavior. Must be one of: ${validBehaviors.join(', ')}` },
          { status: 400 },
        );
      }
    }

    // Validate quantity rules if provided
    if (body.defaultMinQuantity !== undefined && body.defaultMinQuantity < 1) {
      return NextResponse.json({ error: 'default_min_quantity must be at least 1' }, { status: 400 });
    }
    if (body.defaultQuantityStep !== undefined && body.defaultQuantityStep < 1) {
      return NextResponse.json({ error: 'default_quantity_step must be at least 1' }, { status: 400 });
    }

    // Extract ingredients from body before updating the product row
    const { ingredients: bodyIngredients, ...productFields } = body;

    // Remove fields that shouldn't be set directly
    delete productFields.id;
    delete productFields.createdAt;

    const saved = await productQueries.update(params.id, productFields);

    if (!saved) {
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }

    // Create tax-exempt variant in Shopify if needed
    if (
      saved.taxBehavior === 'quantity_threshold' &&
      saved.shopifyProductId &&
      !saved.shopifyTaxExemptVariantId
    ) {
      try {
        const currentPrice = saved.price ? (saved.price / 100).toFixed(2) : '0.00';
        const result = await createTaxExemptVariant(saved.shopifyProductId, currentPrice);
        // Store the Storefront GID for checkout use
        await productQueries.update(params.id, {
          shopifyTaxExemptVariantId: result.storefrontVariantId,
        });
      } catch (err: any) {
        console.error('[Tax] Failed to create exempt variant:', err.message);
        // Don't fail the save — just log the error
        // The admin will see "Not linked" in the UI and can retry
      }
    }

    // Update product_ingredients if provided
    if (bodyIngredients && Array.isArray(bodyIngredients)) {
      await productQueries.setProductIngredients(
        params.id,
        bodyIngredients.map((ing: any, idx: number) => ({
          ingredientId: ing.ingredientId || ing.id,
          displayOrder: ing.displayOrder ?? idx,
          quantity: ing.quantity ?? null,
          notes: ing.notes ?? null,
        })),
      );
    }

    // Sync to Shopify if product is linked
    let syncError = null;
    if (saved.shopifyProductId) {
      try {
        const descriptionHtml = [
          saved.title ? `<h2>${saved.title}</h2>` : '',
          saved.description ? `<p>${saved.description}</p>` : '',
        ]
          .filter(Boolean)
          .join('\n');

        await syncToShopify({
          shopifyProductId: saved.shopifyProductId,
          title: saved.title || saved.name || saved.slug,
          descriptionHtml,
          status: saved.status === 'active' ? 'ACTIVE' : 'DRAFT',
          tags: (saved.tags as string[]) || [],
          price: saved.price ? (saved.price / 100).toFixed(2) : undefined,
          ...(saved.variants &&
          Array.isArray(saved.variants) &&
          saved.variants.length > 0 &&
          saved.variants.some((v: any) => v.shopifyVariantId)
            ? {
                variants: saved.variants
                  .filter((v: any) => v.shopifyVariantId)
                  .map((v: any) => ({
                    id: v.shopifyVariantId,
                    price: ((v.price || saved.price) / 100).toFixed(2),
                  })),
              }
            : {}),
          metafields: [
            {
              namespace: 'translations',
              key: 'title_fr',
              value: (saved as any).translations?.fr?.title || saved.title || '',
              type: 'single_line_text_field',
            },
            {
              namespace: 'translations',
              key: 'description_fr',
              value: (saved as any).translations?.fr?.description || saved.description || '',
              type: 'multi_line_text_field',
            },
          ],
        });

        // Sync exempt variant price if it exists and price changed
        if (saved.shopifyTaxExemptVariantId && saved.price !== existing.price) {
          try {
            // We need the Admin GID, but we stored the Storefront GID.
            // The Admin GID can be derived by base64-decoding the Storefront GID.
            const adminVariantId = Buffer.from(saved.shopifyTaxExemptVariantId, 'base64').toString('utf-8');
            const newPrice = saved.price ? (saved.price / 100).toFixed(2) : '0.00';
            await syncExemptVariantPrice(saved.shopifyProductId, adminVariantId, newPrice);
          } catch (err: any) {
            console.error('[Tax] Failed to sync exempt variant price:', err.message);
            // Non-blocking — log warning but don't fail the save
          }
        }

        // Update sync status
        await productQueries.update(params.id, {
          syncStatus: 'synced',
          lastSyncedAt: new Date(),
          syncError: null,
        });
      } catch (err: any) {
        syncError = err.message || 'Shopify sync failed';
        console.error('Shopify sync error:', syncError);
        await productQueries.update(params.id, {
          syncStatus: 'error',
          syncError,
        });
      }
    }

    // Invalidate availability cache
    availabilityCache.invalidate(`availability:${params.id}`);
    availabilityCache.invalidate(`products:orderable:`);

    // Return the full product with ingredients
    const result = await productQueries.getById(params.id);
    return NextResponse.json({
      ...result,
      ...(syncError ? { syncWarning: syncError } : {}),
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// PATCH /api/products/[id] — partial update (same logic as PUT)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return PUT(request, { params });
}

// DELETE /api/products/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await productQueries.remove(params.id);

    if (!deleted) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Invalidate availability cache
    availabilityCache.invalidate(`availability:${params.id}`);
    availabilityCache.invalidate(`products:orderable:`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
