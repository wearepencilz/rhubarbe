import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getProduct } from '@/lib/shopify/admin';
import * as cakeProductQueries from '@/lib/db/queries/cake-products';

/**
 * POST /api/cake-products/[id]/sync-from-shopify
 *
 * Auto-configures cake product settings from Shopify variant data:
 * - Detects product type from option names (Guests/Choux/People/Format)
 * - Builds flavour config from Option2 values
 * - Builds pricing grid from variant prices
 * - Sets a default 7-day lead time tier
 *
 * Requires the product to have a linked shopifyProductId.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const product = await cakeProductQueries.getCakeProductById(params.id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    if (!product.shopifyProductId) {
      return NextResponse.json({ error: 'Product is not linked to Shopify' }, { status: 400 });
    }

    // Fetch full product data from Shopify Admin API
    const shopifyProduct = await getProduct(product.shopifyProductId);
    if (!shopifyProduct) {
      return NextResponse.json({ error: 'Shopify product not found' }, { status: 404 });
    }

    const options = shopifyProduct.options ?? [];
    const variants = (shopifyProduct.variants?.edges ?? []).map((e: any) => e.node);

    if (variants.length === 0) {
      return NextResponse.json({ error: 'No variants found on Shopify product' }, { status: 400 });
    }

    // Detect product type from option names
    const option1Name = options[0]?.name?.toLowerCase() ?? '';
    const option2Name = options[1]?.name?.toLowerCase() ?? '';
    const handle = shopifyProduct.handle ?? '';

    let cakeProductType: string | null = null;
    let cakeMaxFlavours: number | null = null;

    if (handle.includes('tasting')) {
      cakeProductType = 'wedding-cake-tasting';
      cakeMaxFlavours = 3;
    } else if (option1Name.includes('choux')) {
      cakeProductType = 'croquembouche';
      cakeMaxFlavours = 2;
    } else if (handle.includes('wedding') || handle.includes('mariage')) {
      cakeProductType = 'wedding-cake-tiered';
    } else if (handle.includes('xxl') || handle.includes('large') || handle.includes('format')) {
      cakeProductType = 'cake-xxl';
    } else if (option1Name.includes('guest') || option1Name.includes('people') || option1Name.includes('pers')) {
      // Generic two-axis cake
      cakeProductType = 'cake-xxl';
    }

    // Extract Option1 values (size axis) and Option2 values (flavour axis)
    // Special case: tasting products have flavour as Option1 with no size axis
    const isTastingProduct = cakeProductType === 'wedding-cake-tasting';
    const option1Values: string[] = options[0]?.values ?? [];
    const option2Values: string[] = options[1]?.values ?? [];
    const hasOption2 = option2Values.length > 0;

    // For tasting: Option1 is flavour, no size axis
    // For everything else: Option1 is size, Option2 is flavour
    const flavourValues = isTastingProduct ? option1Values : option2Values;
    const hasFlavours = flavourValues.length > 0;

    // Build flavour config
    const flavourConfig = hasFlavours
      ? flavourValues.map((value: string, idx: number) => ({
          handle: slugify(value),
          label: { en: value, fr: value },
          description: null as { en: string; fr: string } | null,
          pricingTierGroup: null as string | null,
          sortOrder: idx,
          active: true,
        }))
      : [];

    // Build pricing grid from variants
    const pricingGrid: Array<{
      sizeValue: string;
      flavourHandle: string;
      priceInCents: number;
      shopifyVariantId: string | null;
    }> = [];

    for (const variant of variants) {
      const selectedOptions = variant.selectedOptions ?? [];
      const opt1 = selectedOptions[0]?.value ?? '';
      const opt2 = selectedOptions[1]?.value ?? '';
      const priceAmount = variant.price ?? '0';
      const priceInCents = Math.round(parseFloat(priceAmount) * 100);

      if (isTastingProduct) {
        // Tasting: Option1 is flavour, use "1" as a fixed size
        pricingGrid.push({
          sizeValue: '1',
          flavourHandle: slugify(opt1),
          priceInCents,
          shopifyVariantId: variant.id ?? null,
        });
      } else {
        // Standard: Option1 is size, Option2 is flavour
        const sizeValue = extractNumeric(opt1) || opt1;
        const flavourHandle = hasOption2 ? slugify(opt2) : 'default';
        pricingGrid.push({
          sizeValue,
          flavourHandle,
          priceInCents,
          shopifyVariantId: variant.id ?? null,
        });
      }
    }

    // Auto-detect pricing tier groups (flavours with same price at each size)
    if (flavourConfig.length > 0 && pricingGrid.length > 0) {
      const sizes = [...new Set(pricingGrid.map((r) => r.sizeValue))];
      // For each flavour, build a price signature across all sizes
      const priceSignatures = new Map<string, string>();
      for (const flavour of flavourConfig) {
        const sig = sizes
          .map((s) => {
            const row = pricingGrid.find((r) => r.sizeValue === s && r.flavourHandle === flavour.handle);
            return row?.priceInCents ?? 0;
          })
          .join(',');
        priceSignatures.set(flavour.handle, sig);
      }
      // Group flavours with identical price signatures
      const sigToGroup = new Map<string, string>();
      let groupIdx = 0;
      for (const [handle, sig] of priceSignatures) {
        if (!sigToGroup.has(sig)) {
          sigToGroup.set(sig, `tier-${++groupIdx}`);
        }
        const flavour = flavourConfig.find((f) => f.handle === handle);
        if (flavour) {
          flavour.pricingTierGroup = sigToGroup.get(sig)!;
        }
      }
      // If all flavours are in the same group, clear the group (no grouping needed)
      const uniqueGroups = new Set(flavourConfig.map((f) => f.pricingTierGroup));
      if (uniqueGroups.size === 1) {
        for (const f of flavourConfig) f.pricingTierGroup = null;
      }
    }

    // Set default lead time tier (7 days) if none exist
    const existingTiers = await cakeProductQueries.getCakeLeadTimeTiers(params.id);
    if (existingTiers.length === 0) {
      const minSize = pricingGrid.length > 0
        ? Math.min(...[...new Set(pricingGrid.map((r) => parseInt(r.sizeValue) || 1))])
        : 1;
      await cakeProductQueries.setCakeLeadTimeTiers(params.id, [
        { minPeople: minSize, leadTimeDays: 7 },
      ]);
    }

    // Update product config
    await cakeProductQueries.updateCakeConfig(params.id, {
      cakeEnabled: true,
      cakeProductType,
      cakeFlavourConfig: flavourConfig.length > 0 ? flavourConfig : null,
      cakeMaxFlavours,
    });

    // Save pricing grid
    if (pricingGrid.length > 0) {
      await cakeProductQueries.setCakePricingGrid(params.id, pricingGrid);
    }

    // Return the updated product
    const updated = await cakeProductQueries.getCakeProductById(params.id);
    return NextResponse.json({
      product: updated,
      summary: {
        productType: cakeProductType,
        flavoursDetected: flavourConfig.length,
        sizesDetected: [...new Set(pricingGrid.map((r) => r.sizeValue))].length,
        gridCells: pricingGrid.length,
        pricingTierGroups: [...new Set(flavourConfig.map((f) => f.pricingTierGroup).filter(Boolean))].length,
      },
    });
  } catch (error: any) {
    console.error('Error syncing from Shopify:', error);
    return NextResponse.json(
      { error: 'Failed to sync from Shopify', details: error?.message },
      { status: 500 },
    );
  }
}

/** Convert a string to a URL-safe handle */
function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Extract the first numeric value from a string (e.g., "30 guests" → "30") */
function extractNumeric(str: string): string {
  const match = str.match(/\d+/);
  return match ? match[0] : '';
}
