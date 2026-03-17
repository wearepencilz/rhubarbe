/**
 * Unit Tests for Taxonomy Validation Functions
 * 
 * Tests Phase 2: Validation Layer
 * - validateTaxonomyUniqueness
 * - validateTaxonomyDeletion
 * - checkTaxonomyValueInUse
 * 
 * Validates: Requirements 0.9, 0.10
 * 
 * PERFORMANCE: All tests should complete in < 3 seconds total
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { validateTaxonomyUniqueness, validateTaxonomyDeletion, checkTaxonomyValueInUse } from '@/lib/validation'
import { getSettings, saveSettings, getIngredients, saveIngredients, getFlavours, saveFlavours } from '@/lib/db'

describe('Taxonomy Validation Functions', () => {
  let originalSettings: any
  let originalIngredients: any[]
  let originalFlavours: any[]

  beforeEach(async () => {
    originalSettings = await getSettings()
    originalIngredients = await getIngredients()
    originalFlavours = await getFlavours()
  })

  afterEach(async () => {
    await saveSettings(originalSettings)
    await saveIngredients(originalIngredients)
    await saveFlavours(originalFlavours)
  })

  describe('validateTaxonomyUniqueness', () => {
    it('should return true for unique value', async () => {
      const isUnique = await validateTaxonomyUniqueness('ingredientCategories', 'unique-test-value')
      expect(isUnique).toBe(true)
    })

    it('should return false for duplicate value', async () => {
      const isUnique = await validateTaxonomyUniqueness('ingredientCategories', 'fruit')
      expect(isUnique).toBe(false)
    })

    it('should allow same value when excluding current ID', async () => {
      const isUnique = await validateTaxonomyUniqueness('ingredientCategories', 'fruit', 'fruit')
      expect(isUnique).toBe(true)
    })

    it('should return true for non-existent category', async () => {
      const isUnique = await validateTaxonomyUniqueness('nonExistentCategory', 'any-value')
      expect(isUnique).toBe(true)
    })

    it('should be case-sensitive', async () => {
      const isUnique = await validateTaxonomyUniqueness('ingredientCategories', 'Fruit')
      expect(isUnique).toBe(true) // 'Fruit' !== 'fruit'
    })
  })

  describe('validateTaxonomyDeletion', () => {
    it('should allow deletion of unused value', async () => {
      // Add a temporary value
      const settings = await getSettings()
      settings.taxonomies.ingredientCategories.push({
        id: 'temp-unused',
        label: 'Temp Unused',
        value: 'temp-unused',
        sortOrder: 999,
        archived: false
      })
      await saveSettings(settings)

      const result = await validateTaxonomyDeletion('ingredientCategories', 'temp-unused')
      expect(result.canDelete).toBe(true)
      expect(result.usedBy).toEqual([])
    })

    it('should prevent deletion of ingredient category in use', async () => {
      // Create test ingredient
      const testIngredient = {
        id: 'test-ing-del',
        name: 'Test Ingredient',
        category: 'fruit',
        roles: [],
        descriptors: [],
        allergens: [],
        dietaryFlags: [],
        seasonal: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const ingredients = await getIngredients()
      await saveIngredients([...ingredients, testIngredient])

      const result = await validateTaxonomyDeletion('ingredientCategories', 'fruit')
      expect(result.canDelete).toBe(false)
      expect(result.usedBy.length).toBeGreaterThan(0)
      expect(result.usedBy[0].type).toBe('ingredient')
    })

    it('should prevent deletion of flavour type in use', async () => {
      // Create test flavour
      const testFlavour = {
        id: 'test-flav-del',
        name: 'Test Flavour',
        slug: 'test-flavour',
        type: 'gelato',
        ingredients: [],
        keyNotes: [],
        allergens: [],
        dietaryTags: [],
        status: 'active',
        featured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const flavours = await getFlavours()
      await saveFlavours([...flavours, testFlavour])

      const result = await validateTaxonomyDeletion('flavourTypes', 'gelato')
      expect(result.canDelete).toBe(false)
      expect(result.usedBy.length).toBeGreaterThan(0)
      expect(result.usedBy[0].type).toBe('flavour')
    })

    it('should return usedBy array with correct structure', async () => {
      const testIngredient = {
        id: 'test-ing-struct',
        name: 'Test Ingredient Structure',
        category: 'dairy',
        roles: [],
        descriptors: [],
        allergens: [],
        dietaryFlags: [],
        seasonal: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const ingredients = await getIngredients()
      await saveIngredients([...ingredients, testIngredient])

      const result = await validateTaxonomyDeletion('ingredientCategories', 'dairy')
      
      if (result.usedBy.length > 0) {
        const usage = result.usedBy[0]
        expect(usage).toHaveProperty('type')
        expect(usage).toHaveProperty('id')
        expect(usage).toHaveProperty('name')
      }
    })

    it('should check allergens usage in arrays', async () => {
      const testIngredient = {
        id: 'test-ing-allergen',
        name: 'Test Allergen Ingredient',
        category: 'dairy',
        roles: [],
        descriptors: [],
        allergens: ['dairy', 'eggs'],
        dietaryFlags: [],
        seasonal: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const ingredients = await getIngredients()
      await saveIngredients([...ingredients, testIngredient])

      const result = await validateTaxonomyDeletion('allergens', 'dairy')
      expect(result.canDelete).toBe(false)
      expect(result.usedBy.some((u: any) => u.id === 'test-ing-allergen')).toBe(true)
    })

    it('should check dietary flags usage in arrays', async () => {
      const testIngredient = {
        id: 'test-ing-dietary',
        name: 'Test Dietary Ingredient',
        category: 'fruit',
        roles: [],
        descriptors: [],
        allergens: [],
        dietaryFlags: ['vegan', 'organic'],
        seasonal: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const ingredients = await getIngredients()
      await saveIngredients([...ingredients, testIngredient])

      const result = await validateTaxonomyDeletion('dietaryFlags', 'vegan')
      expect(result.canDelete).toBe(false)
      expect(result.usedBy.some((u: any) => u.id === 'test-ing-dietary')).toBe(true)
    })
  })

  describe('checkTaxonomyValueInUse', () => {
    it('should return false for unused value', async () => {
      const settings = await getSettings()
      settings.taxonomies.seasons.push({
        id: 'temp-season',
        label: 'Temp Season',
        value: 'temp-season',
        sortOrder: 999,
        archived: false
      })
      await saveSettings(settings)

      const inUse = await checkTaxonomyValueInUse('seasons', 'temp-season')
      expect(inUse).toBe(false)
    })

    it('should return true for value in use', async () => {
      const testIngredient = {
        id: 'test-ing-use',
        name: 'Test Use Ingredient',
        category: 'herb',
        roles: [],
        descriptors: [],
        allergens: [],
        dietaryFlags: [],
        seasonal: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const ingredients = await getIngredients()
      await saveIngredients([...ingredients, testIngredient])

      const inUse = await checkTaxonomyValueInUse('ingredientCategories', 'herb')
      expect(inUse).toBe(true)
    })
  })

  describe('Performance', () => {
    it('should validate uniqueness quickly', async () => {
      const start = Date.now()
      
      for (let i = 0; i < 10; i++) {
        await validateTaxonomyUniqueness('ingredientCategories', `test-${i}`)
      }
      
      const duration = Date.now() - start
      expect(duration).toBeLessThan(1000) // Should complete in < 1 second
    })

    it('should check deletion quickly', async () => {
      const start = Date.now()
      
      await validateTaxonomyDeletion('ingredientCategories', 'fruit')
      
      const duration = Date.now() - start
      expect(duration).toBeLessThan(500) // Should complete in < 0.5 seconds
    })
  })
})
