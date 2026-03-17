/**
 * API Middleware for Data Protection and Referential Integrity
 * 
 * Wraps API operations with automatic backups and validation
 */

import { NextResponse } from 'next/server';
import { createBackup } from './data-protection';
import {
  checkFormatDeletion,
  checkFlavourDeletion,
  checkIngredientDeletion,
  checkModifierDeletion,
  checkProductDeletion,
  cleanupOrphanedReferences,
  type ReferenceCheck
} from './referential-integrity';

/**
 * Wrap a DELETE operation with referential integrity checks and backups
 */
export async function withDeleteProtection(
  entityType: 'format' | 'flavour' | 'ingredient' | 'modifier' | 'product' | 'launch',
  entityId: string,
  deleteOperation: () => Promise<any>
): Promise<NextResponse> {
  try {
    // Check referential integrity
    let check: ReferenceCheck;
    
    switch (entityType) {
      case 'format':
        check = await checkFormatDeletion(entityId);
        break;
      case 'flavour':
        check = await checkFlavourDeletion(entityId);
        break;
      case 'ingredient':
        check = await checkIngredientDeletion(entityId);
        break;
      case 'modifier':
        check = await checkModifierDeletion(entityId);
        break;
      case 'product':
        check = await checkProductDeletion(entityId);
        break;
      default:
        check = { canDelete: true, blockers: [], warnings: [], affectedEntities: [] };
    }

    // Block deletion if there are blockers
    if (!check.canDelete) {
      return NextResponse.json(
        {
          error: 'Cannot delete: entity is in use',
          blockers: check.blockers,
          affectedEntities: check.affectedEntities
        },
        { status: 409 } // Conflict
      );
    }

    // Create backup before deletion
    const dataFile = getDataFileForEntity(entityType);
    createBackup(dataFile);

    // Perform deletion
    const result = await deleteOperation();

    // Clean up orphaned references
    await cleanupOrphanedReferences(entityType, entityId);

    // Return success with warnings if any
    return NextResponse.json({
      success: true,
      warnings: check.warnings,
      affectedEntities: check.affectedEntities
    });

  } catch (error) {
    console.error(`Error in delete protection for ${entityType}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete entity' },
      { status: 500 }
    );
  }
}

/**
 * Wrap an UPDATE operation with automatic backups
 */
export async function withUpdateProtection(
  entityType: string,
  updateOperation: () => Promise<any>
): Promise<any> {
  // Create backup before update
  const dataFile = getDataFileForEntity(entityType);
  createBackup(dataFile);

  // Perform update
  return await updateOperation();
}

/**
 * Get the data filename for an entity type
 */
function getDataFileForEntity(entityType: string): string {
  const mapping: Record<string, string> = {
    format: 'formats.json',
    flavour: 'flavours.json',
    ingredient: 'ingredients.json',
    modifier: 'modifiers.json',
    product: 'products.json',
    launch: 'launches.json',
    batch: 'batches.json',
    story: 'stories.json',
  };

  return mapping[entityType] || `${entityType}s.json`;
}

/**
 * Validate request has required fields
 */
export function validateRequired(data: any, fields: string[]): string[] {
  const missing: string[] = [];
  
  fields.forEach(field => {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missing.push(field);
    }
  });

  return missing;
}

/**
 * Format validation error response
 */
export function validationError(message: string, details?: any): NextResponse {
  return NextResponse.json(
    {
      error: message,
      details
    },
    { status: 400 }
  );
}
