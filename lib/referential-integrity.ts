/**
 * Referential Integrity System
 * 
 * Maintains relationships between entities and prevents orphaned references.
 * Validates operations that could break relationships.
 */

import { 
  getProducts, 
  getFlavours, 
  getIngredients, 
  saveProducts,
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
 * Check if a flavour can be safely deleted
 */
export async function checkFlavourDeletion(flavourId: string): Promise<ReferenceCheck> {
  const products = await getProducts();

  const affectedProducts = products.filter((p: any) => 
    p.primaryFlavourIds?.includes(flavourId) || 
    p.secondaryFlavourIds?.includes(flavourId)
  );

  return {
    canDelete: affectedProducts.length === 0,
    blockers: affectedProducts.length > 0 
      ? [`${affectedProducts.length} product(s) use this flavour`]
      : [],
    warnings: [],
    affectedEntities: [
      {
        type: 'products',
        ids: affectedProducts.map((p: any) => p.id),
        count: affectedProducts.length
      },
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
 * Check if a product can be safely deleted
 */
export async function checkProductDeletion(productId: string): Promise<ReferenceCheck> {
  return {
    canDelete: true,
    blockers: [],
    warnings: [],
    affectedEntities: []
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
      break;

    case 'product':
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
    const [products, flavours, ingredients] = await Promise.all([
      getProducts(),
      getFlavours(),
      getIngredients(),
    ]);

    const flavourIds = new Set(flavours.map((f: any) => f.id));
    const ingredientIds = new Set(ingredients.map((i: any) => i.id));
    const productIds = new Set(products.map((p: any) => p.id));

    // Check products
    products.forEach((product: any) => {
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
    });

    // Check flavours
    flavours.forEach((flavour: any) => {
      flavour.ingredientIds?.forEach((id: string) => {
        if (!ingredientIds.has(id)) {
          warnings.push(`Flavour ${flavour.id} references missing ingredient ${id}`);
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
