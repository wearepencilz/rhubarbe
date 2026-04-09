import { NextRequest, NextResponse } from 'next/server';
import * as productQueries from '@/lib/db/queries/products';
import { availabilityCache } from '@/lib/cache/availability-cache';
import { updateProduct as syncToShopify } from '@/lib/shopify/admin';

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

    // Validate servesPerUnit if provided: must be a non-negative integer
    if (body.servesPerUnit !== undefined && body.servesPerUnit !== null) {
      if (!Number.isInteger(body.servesPerUnit) || body.servesPerUnit < 0) {
        return NextResponse.json(
          { error: 'servesPerUnit must be a non-negative integer' },
          { status: 400 },
        );
      }
    }

    // Parse nextAvailableDate: accept ISO string, convert to Date, or null
    if (body.nextAvailableDate !== undefined && body.nextAvailableDate !== null) {
      const parsed = new Date(body.nextAvailableDate);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          { error: 'nextAvailableDate must be a valid date string' },
          { status: 400 },
        );
      }
      body.nextAvailableDate = parsed;
    }

    // Extract ingredients from body before updating the product row
    const { ingredients: bodyIngredients, ...productFields } = body;

    // Remove fields that shouldn't be set directly
    delete productFields.id;
    delete productFields.createdAt;

    // Strip fields that don't exist in the products table to prevent Drizzle errors
    const allowedFields = new Set([
      'name', 'slug', 'shopifyProductId', 'shopifyProductHandle',
      'legacyId', 'title', 'description', 'category', 'price', 'currency',
      'image', 'serves', 'shortCardCopy', 'tastingNotes', 'status',
      'allergens', 'tags', 'keyNotes', 'variants', 'translations',
      'inventoryTracked', 'availabilityMode', 'dateSelectionType',
      'slotSelectionType', 'variantType',
      'syncStatus', 'lastSyncedAt', 'syncError',
      'defaultMinQuantity', 'defaultQuantityStep', 'defaultMaxQuantity',
      'defaultPickupRequired', 'onlineOrderable', 'pickupOnly',
      'volumeEnabled', 'volumeDescription', 'volumeInstructions', 'volumeMinOrderQuantity',
      'cakeEnabled', 'cakeDescription', 'cakeInstructions', 'cakeMinPeople', 'cakeMaxPeople',
      'nextAvailableDate', 'servesPerUnit', 'cakeFlavourNotes', 'cakeDeliveryAvailable',
      'taxBehavior', 'taxThreshold', 'taxUnitCount', 'shopifyTaxExemptVariantId',
    ]);

    const cleanFields: Record<string, any> = {};
    for (const [key, val] of Object.entries(productFields)) {
      if (allowedFields.has(key)) {
        cleanFields[key] = val;
      }
    }

    const saved = await productQueries.update(params.id, cleanFields);

    if (!saved) {
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
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

      // Recompute allergens from linked ingredients
      const updatedProduct = await productQueries.getById(params.id);
      if (updatedProduct?.ingredients) {
        const allergenSet = new Set<string>();
        for (const li of updatedProduct.ingredients) {
          const ingAllergens = (li as any).ingredient?.allergens || [];
          for (const a of ingAllergens) allergenSet.add(a);
        }
        await productQueries.update(params.id, {
          allergens: Array.from(allergenSet),
        });
      }
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
