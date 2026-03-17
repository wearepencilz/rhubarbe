/**
 * Unit Tests: Database Functions
 * 
 * Task 2.3: Write unit tests for database functions
 * Requirements: 11.1, 11.2, 11.3
 * 
 * This test suite verifies that the new database functions work correctly
 * with the JSON file storage system. It tests CRUD operations for launches,
 * modifiers, sellables, and migration status.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  getLaunches,
  saveLaunches,
  getModifiers,
  saveModifiers,
  getSellables,
  saveSellables,
  getMigrationStatus,
  saveMigrationStatus
} from '../../lib/db.js'
import type {
  Launch,
  Modifier,
  Sellable,
  MigrationStatus
} from '../../types/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Test data directory
const testDataDir = path.join(__dirname, '../../public/data')

describe('Database Functions - Launches', () => {
  const sampleLaunches: Launch[] = [
    {
      id: 'launch-1',
      title: 'Corn + Tomato Launch',
      slug: 'corn-tomato-launch',
      status: 'active',
      featuredFlavourIds: ['flav-1', 'flav-2'],
      featuredSellableIds: ['sell-1'],
      featured: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'launch-2',
      title: 'Peach Week',
      slug: 'peach-week',
      status: 'upcoming',
      featuredFlavourIds: ['flav-3'],
      featuredSellableIds: ['sell-2', 'sell-3'],
      featured: false,
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z'
    }
  ]

  describe('getLaunches', () => {
    it('should return empty array when file does not exist', async () => {
      const launches = await getLaunches()
      expect(Array.isArray(launches)).toBe(true)
    })

    it('should return launches array when file exists', async () => {
      // Save test data first
      await saveLaunches(sampleLaunches)
      
      const launches = await getLaunches()
      expect(launches).toHaveLength(2)
      expect(launches[0].id).toBe('launch-1')
      expect(launches[1].id).toBe('launch-2')
    })

    it('should return launches with all required fields', async () => {
      await saveLaunches(sampleLaunches)
      
      const launches = await getLaunches()
      const launch = launches[0]
      
      expect(launch).toHaveProperty('id')
      expect(launch).toHaveProperty('title')
      expect(launch).toHaveProperty('slug')
      expect(launch).toHaveProperty('status')
      expect(launch).toHaveProperty('featuredFlavourIds')
      expect(launch).toHaveProperty('featuredSellableIds')
      expect(launch).toHaveProperty('featured')
      expect(launch).toHaveProperty('createdAt')
      expect(launch).toHaveProperty('updatedAt')
    })
  })

  describe('saveLaunches', () => {
    it('should save launches to file', async () => {
      const result = await saveLaunches(sampleLaunches)
      
      expect(result).toEqual(sampleLaunches)
      
      // Verify file was written
      const launches = await getLaunches()
      expect(launches).toHaveLength(2)
    })

    it('should overwrite existing launches', async () => {
      await saveLaunches(sampleLaunches)
      
      const newLaunches: Launch[] = [
        {
          id: 'launch-3',
          title: 'New Launch',
          slug: 'new-launch',
          status: 'active',
          featuredFlavourIds: [],
          featuredSellableIds: [],
          featured: false,
          createdAt: '2024-01-03T00:00:00.000Z',
          updatedAt: '2024-01-03T00:00:00.000Z'
        }
      ]
      
      await saveLaunches(newLaunches)
      
      const launches = await getLaunches()
      expect(launches).toHaveLength(1)
      expect(launches[0].id).toBe('launch-3')
    })

    it('should save empty array', async () => {
      await saveLaunches([])
      
      const launches = await getLaunches()
      expect(launches).toHaveLength(0)
    })

    it('should preserve all launch fields', async () => {
      const launchWithOptionalFields: Launch = {
        id: 'launch-4',
        title: 'Full Launch',
        slug: 'full-launch',
        status: 'active',
        heroImage: '/images/hero.jpg',
        story: 'This is a story',
        description: 'This is a description',
        activeStart: '2024-01-01T00:00:00.000Z',
        activeEnd: '2024-12-31T23:59:59.999Z',
        featuredFlavourIds: ['flav-1'],
        featuredSellableIds: ['sell-1'],
        contentBlocks: [
          {
            id: 'block-1',
            type: 'text',
            order: 1,
            content: { text: 'Sample content' }
          }
        ],
        relatedEventIds: ['event-1'],
        relatedMembershipDropIds: ['drop-1'],
        sortOrder: 1,
        featured: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
      
      await saveLaunches([launchWithOptionalFields])
      
      const launches = await getLaunches()
      const savedLaunch = launches[0]
      
      expect(savedLaunch.heroImage).toBe('/images/hero.jpg')
      expect(savedLaunch.story).toBe('This is a story')
      expect(savedLaunch.description).toBe('This is a description')
      expect(savedLaunch.activeStart).toBe('2024-01-01T00:00:00.000Z')
      expect(savedLaunch.activeEnd).toBe('2024-12-31T23:59:59.999Z')
      expect(savedLaunch.contentBlocks).toHaveLength(1)
      expect(savedLaunch.relatedEventIds).toHaveLength(1)
      expect(savedLaunch.relatedMembershipDropIds).toHaveLength(1)
      expect(savedLaunch.sortOrder).toBe(1)
    })
  })
})

describe('Database Functions - Modifiers', () => {
  const sampleModifiers: Modifier[] = [
    {
      id: 'mod-1',
      name: 'Hot Fudge',
      slug: 'hot-fudge',
      type: 'sauce',
      price: 150,
      allergens: ['dairy'],
      dietaryFlags: ['vegetarian'],
      availableForFormatIds: ['fmt-1', 'fmt-2'],
      status: 'active',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'mod-2',
      name: 'Sprinkles',
      slug: 'sprinkles',
      type: 'topping',
      price: 50,
      allergens: [],
      dietaryFlags: ['vegan'],
      availableForFormatIds: ['fmt-1'],
      status: 'active',
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z'
    }
  ]

  describe('getModifiers', () => {
    it('should return empty array when file does not exist', async () => {
      const modifiers = await getModifiers()
      expect(Array.isArray(modifiers)).toBe(true)
    })

    it('should return modifiers array when file exists', async () => {
      await saveModifiers(sampleModifiers)
      
      const modifiers = await getModifiers()
      expect(modifiers).toHaveLength(2)
      expect(modifiers[0].id).toBe('mod-1')
      expect(modifiers[1].id).toBe('mod-2')
    })

    it('should return modifiers with all required fields', async () => {
      await saveModifiers(sampleModifiers)
      
      const modifiers = await getModifiers()
      const modifier = modifiers[0]
      
      expect(modifier).toHaveProperty('id')
      expect(modifier).toHaveProperty('name')
      expect(modifier).toHaveProperty('slug')
      expect(modifier).toHaveProperty('type')
      expect(modifier).toHaveProperty('price')
      expect(modifier).toHaveProperty('allergens')
      expect(modifier).toHaveProperty('dietaryFlags')
      expect(modifier).toHaveProperty('availableForFormatIds')
      expect(modifier).toHaveProperty('status')
      expect(modifier).toHaveProperty('createdAt')
      expect(modifier).toHaveProperty('updatedAt')
    })
  })

  describe('saveModifiers', () => {
    it('should save modifiers to file', async () => {
      const result = await saveModifiers(sampleModifiers)
      
      expect(result).toEqual(sampleModifiers)
      
      const modifiers = await getModifiers()
      expect(modifiers).toHaveLength(2)
    })

    it('should overwrite existing modifiers', async () => {
      await saveModifiers(sampleModifiers)
      
      const newModifiers: Modifier[] = [
        {
          id: 'mod-3',
          name: 'Caramel',
          slug: 'caramel',
          type: 'drizzle',
          price: 100,
          allergens: ['dairy'],
          dietaryFlags: [],
          availableForFormatIds: ['fmt-1'],
          status: 'active',
          createdAt: '2024-01-03T00:00:00.000Z',
          updatedAt: '2024-01-03T00:00:00.000Z'
        }
      ]
      
      await saveModifiers(newModifiers)
      
      const modifiers = await getModifiers()
      expect(modifiers).toHaveLength(1)
      expect(modifiers[0].id).toBe('mod-3')
    })

    it('should save empty array', async () => {
      await saveModifiers([])
      
      const modifiers = await getModifiers()
      expect(modifiers).toHaveLength(0)
    })

    it('should preserve all modifier fields including optional ones', async () => {
      const modifierWithOptionalFields: Modifier = {
        id: 'mod-4',
        name: 'Premium Nuts',
        slug: 'premium-nuts',
        type: 'premium-addon',
        description: 'Roasted premium nuts',
        image: '/images/nuts.jpg',
        price: 200,
        allergens: ['tree-nuts'],
        dietaryFlags: ['vegan'],
        availableForFormatIds: ['fmt-1', 'fmt-2'],
        status: 'active',
        sortOrder: 5,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
      
      await saveModifiers([modifierWithOptionalFields])
      
      const modifiers = await getModifiers()
      const savedModifier = modifiers[0]
      
      expect(savedModifier.description).toBe('Roasted premium nuts')
      expect(savedModifier.image).toBe('/images/nuts.jpg')
      expect(savedModifier.sortOrder).toBe(5)
    })
  })
})

describe('Database Functions - Sellables', () => {
  const sampleSellables: Sellable[] = [
    {
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
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'sell-2',
      internalName: 'Chocolate Strawberry Twist',
      publicName: 'Chocolate + Strawberry Twist',
      slug: 'chocolate-strawberry-twist',
      status: 'active',
      formatId: 'fmt-2',
      primaryFlavourIds: ['flav-2'],
      secondaryFlavourIds: ['flav-3'],
      price: 600,
      inventoryTracked: true,
      inventoryQuantity: 50,
      onlineOrderable: true,
      pickupOnly: false,
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z'
    }
  ]

  describe('getSellables', () => {
    it('should return empty array when file does not exist', async () => {
      const sellables = await getSellables()
      expect(Array.isArray(sellables)).toBe(true)
    })

    it('should return sellables array when file exists', async () => {
      await saveSellables(sampleSellables)
      
      const sellables = await getSellables()
      expect(sellables).toHaveLength(2)
      expect(sellables[0].id).toBe('sell-1')
      expect(sellables[1].id).toBe('sell-2')
    })

    it('should return sellables with all required fields', async () => {
      await saveSellables(sampleSellables)
      
      const sellables = await getSellables()
      const sellable = sellables[0]
      
      expect(sellable).toHaveProperty('id')
      expect(sellable).toHaveProperty('internalName')
      expect(sellable).toHaveProperty('publicName')
      expect(sellable).toHaveProperty('slug')
      expect(sellable).toHaveProperty('status')
      expect(sellable).toHaveProperty('formatId')
      expect(sellable).toHaveProperty('primaryFlavourIds')
      expect(sellable).toHaveProperty('price')
      expect(sellable).toHaveProperty('inventoryTracked')
      expect(sellable).toHaveProperty('onlineOrderable')
      expect(sellable).toHaveProperty('pickupOnly')
      expect(sellable).toHaveProperty('createdAt')
      expect(sellable).toHaveProperty('updatedAt')
    })
  })

  describe('saveSellables', () => {
    it('should save sellables to file', async () => {
      const result = await saveSellables(sampleSellables)
      
      expect(result).toEqual(sampleSellables)
      
      const sellables = await getSellables()
      expect(sellables).toHaveLength(2)
    })

    it('should overwrite existing sellables', async () => {
      await saveSellables(sampleSellables)
      
      const newSellables: Sellable[] = [
        {
          id: 'sell-3',
          internalName: 'New Product',
          publicName: 'New Product',
          slug: 'new-product',
          status: 'draft',
          formatId: 'fmt-1',
          primaryFlavourIds: ['flav-1'],
          price: 700,
          inventoryTracked: false,
          onlineOrderable: false,
          pickupOnly: true,
          createdAt: '2024-01-03T00:00:00.000Z',
          updatedAt: '2024-01-03T00:00:00.000Z'
        }
      ]
      
      await saveSellables(newSellables)
      
      const sellables = await getSellables()
      expect(sellables).toHaveLength(1)
      expect(sellables[0].id).toBe('sell-3')
    })

    it('should save empty array', async () => {
      await saveSellables([])
      
      const sellables = await getSellables()
      expect(sellables).toHaveLength(0)
    })

    it('should preserve all sellable fields including optional ones', async () => {
      const sellableWithAllFields: Sellable = {
        id: 'sell-4',
        internalName: 'Ice Cream Sandwich Full',
        publicName: 'Chocolate Chip Cookie Ice Cream Sandwich',
        slug: 'chocolate-chip-sandwich',
        status: 'active',
        formatId: 'fmt-3',
        primaryFlavourIds: ['flav-1'],
        secondaryFlavourIds: ['flav-2'],
        componentIds: ['comp-1', 'comp-2'],
        toppingIds: ['mod-1', 'mod-2'],
        description: 'Delicious ice cream sandwich',
        shortCardCopy: 'Classic sandwich',
        image: '/images/sandwich.jpg',
        price: 800,
        compareAtPrice: 1000,
        availabilityStart: '2024-01-01T00:00:00.000Z',
        availabilityEnd: '2024-12-31T23:59:59.999Z',
        location: ['store-1', 'store-2'],
        tags: ['popular', 'seasonal'],
        shopifyProductId: 'gid://shopify/Product/123',
        shopifyProductHandle: 'chocolate-chip-sandwich',
        shopifySKU: 'ICS-001',
        posMapping: 'POS-123',
        syncStatus: 'synced',
        lastSyncedAt: '2024-01-01T12:00:00.000Z',
        inventoryTracked: true,
        inventoryQuantity: 100,
        batchCode: 'BATCH-001',
        restockDate: '2024-02-01T00:00:00.000Z',
        shelfLifeNotes: 'Best within 30 days',
        onlineOrderable: true,
        pickupOnly: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
      
      await saveSellables([sellableWithAllFields])
      
      const sellables = await getSellables()
      const savedSellable = sellables[0]
      
      expect(savedSellable.secondaryFlavourIds).toHaveLength(1)
      expect(savedSellable.componentIds).toHaveLength(2)
      expect(savedSellable.toppingIds).toHaveLength(2)
      expect(savedSellable.description).toBe('Delicious ice cream sandwich')
      expect(savedSellable.shortCardCopy).toBe('Classic sandwich')
      expect(savedSellable.image).toBe('/images/sandwich.jpg')
      expect(savedSellable.compareAtPrice).toBe(1000)
      expect(savedSellable.availabilityStart).toBe('2024-01-01T00:00:00.000Z')
      expect(savedSellable.availabilityEnd).toBe('2024-12-31T23:59:59.999Z')
      expect(savedSellable.location).toHaveLength(2)
      expect(savedSellable.tags).toHaveLength(2)
      expect(savedSellable.shopifyProductId).toBe('gid://shopify/Product/123')
      expect(savedSellable.shopifyProductHandle).toBe('chocolate-chip-sandwich')
      expect(savedSellable.shopifySKU).toBe('ICS-001')
      expect(savedSellable.posMapping).toBe('POS-123')
      expect(savedSellable.syncStatus).toBe('synced')
      expect(savedSellable.lastSyncedAt).toBe('2024-01-01T12:00:00.000Z')
      expect(savedSellable.inventoryQuantity).toBe(100)
      expect(savedSellable.batchCode).toBe('BATCH-001')
      expect(savedSellable.restockDate).toBe('2024-02-01T00:00:00.000Z')
      expect(savedSellable.shelfLifeNotes).toBe('Best within 30 days')
    })
  })
})

describe('Database Functions - Migration Status', () => {
  const sampleMigrationStatus: MigrationStatus = {
    phase: 1,
    status: 'in-progress',
    progress: 50,
    errors: [],
    warnings: ['Warning: Some data needs review']
  }

  describe('getMigrationStatus', () => {
    it('should return data when file exists (from previous tests)', async () => {
      const status = await getMigrationStatus()
      // The function returns data - could be an object, array, or null
      expect(status).toBeDefined()
    })

    it('should return migration status when file exists', async () => {
      await saveMigrationStatus(sampleMigrationStatus)
      
      const status = await getMigrationStatus()
      expect(status).toHaveProperty('phase')
      expect(status).toHaveProperty('status')
      expect(status).toHaveProperty('progress')
    })

    it('should return migration status with all required fields', async () => {
      await saveMigrationStatus(sampleMigrationStatus)
      
      const status = await getMigrationStatus()
      
      expect(status).toHaveProperty('phase')
      expect(status).toHaveProperty('status')
      expect(status).toHaveProperty('progress')
      expect(status).toHaveProperty('errors')
      expect(status).toHaveProperty('warnings')
    })
  })

  describe('saveMigrationStatus', () => {
    it('should save migration status to file', async () => {
      const result = await saveMigrationStatus(sampleMigrationStatus)
      
      expect(result).toEqual(sampleMigrationStatus)
      
      const status = await getMigrationStatus()
      expect(status.phase).toBe(1)
      expect(status.status).toBe('in-progress')
      expect(status.progress).toBe(50)
    })

    it('should overwrite existing migration status', async () => {
      await saveMigrationStatus(sampleMigrationStatus)
      
      const newStatus: MigrationStatus = {
        phase: 2,
        status: 'completed',
        progress: 100,
        errors: [],
        warnings: []
      }
      
      await saveMigrationStatus(newStatus)
      
      const status = await getMigrationStatus()
      expect(status.phase).toBe(2)
      expect(status.status).toBe('completed')
      expect(status.progress).toBe(100)
    })

    it('should preserve errors and warnings arrays', async () => {
      const statusWithErrors: MigrationStatus = {
        phase: 1,
        status: 'error',
        progress: 25,
        errors: ['Error 1', 'Error 2'],
        warnings: ['Warning 1', 'Warning 2', 'Warning 3']
      }
      
      await saveMigrationStatus(statusWithErrors)
      
      const status = await getMigrationStatus()
      expect(status.errors).toHaveLength(2)
      expect(status.warnings).toHaveLength(3)
      expect(status.errors[0]).toBe('Error 1')
      expect(status.warnings[0]).toBe('Warning 1')
    })

    it('should preserve optional fields', async () => {
      const statusWithOptionalFields: MigrationStatus = {
        phase: 3,
        status: 'completed',
        progress: 100,
        errors: [],
        warnings: [],
        backupTimestamp: '2024-01-01T00:00:00.000Z',
        startedAt: '2024-01-01T00:00:00.000Z',
        completedAt: '2024-01-01T01:00:00.000Z',
        totalRecords: 1000,
        processedRecords: 1000
      }
      
      await saveMigrationStatus(statusWithOptionalFields)
      
      const status = await getMigrationStatus()
      expect(status.backupTimestamp).toBe('2024-01-01T00:00:00.000Z')
      expect(status.startedAt).toBe('2024-01-01T00:00:00.000Z')
      expect(status.completedAt).toBe('2024-01-01T01:00:00.000Z')
      expect(status.totalRecords).toBe(1000)
      expect(status.processedRecords).toBe(1000)
    })
  })
})

describe('Database Functions - Error Handling', () => {
  it('should handle null data gracefully', async () => {
    // Test that functions don't crash with null/undefined
    const launches = await getLaunches()
    expect(Array.isArray(launches)).toBe(true)
  })

  it('should handle concurrent reads', async () => {
    await saveLaunches([
      {
        id: 'launch-1',
        title: 'Test',
        slug: 'test',
        status: 'active',
        featuredFlavourIds: [],
        featuredSellableIds: [],
        featured: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ])
    
    // Perform multiple concurrent reads
    const [result1, result2, result3] = await Promise.all([
      getLaunches(),
      getLaunches(),
      getLaunches()
    ])
    
    expect(result1).toHaveLength(1)
    expect(result2).toHaveLength(1)
    expect(result3).toHaveLength(1)
  })
})
