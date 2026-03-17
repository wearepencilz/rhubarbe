/**
 * Referential Integrity System
 * 
 * Maintains relationships between entities and prevents orphaned references.
 * Validates operations that could break relationships.
 */

import { 
  getFormats, 
  getProducts, 
  getFlavours, 
  getIngredients, 
  getModifiers, 
  getLaunches,
  getBatches,
  saveProducts,
  saveLaunches,
  saveBatches
} from './db';

export interface ReferenceCheck {
  canDelete: boolean;
  blockers: string[];
  warnings: string[];
  affectedEntities: {
    type: string;
    ids: string[];
    count: number;
  }[];
}

/**
 * Check if a format can be safely deleted
 */
export async function checkFormatDeletion(formatId: string): Promise<ReferenceCheck> {
  const products = await getProducts();
  const affectedProducts = products.filter((p: any) => p.formatId === formatId);

  return {
    canDelete: affectedProducts.length === 0,
    blockers: affectedProducts.length > 0 
      ? [`${affectedProducts.length} product(s) use this format`]
      : [],
    warnings: [],
    affectedEntities: [
      {
        type: 'products',
        ids: affectedProducts.map((p: any) => p.id),
        count: affectedProducts.length
      }
    ]
  };
}

/**
 * Check if a flavour can be safely deleted
 */
export async function checkFlavourDeletion(flavourId: string): Promise<ReferenceCheck> {
  const products = await getProducts();
  const launches = await getLaunches();
  const batches = await getBatches();

  const affectedProducts = products.filter((p: any) => 
    p.primaryFlavourIds?.includes(flavourId) || 
    p.secondaryFlavourIds?.includes(flavourId)
  );

  const affectedLaunches = launches.filter((l: any) => 
    l.featuredFlavourIds?.includes(flavourId)
  );

  const affectedBatches = batches.filter((b: any) => 
    b.flavourId === flavourId
  );

  const totalAffected = affectedProducts.length + affectedLaunches.length + affectedBatches.length;

  return {
    canDelete: totalAffected === 0,
    blockers: totalAffected > 0 
      ? [
          affectedProducts.length > 0 && `${affectedProducts.length} product(s) use this flavour`,
          affectedLaunches.length > 0 && `${affectedLaunches.length} launch(es) feature this flavour`,
          affectedBatches.length > 0 && `${affectedBatches.length} batch(es) reference this flavour`
        ].filter(Boolean) as string[]
      : [],
    warnings: [],
    affectedEntities: [
      {
        type: 'products',
        ids: affectedProducts.map((p: any) => p.id),
        count: affectedProducts.length
      },
      {
        type: 'launches',
        ids: affectedLaunches.map((l: any) => l.id),
        count: affectedLaunches.length
      },
      {
        type: 'batches',
        ids: affectedBatches.map((b: any) => b.id),
        count: affectedBatches.length
      }
    ].filter(e => e.count > 0)
  };
}

/**
 * Check if an ingredient can be safely deleted
 */
export async function checkIngredientDeletion(ingredientId: string): Promise<ReferenceCheck> {
  const flavours = await getFlavours();
  const affectedFlavours = flavours.filter((f: any) => 
    f.ingredientIds?.includes(ingredientId)
  );

  return {
    canDelete: affectedFlavours.length === 0,
    blockers: affectedFlavours.length > 0 
      ? [`${affectedFlavours.length} flavour(s) use this ingredient`]
      : [],
    warnings: [],
    affectedEntities: [
      {
        type: 'flavours',
        ids: affectedFlavours.map((f: any) => f.id),
        count: affectedFlavours.length
      }
    ]
  };
}

/**
 * Check if a modifier can be safely deleted
 */
export async function checkModifierDeletion(modifierId: string): Promise<ReferenceCheck> {
  const products = await getProducts();
  const affectedProducts = products.filter((p: any) => 
    p.toppingIds?.includes(modifierId) ||
    p.componentIds?.includes(modifierId)
  );

  return {
    canDelete: affectedProducts.length === 0,
    blockers: affectedProducts.length > 0 
      ? [`${affectedProducts.length} product(s) use this modifier`]
      : [],
    warnings: [],
    affectedEntities: [
      {
        type: 'products',
        ids: affectedProducts.map((p: any) => p.id),
        count: affectedProducts.length
      }
    ]
  };
}

/**
 * Check if a product can be safely deleted
 */
