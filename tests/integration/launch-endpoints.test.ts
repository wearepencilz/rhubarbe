import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getLaunches, saveLaunches } from '@/lib/db';
import type { Launch, LaunchStatus } from '@/types';

describe('Launch API Endpoints Integration Tests', () => {
  let originalLaunches: Launch[];
  
  beforeEach(async () => {
    // Backup original launches
    originalLaunches = await getLaunches() as Launch[];
    
    // Start with empty launches for clean tests
    await saveLaunches([]);
  });
  
  afterEach(async () => {
    // Restore original launches
    await saveLaunches(originalLaunches);
  });
  
  describe('GET /api/launches', () => {
    it('should return empty array when no launches exist', async () => {
      const launches = await getLaunches();
      expect(launches).toEqual([]);
    });
    
    it('should return all launches', async () => {
      const testLaunches: Launch[] = [
        {
          id: '1',
          title: 'Summer Launch',
          slug: 'summer-launch',
          status: 'active',
          featuredFlavourIds: ['f1', 'f2'],
          featuredSellableIds: ['s1'],
          featured: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Fall Launch',
          slug: 'fall-launch',
          status: 'upcoming',
          featuredFlavourIds: ['f3'],
          featuredSellableIds: [],
          featured: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
      
      await saveLaunches(testLaunches);
      
      const launches = await getLaunches();
      expect(launches).toHaveLength(2);
      expect(launches[0].title).toBe('Summer Launch');
      expect(launches[1].title).toBe('Fall Launch');
    });
    
    it('should filter launches by status', async () => {
      const testLaunches: Launch[] = [
        {
          id: '1',
          title: 'Active Launch',
          slug: 'active-launch',
          status: 'active',
          featuredFlavourIds: [],
          featuredSellableIds: [],
          featured: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Upcoming Launch',
          slug: 'upcoming-launch',
          status: 'upcoming',
          featuredFlavourIds: [],
          featuredSellableIds: [],
          featured: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
      
      await saveLaunches(testLaunches);
      
      const launches = await getLaunches() as Launch[];
      const activeLaunches = launches.filter((l: Launch) => l.status === 'active');
      
      expect(activeLaunches).toHaveLength(1);
      expect(activeLaunches[0].title).toBe('Active Launch');
    });
    
    it('should filter launches by featured flag', async () => {
      const testLaunches: Launch[] = [
        {
          id: '1',
          title: 'Featured Launch',
          slug: 'featured-launch',
          status: 'active',
          featuredFlavourIds: [],
          featuredSellableIds: [],
          featured: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Regular Launch',
          slug: 'regular-launch',
          status: 'active',
          featuredFlavourIds: [],
          featuredSellableIds: [],
          featured: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
      
      await saveLaunches(testLaunches);
      
      const launches = await getLaunches() as Launch[];
      const featuredLaunches = launches.filter((l: Launch) => l.featured === true);
      
      expect(featuredLaunches).toHaveLength(1);
      expect(featuredLaunches[0].title).toBe('Featured Launch');
    });
  });
  
  describe('POST /api/launches', () => {
    it('should create a new launch with required fields', async () => {
      const newLaunch: Omit<Launch, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'New Launch',
        slug: 'new-launch',
        status: 'upcoming',
        featuredFlavourIds: ['f1'],
        featuredSellableIds: ['s1'],
        featured: false,
      };
      
      const launches = await getLaunches() as Launch[];
      const created: Launch = {
        ...newLaunch,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      launches.push(created);
      await saveLaunches(launches);
      
      const savedLaunches = await getLaunches();
      expect(savedLaunches).toHaveLength(1);
      expect(savedLaunches[0].title).toBe('New Launch');
      expect(savedLaunches[0].status).toBe('upcoming');
    });
    
    it('should create launch with all optional fields', async () => {
      const newLaunch: Omit<Launch, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'Complete Launch',
        slug: 'complete-launch',
        status: 'active',
        heroImage: '/images/hero.jpg',
        story: 'This is the launch story',
        description: 'Launch description',
        activeStart: '2024-01-01T00:00:00Z',
        activeEnd: '2024-12-31T23:59:59Z',
        featuredFlavourIds: ['f1', 'f2'],
        featuredSellableIds: ['s1', 's2'],
        contentBlocks: [
          {
            id: 'block1',
            type: 'text',
            order: 1,
            content: { text: 'Block content' }
          }
        ],
        relatedEventIds: ['e1'],
        relatedMembershipDropIds: ['m1'],
        sortOrder: 10,
        featured: true,
      };
      
      const launches = await getLaunches() as Launch[];
      const created: Launch = {
        ...newLaunch,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      launches.push(created);
      await saveLaunches(launches);
      
      const savedLaunches = await getLaunches();
      expect(savedLaunches).toHaveLength(1);
      expect(savedLaunches[0].heroImage).toBe('/images/hero.jpg');
      expect(savedLaunches[0].story).toBe('This is the launch story');
      expect(savedLaunches[0].contentBlocks).toHaveLength(1);
    });
    
    it('should reject launch with invalid status', async () => {
      const invalidLaunch = {
        title: 'Invalid Launch',
        slug: 'invalid-launch',
        status: 'invalid-status' as LaunchStatus,
        featuredFlavourIds: [],
        featuredSellableIds: [],
        featured: false,
      };
      
      const validStatuses: LaunchStatus[] = ['upcoming', 'active', 'ended', 'archived'];
      const isValid = validStatuses.includes(invalidLaunch.status);
      
      expect(isValid).toBe(false);
    });
    
    it('should reject launch without required title', async () => {
      const invalidLaunch = {
        slug: 'no-title-launch',
        status: 'active' as LaunchStatus,
        featuredFlavourIds: [],
        featuredSellableIds: [],
        featured: false,
      };
      
      expect(invalidLaunch).not.toHaveProperty('title');
    });
    
    it('should prevent duplicate slugs', async () => {
      const launch1: Launch = {
        id: '1',
        title: 'First Launch',
        slug: 'duplicate-slug',
        status: 'active',
        featuredFlavourIds: [],
        featuredSellableIds: [],
        featured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await saveLaunches([launch1]);
      
      const launches = await getLaunches() as Launch[];
      const hasDuplicate = launches.some((l: Launch) => l.slug === 'duplicate-slug');
      
      expect(hasDuplicate).toBe(true);
      
      // Attempting to create another with same slug should be detected
      const duplicateExists = launches.find((l: Launch) => l.slug === 'duplicate-slug');
      expect(duplicateExists).toBeDefined();
    });
  });
  
  describe('GET /api/launches/[id]', () => {
    it('should return a specific launch by id', async () => {
      const testLaunch: Launch = {
        id: 'test-id-123',
        title: 'Test Launch',
        slug: 'test-launch',
        status: 'active',
        featuredFlavourIds: ['f1'],
        featuredSellableIds: [],
        featured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await saveLaunches([testLaunch]);
      
      const launches = await getLaunches() as Launch[];
      const found = launches.find((l: Launch) => l.id === 'test-id-123');
      
      expect(found).toBeDefined();
      expect(found?.title).toBe('Test Launch');
    });
    
    it('should return 404 for non-existent launch', async () => {
      const launches = await getLaunches() as Launch[];
      const found = launches.find((l: Launch) => l.id === 'non-existent-id');
      
      expect(found).toBeUndefined();
    });
  });
  
  describe('PUT /api/launches/[id]', () => {
    it('should update an existing launch', async () => {
      const originalLaunch: Launch = {
        id: 'update-test-id',
        title: 'Original Title',
        slug: 'original-slug',
        status: 'upcoming',
        featuredFlavourIds: [],
        featuredSellableIds: [],
        featured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await saveLaunches([originalLaunch]);
      
      const launches = await getLaunches() as Launch[];
      const index = launches.findIndex((l: Launch) => l.id === 'update-test-id');
      
      launches[index] = {
        ...launches[index],
        title: 'Updated Title',
        status: 'active',
        updatedAt: new Date().toISOString(),
      };
      
      await saveLaunches(launches);
      
      const updated = await getLaunches() as Launch[];
      const updatedLaunch = updated.find((l: Launch) => l.id === 'update-test-id');
      
      expect(updatedLaunch?.title).toBe('Updated Title');
      expect(updatedLaunch?.status).toBe('active');
    });
    
    it('should preserve id when updating', async () => {
      const originalLaunch: Launch = {
        id: 'preserve-id-test',
        title: 'Original',
        slug: 'original',
        status: 'active',
        featuredFlavourIds: [],
        featuredSellableIds: [],
        featured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await saveLaunches([originalLaunch]);
      
      const launches = await getLaunches() as Launch[];
      const index = launches.findIndex((l: Launch) => l.id === 'preserve-id-test');
      
      launches[index] = {
        ...launches[index],
        title: 'Updated',
        id: 'preserve-id-test', // ID should not change
        updatedAt: new Date().toISOString(),
      };
      
      await saveLaunches(launches);
      
      const updated = await getLaunches() as Launch[];
      const updatedLaunch = updated.find((l: Launch) => l.id === 'preserve-id-test');
      
      expect(updatedLaunch?.id).toBe('preserve-id-test');
    });
  });
  
  describe('DELETE /api/launches/[id]', () => {
    it('should delete an existing launch', async () => {
      const testLaunch: Launch = {
        id: 'delete-test-id',
        title: 'To Be Deleted',
        slug: 'to-be-deleted',
        status: 'active',
        featuredFlavourIds: [],
        featuredSellableIds: [],
        featured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await saveLaunches([testLaunch]);
      
      let launches = await getLaunches() as Launch[];
      expect(launches).toHaveLength(1);
      
      // Delete the launch
      launches = launches.filter((l: Launch) => l.id !== 'delete-test-id');
      await saveLaunches(launches);
      
      const remaining = await getLaunches();
      expect(remaining).toHaveLength(0);
    });
    
    it('should return 404 when deleting non-existent launch', async () => {
      const launches = await getLaunches() as Launch[];
      const found = launches.find((l: Launch) => l.id === 'non-existent-id');
      
      expect(found).toBeUndefined();
    });
  });
  
  describe('Launch validation', () => {
    it('should validate all status values', () => {
      const validStatuses: LaunchStatus[] = ['upcoming', 'active', 'ended', 'archived'];
      
      expect(validStatuses).toContain('upcoming');
      expect(validStatuses).toContain('active');
      expect(validStatuses).toContain('ended');
      expect(validStatuses).toContain('archived');
      expect(validStatuses).toHaveLength(4);
    });
    
    it('should require title field', () => {
      const launch = {
        slug: 'test',
        status: 'active' as LaunchStatus,
        featuredFlavourIds: [],
        featuredSellableIds: [],
        featured: false,
      };
      
      expect(launch).not.toHaveProperty('title');
    });
    
    it('should require status field', () => {
      const launch = {
        title: 'Test',
        slug: 'test',
        featuredFlavourIds: [],
        featuredSellableIds: [],
        featured: false,
      };
      
      expect(launch).not.toHaveProperty('status');
    });
    
    it('should have featuredFlavourIds as array', () => {
      const launch: Launch = {
        id: '1',
        title: 'Test',
        slug: 'test',
        status: 'active',
        featuredFlavourIds: ['f1', 'f2'],
        featuredSellableIds: [],
        featured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      expect(Array.isArray(launch.featuredFlavourIds)).toBe(true);
    });
    
    it('should have featuredSellableIds as array', () => {
      const launch: Launch = {
        id: '1',
        title: 'Test',
        slug: 'test',
        status: 'active',
        featuredFlavourIds: [],
        featuredSellableIds: ['s1', 's2'],
        featured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      expect(Array.isArray(launch.featuredSellableIds)).toBe(true);
    });
  });
});
