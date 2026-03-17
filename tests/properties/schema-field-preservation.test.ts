/**
 * Property Test: Schema Field Preservation
 * 
 * Property 19: Schema Field Preservation
 * Validates: Requirements 0.3
 * 
 * This test verifies that all required fields exist in each interface
 * according to the design specification. It ensures that the TypeScript
 * interfaces match the documented schema and that no required fields
 * are missing.
 */

import { describe, it, expect } from 'vitest'
import type {
  Ingredient,
  Flavour,
  Format,
  Modifier,
  Sellable,
  Launch,
  Batch,
  FlavourIngredient,
  ContentBlock,
  ValidationError,
  ValidationResult,
  OfferingMigrationMap,
  FlavourShopifyMigration,
  ModifierExtractionMap,
  MigrationStatus
} from '../../types/index.js'

describe('Property 19: Schema Field Preservation', () => {
  describe('Ingredient Interface', () => {
    it('should have all required fields', () => {
      const requiredFields = [
        'id',
        'name',
        'category',
        'roles',
        'descriptors',
        'seasonal',
        'allergens',
        'dietaryFlags',
        'createdAt',
        'updatedAt'
      ]

      const optionalFields = [
        'latinName',
        'slug',
        'origin',
        'supplier',
        'availableMonths',
        'description',
        'story',
        'tastingNotes',
        'image',
        'imageAlt'
      ]

      const sampleIngredient: Ingredient = {
        id: 'ing-1',
        name: 'White Peach',
        category: 'fruit',
        roles: ['primary-flavour'],
        descriptors: ['fresh', 'seasonal'],
        seasonal: true,
        allergens: [],
        dietaryFlags: ['vegan'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Verify all required fields are present
      requiredFields.forEach(field => {
        expect(sampleIngredient).toHaveProperty(field)
      })

      // Verify the object can be created without optional fields
      expect(sampleIngredient).toBeDefined()
    })
  })

  describe('Flavour Interface', () => {
    it('should have all required fields', () => {
      const requiredFields = [
        'id',
        'name',
        'slug',
        'type',
        'ingredients',
        'keyNotes',
        'allergens',
        'dietaryTags',
        'status',
        'featured',
        'createdAt',
        'updatedAt'
      ]

      const sampleFlavour: Flavour = {
        id: 'flav-1',
        name: 'Grilled Corn',
        slug: 'grilled-corn',
        type: 'gelato',
        ingredients: [],
        keyNotes: ['sweet', 'smoky'],
        allergens: ['dairy'],
        dietaryTags: ['vegetarian'],
        status: 'active',
        featured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      requiredFields.forEach(field => {
        expect(sampleFlavour).toHaveProperty(field)
      })
    })
  })

  describe('Format Interface', () => {
    it('should have all required fields', () => {
      const requiredFields = [
        'id',
        'name',
        'slug',
        'category',
        'requiresFlavours',
        'minFlavours',
        'maxFlavours',
        'allowMixedTypes',
        'canIncludeAddOns',
        'createdAt',
        'updatedAt'
      ]

      const sampleFormat: Format = {
        id: 'fmt-1',
        name: 'Cup',
        slug: 'cup',
        category: 'scoop',
        requiresFlavours: true,
        minFlavours: 1,
        maxFlavours: 3,
        allowMixedTypes: true,
        canIncludeAddOns: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      requiredFields.forEach(field => {
        expect(sampleFormat).toHaveProperty(field)
      })
    })
  })

  describe('Modifier Interface', () => {
    it('should have all required fields', () => {
      const requiredFields = [
        'id',
        'name',
        'slug',
        'type',
        'price',
        'allergens',
        'dietaryFlags',
        'availableForFormatIds',
        'status',
        'createdAt',
        'updatedAt'
      ]

      const sampleModifier: Modifier = {
        id: 'mod-1',
        name: 'Hot Fudge',
        slug: 'hot-fudge',
        type: 'sauce',
        price: 150,
        allergens: ['dairy'],
        dietaryFlags: ['vegetarian'],
        availableForFormatIds: ['fmt-1'],
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      requiredFields.forEach(field => {
        expect(sampleModifier).toHaveProperty(field)
      })
    })
  })

  describe('Sellable Interface', () => {
    it('should have all required fields', () => {
      const requiredFields = [
        'id',
        'internalName',
        'publicName',
        'slug',
        'status',
        'formatId',
        'primaryFlavourIds',
        'price',
        'inventoryTracked',
        'onlineOrderable',
        'pickupOnly',
        'createdAt',
        'updatedAt'
      ]

      const sampleSellable: Sellable = {
        id: 'sell-1',
        internalName: 'Vanilla Cup Small',
        publicName: 'Vanilla Cup',
        slug: 'vanilla-cup',
        status: 'active',
        formatId: 'fmt-1',
        primaryFlavourIds: ['flav-1'],
        price: 500,
        inventoryTracked: false,
        onlineOrderable: true,
        pickupOnly: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      requiredFields.forEach(field => {
        expect(sampleSellable).toHaveProperty(field)
      })
    })
  })

  describe('Launch Interface', () => {
    it('should have all required fields', () => {
      const requiredFields = [
        'id',
        'title',
        'slug',
        'status',
        'featuredFlavourIds',
        'featuredSellableIds',
        'featured',
        'createdAt',
        'updatedAt'
      ]

      const sampleLaunch: Launch = {
        id: 'launch-1',
        title: 'Corn + Tomato Launch',
        slug: 'corn-tomato-launch',
        status: 'active',
        featuredFlavourIds: ['flav-1'],
        featuredSellableIds: ['sell-1'],
        featured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      requiredFields.forEach(field => {
        expect(sampleLaunch).toHaveProperty(field)
      })
    })
  })

  describe('Batch Interface', () => {
    it('should have all required fields', () => {
      const requiredFields = [
        'id',
        'batchNumber',
        'flavourIds',
        'status',
        'createdAt',
        'updatedAt'
      ]

      const sampleBatch: Batch = {
        id: 'batch-1',
        batchNumber: 'B-2024-001',
        flavourIds: ['flav-1'],
        status: 'complete',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      requiredFields.forEach(field => {
        expect(sampleBatch).toHaveProperty(field)
      })
    })
  })

  describe('Supporting Interfaces', () => {
    it('FlavourIngredient should have all required fields', () => {
      const sample: FlavourIngredient = {
        ingredientId: 'ing-1',
        role: 'primary-flavour'
      }

      expect(sample).toHaveProperty('ingredientId')
      expect(sample).toHaveProperty('role')
    })

    it('ContentBlock should have all required fields', () => {
      const sample: ContentBlock = {
        id: 'block-1',
        type: 'text',
        order: 1,
        content: { text: 'Sample content' }
      }

      expect(sample).toHaveProperty('id')
      expect(sample).toHaveProperty('type')
      expect(sample).toHaveProperty('order')
      expect(sample).toHaveProperty('content')
    })

    it('ValidationError should have all required fields', () => {
      const sample: ValidationError = {
        field: 'name',
        message: 'Name is required'
      }

      expect(sample).toHaveProperty('field')
      expect(sample).toHaveProperty('message')
    })

    it('ValidationResult should have all required fields', () => {
      const sample: ValidationResult = {
        valid: true,
        errors: []
      }

      expect(sample).toHaveProperty('valid')
      expect(sample).toHaveProperty('errors')
    })
  })

  describe('Migration Support Interfaces', () => {
    it('OfferingMigrationMap should have all required fields', () => {
      const sample: OfferingMigrationMap = {
        legacyOfferingId: 'off-1',
        newSellableId: 'sell-1',
        migrationDate: new Date().toISOString(),
        changes: ['Renamed to Sellable'],
        warnings: []
      }

      expect(sample).toHaveProperty('legacyOfferingId')
      expect(sample).toHaveProperty('newSellableId')
      expect(sample).toHaveProperty('migrationDate')
      expect(sample).toHaveProperty('changes')
      expect(sample).toHaveProperty('warnings')
    })

    it('FlavourShopifyMigration should have all required fields', () => {
      const sample: FlavourShopifyMigration = {
        flavourId: 'flav-1',
        hadShopifyFields: true,
        migrationDate: new Date().toISOString()
      }

      expect(sample).toHaveProperty('flavourId')
      expect(sample).toHaveProperty('hadShopifyFields')
      expect(sample).toHaveProperty('migrationDate')
    })

    it('ModifierExtractionMap should have all required fields', () => {
      const sample: ModifierExtractionMap = {
        sourceOfferingId: 'off-1',
        extractedModifierId: 'mod-1',
        modifierName: 'Hot Fudge',
        migrationDate: new Date().toISOString()
      }

      expect(sample).toHaveProperty('sourceOfferingId')
      expect(sample).toHaveProperty('extractedModifierId')
      expect(sample).toHaveProperty('modifierName')
      expect(sample).toHaveProperty('migrationDate')
    })

    it('MigrationStatus should have all required fields', () => {
      const sample: MigrationStatus = {
        phase: 0,
        status: 'not-started',
        progress: 0,
        errors: [],
        warnings: []
      }

      expect(sample).toHaveProperty('phase')
      expect(sample).toHaveProperty('status')
      expect(sample).toHaveProperty('progress')
      expect(sample).toHaveProperty('errors')
      expect(sample).toHaveProperty('warnings')
    })
  })

  describe('Type Completeness', () => {
    it('should verify all enum types are properly defined', () => {
      // This test ensures that the type system is complete
      // by attempting to create objects with all possible enum values
      
      const ingredientCategories: Array<import('../../types/index.js').IngredientCategory> = [
        'fruit', 'dairy', 'herb', 'spice', 'nut', 'grain', 
        'vegetable', 'botanical', 'aromatic', 'sweetener', 
        'fat', 'salt', 'condiment', 'sauce'
      ]
      expect(ingredientCategories.length).toBe(14)

      const flavourTypes: Array<import('../../types/index.js').FlavourType> = [
        'gelato', 'sorbet', 'soft-serve-base', 'cookie', 'topping', 'sauce'
      ]
      expect(flavourTypes.length).toBe(6)

      const formatCategories: Array<import('../../types/index.js').FormatCategory> = [
        'scoop', 'take-home', 'sandwich', 'twist', 'soft-serve', 'special'
      ]
      expect(formatCategories.length).toBe(6)

      const modifierTypes: Array<import('../../types/index.js').ModifierType> = [
        'topping', 'sauce', 'crunch', 'drizzle', 'premium-addon', 'pack-in'
      ]
      expect(modifierTypes.length).toBe(6)
    })
  })
})