export async function checkProductDeletion(productId: string): Promise<ReferenceCheck> {
  const launches = await getLaunches();
  const affectedLaunches = launches.filter((l: any) => 
    l.featuredProductIds?.includes(productId)
  );

  return {
    canDelete: true, // Products can always be deleted, but we warn about launches
    blockers: [],
    warnings: affectedLaunches.length > 0 
      ? [`${affectedLaunches.length} launch(es) feature this product - they will be updated`]
      : [],
    affectedEntities: [
      {
        type: 'launches',
        ids: affectedLaunches.map((l: any) => l.id),
        count: affectedLaunches.length
      }
    ]
  };
}

/**
 * Clean up orphaned references after a deletion
 */
export async function cleanupOrphanedReferences(entityType: string, deletedId: string) {
  switch (entityType) {
    case 'format':
      // Products should have been blocked from deletion if format is in use
      break;

    case 'flavour':
      // Remove from products
      const products = await getProducts();
      const updatedProducts = products.map((p: any) => ({
        ...p,
        primaryFlavourIds: p.primaryFlavourIds?.filter((id: string) => id !== deletedId) || [],
        secondaryFlavourIds: p.secondaryFlavourIds?.filter((id: string) => id !== deletedId) || []
      }));
      await saveProducts(updatedProducts);

      // Remove from launches
      const launches = await getLaunches();
      const updatedLaunches = launches.map((l: any) => ({
        ...l,
        featuredFlavourIds: l.featuredFlavourIds?.filter((id: string) => id !== deletedId) || []
      }));
      await saveLaunches(updatedLaunches);
      break;

    case 'product':
      // Remove from launches
      const launchesForProduct = await getLaunches();
      const updatedLaunchesForProduct = launchesForProduct.map((l: any) => ({
        ...l,
        featuredProductIds: l.featuredProductIds?.filter((id: string) => id !== deletedId) || []
      }));
      await saveLaunches(updatedLaunchesForProduct);
      break;

    case 'modifier':
      // Remove from products
      const productsForModifier = await getProducts();
      const updatedProductsForModifier = productsForModifier.map((p: any) => ({
        ...p,
        toppingIds: p.toppingIds?.filter((id: string) => id !== deletedId) || [],
        componentIds: p.componentIds?.filter((id: string) => id !== deletedId) || []
      }));
      await saveProducts(updatedProductsForModifier);
      break;
  }
}

/**
 * Validate all referential integrity in the system
 */
export async function validateAllReferences(): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const [formats, products, flavours, ingredients, modifiers, launches] = await Promise.all([
      getFormats(),
      getProducts(),
      getFlavours(),
      getIngredients(),
      getModifiers(),
      getLaunches()
    ]);

    const formatIds = new Set(formats.map((f: any) => f.id));
    const flavourIds = new Set(flavours.map((f: any) => f.id));
    const ingredientIds = new Set(ingredients.map((i: any) => i.id));
    const modifierIds = new Set(modifiers.map((m: any) => m.id));
    const productIds = new Set(products.map((p: any) => p.id));

    // Check products
    products.forEach((product: any) => {
      if (product.formatId && !formatIds.has(product.formatId)) {
        errors.push(`Product ${product.id} references missing format ${product.formatId}`);
      }

      product.primaryFlavourIds?.forEach((id: string) => {
        if (!flavourIds.has(id)) {
          errors.push(`Product ${product.id} references missing flavour ${id}`);
        }
      });

      product.secondaryFlavourIds?.forEach((id: string) => {
        if (!flavourIds.has(id)) {
          warnings.push(`Product ${product.id} references missing secondary flavour ${id}`);
        }
      });

      product.toppingIds?.forEach((id: string) => {
        if (!modifierIds.has(id)) {
          warnings.push(`Product ${product.id} references missing modifier ${id}`);
        }
      });
    });

    // Check flavours
    flavours.forEach((flavour: any) => {
      flavour.ingredientIds?.forEach((id: string) => {
        if (!ingredientIds.has(id)) {
          warnings.push(`Flavour ${flavour.id} references missing ingredient ${id}`);
        }
      });
    });

    // Check launches
    launches.forEach((launch: any) => {
      launch.featuredFlavourIds?.forEach((id: string) => {
        if (!flavourIds.has(id)) {
          warnings.push(`Launch ${launch.id} references missing flavour ${id}`);
        }
      });

      launch.featuredProductIds?.forEach((id: string) => {
        if (!productIds.has(id)) {
          warnings.push(`Launch ${launch.id} references missing product ${id}`);
        }
      });
    });

  } catch (error) {
    errors.push(`Failed to validate references: ${error}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
