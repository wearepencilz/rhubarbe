import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Load environment variables from .env.local (for local development)
if (!process.env.VERCEL) {
  dotenv.config({ path: '.env.local' })
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Check if we're in production (Vercel) or development
const isProduction = process.env.VERCEL === '1'

// Check if we're running tests
const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'

// Database adapter that works with multiple storage backends
class Database {
  constructor() {
    // Use test data directory when running tests, otherwise use production data
    this.dataDir = isTest 
      ? path.join(__dirname, '../tests/fixtures/data')
      : isProduction
        ? path.join(process.cwd(), 'public/data')
        : path.join(__dirname, '../public/data')
    this.kv = null
    this.redis = null
    this.storageType = 'file' // Default to file storage
    this.initialized = false
    this.initPromise = null
    
    // Initialize storage backend if in production
    if (isProduction) {
      this.initPromise = this.initStorage()
    } else {
      this.initialized = true
    }
  }

  async ensureInitialized() {
    if (!this.initialized && this.initPromise) {
      await this.initPromise
      this.initialized = true
    }
  }

  async initStorage() {
    // Try Vercel KV / Upstash Redis first (via @vercel/kv)
    if (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) {
      try {
        const { kv } = await import('@vercel/kv')
        this.kv = kv
        this.storageType = 'kv'
        console.log('✓ Using Vercel KV / Upstash Redis for data storage')
        return
      } catch (error) {
        console.warn('⚠ Vercel KV not available:', error.message)
      }
    }

    // Try native Redis client (for custom Redis servers)
    if (process.env.REDIS_URL) {
      try {
        const { createClient } = await import('redis')
        console.log('Attempting Redis connection to:', process.env.REDIS_URL.replace(/:[^:@]+@/, ':****@'))
        this.redis = await createClient({
          url: process.env.REDIS_URL
        }).connect()
        this.storageType = 'redis'
        console.log('✓ Using Redis for data storage')
        return
      } catch (error) {
        console.error('⚠ Redis connection failed:', error.message)
        console.error('Full error:', error)
      }
    }

    // Fallback to file system (not recommended for production)
    console.warn('⚠ No database configured, using file system (data will not persist)')
    this.storageType = 'file'
  }

  async read(filename) {
    await this.ensureInitialized()
    
    const key = filename.replace('.json', '')
    
    // Try Vercel KV / Upstash first
    if (this.kv) {
      try {
        const data = await this.kv.get(key)
        if (data) {
          console.log(`✓ Read from KV: ${key}`)
          return data
        }
      } catch (error) {
        console.error('KV read error:', error)
      }
    }

    // Try native Redis
    if (this.redis) {
      try {
        const data = await this.redis.get(key)
        if (data) {
          console.log(`✓ Read from Redis: ${key}`)
          return JSON.parse(data)
        }
      } catch (error) {
        console.error('Redis read error:', error)
      }
    }
    
    // Fallback to file system
    try {
      const filePath = path.join(this.dataDir, filename)
      const data = fs.readFileSync(filePath, 'utf8')
      console.log(`✓ Read from file: ${filename}`)
      return JSON.parse(data)
    } catch (error) {
      console.error('File read error:', error)
      return null
    }
  }

  async write(filename, data) {
    await this.ensureInitialized()
    
    const key = filename.replace('.json', '')
    
    // Write to Vercel KV / Upstash if available
    if (this.kv) {
      try {
        await this.kv.set(key, data)
        console.log(`✓ Saved to KV: ${key}`)
      } catch (error) {
        console.error('KV write error:', error)
      }
    }

    // Write to native Redis if available
    if (this.redis) {
      try {
        await this.redis.set(key, JSON.stringify(data))
        console.log(`✓ Saved to Redis: ${key}`)
      } catch (error) {
        console.error('Redis write error:', error)
      }
    }
    
    // Always write to file system in development
    if (!isProduction) {
      try {
        const filePath = path.join(this.dataDir, filename)
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
        console.log(`✓ Saved to file: ${filename}`)
      } catch (error) {
        console.error('File write error:', error)
      }
    }
    
    return data
  }

  async close() {
    // Close Redis connection if exists
    if (this.redis) {
      await this.redis.quit()
    }
  }
}

export const db = new Database()

// Helper functions for data access
async function getData(type) {
  const data = await db.read(`${type}.json`)
  return data || []
}

async function saveData(type, data) {
  return await db.write(`${type}.json`, data)
}

// Ingredients
export async function getIngredients() {
  return getData('ingredients')
}

export async function saveIngredients(ingredients) {
  return saveData('ingredients', ingredients)
}

// Stories
export async function getStories() {
  return getData('stories')
}

export async function saveStories(stories) {
  return saveData('stories', stories)
}

// Settings
export async function getSettings() {
  return getData('settings')
}

export async function saveSettings(settings) {
  return saveData('settings', settings)
}

// Legacy - Projects (keeping for backward compatibility)
export async function getProjects() {
  return getData('projects')
}

export async function saveProjects(projects) {
  return saveData('projects', projects)
}

// Legacy - News (keeping for backward compatibility)
export async function getNews() {
  return getData('news')
}

export async function saveNews(news) {
  return saveData('news', news)
}

// Sync Jobs
export async function getSyncJobs() {
  return getData('sync-jobs')
}

export async function saveSyncJobs(jobs) {
  return saveData('sync-jobs', jobs)
}

// Sync Logs
export async function getSyncLogs() {
  return getData('sync-logs')
}

export async function saveSyncLogs(logs) {
  return saveData('sync-logs', logs)
}

// Offerings (Three-Layer Architecture)
export async function getOfferings() {
  return getData('offerings')
}

export async function saveOfferings(offerings) {
  return saveData('offerings', offerings)
}

// Bundles (Three-Layer Architecture)
export async function getBundles() {
  return getData('bundles')
}

export async function saveBundles(bundles) {
  return saveData('bundles', bundles)
}

// Components (Three-Layer Architecture)
export async function getComponents() {
  return getData('components')
}

export async function saveComponents(components) {
  return saveData('components', components)
}

// Seasonal Collections (Three-Layer Architecture)
export async function getSeasonalCollections() {
  return getData('seasonal-collections')
}

export async function saveSeasonalCollections(collections) {
  return saveData('seasonal-collections', collections)
}

// Products
export async function getProducts() {
  return getData('products')
}

export async function saveProducts(products) {
  return saveData('products', products)
}

// Migration Status (Launch-First CMS Model)
export async function getMigrationStatus() {
  return getData('migration-status')
}

export async function saveMigrationStatus(status) {
  return saveData('migration-status', status)
}


// ============================================================================
// Taxonomy — stored in taxonomies.json, completely isolated from settings.json
// This prevents any settings save from ever wiping taxonomy data.
// ============================================================================

export async function getTaxonomies() {
  const data = await db.read('taxonomies.json')
  return data || {}
}

export async function saveTaxonomies(taxonomies) {
  return db.write('taxonomies.json', taxonomies)
}

// Fallback defaults — only used if taxonomies.json is missing a category entirely.
const TAXONOMY_DEFAULTS = {
  flavourTypes: [
    { id: 'gelato', label: 'Gelato', value: 'gelato', sortOrder: 1, archived: false },
    { id: 'sorbet', label: 'Sorbet', value: 'sorbet', sortOrder: 2, archived: false },
  ],
  keyNotes: [
    { id: 'sweet', label: 'Sweet', value: 'sweet', sortOrder: 1, archived: false },
    { id: 'rich', label: 'Rich', value: 'rich', sortOrder: 2, archived: false },
    { id: 'buttery', label: 'Buttery', value: 'buttery', sortOrder: 3, archived: false },
    { id: 'caramelized', label: 'Caramelized', value: 'caramelized', sortOrder: 4, archived: false },
    { id: 'honeyed', label: 'Honeyed', value: 'honeyed', sortOrder: 5, archived: false },
    { id: 'fresh', label: 'Fresh', value: 'fresh', sortOrder: 6, archived: false },
    { id: 'refreshing', label: 'Refreshing', value: 'refreshing', sortOrder: 7, archived: false },
    { id: 'bright', label: 'Bright', value: 'bright', sortOrder: 8, archived: false },
    { id: 'citrusy', label: 'Citrusy', value: 'citrusy', sortOrder: 9, archived: false },
    { id: 'fruity', label: 'Fruity', value: 'fruity', sortOrder: 10, archived: false },
    { id: 'floral', label: 'Floral', value: 'floral', sortOrder: 11, archived: false },
    { id: 'jammy', label: 'Jammy', value: 'jammy', sortOrder: 12, archived: false },
    { id: 'savory', label: 'Savory', value: 'savory', sortOrder: 13, archived: false },
    { id: 'earthy', label: 'Earthy', value: 'earthy', sortOrder: 14, archived: false },
    { id: 'herbal', label: 'Herbal', value: 'herbal', sortOrder: 15, archived: false },
    { id: 'green', label: 'Green', value: 'green', sortOrder: 16, archived: false },
    { id: 'nutty', label: 'Nutty', value: 'nutty', sortOrder: 17, archived: false },
    { id: 'toasted', label: 'Toasted', value: 'toasted', sortOrder: 18, archived: false },
    { id: 'smoky', label: 'Smoky', value: 'smoky', sortOrder: 19, archived: false },
    { id: 'spiced', label: 'Spiced', value: 'spiced', sortOrder: 20, archived: false },
    { id: 'creamy', label: 'Creamy', value: 'creamy', sortOrder: 21, archived: false },
    { id: 'light', label: 'Light', value: 'light', sortOrder: 22, archived: false },
  ],
  ingredientCategories: [
    { id: 'dairy-bases', label: 'Dairy & Bases', value: 'dairy-bases', sortOrder: 1, archived: false },
    { id: 'fruits-vegetables', label: 'Fruits & Vegetables', value: 'fruits-vegetables', sortOrder: 2, archived: false },
    { id: 'nuts-seeds-grains', label: 'Nuts, Seeds & Grains', value: 'nuts-seeds-grains', sortOrder: 3, archived: false },
    { id: 'spices-herbs-botanicals', label: 'Spices, Herbs & Botanicals', value: 'spices-herbs-botanicals', sortOrder: 4, archived: false },
    { id: 'sweeteners-syrups', label: 'Sweeteners & Syrups', value: 'sweeteners-syrups', sortOrder: 5, archived: false },
    { id: 'chocolate-coffee-cacao', label: 'Chocolate, Coffee & Cacao', value: 'chocolate-coffee-cacao', sortOrder: 6, archived: false },
    { id: 'floral-aromatic', label: 'Floral & Aromatic', value: 'floral-aromatic', sortOrder: 7, archived: false },
    { id: 'funky-fermented-savoury', label: 'Funky, Fermented & Savoury', value: 'funky-fermented-savoury', sortOrder: 8, archived: false },
    { id: 'salts-minerals', label: 'Salts & Minerals', value: 'salts-minerals', sortOrder: 9, archived: false },
    { id: 'regional-cultural-staples', label: 'Regional or Cultural Staples', value: 'regional-cultural-staples', sortOrder: 10, archived: false },
    { id: 'inclusions-add-ons', label: 'Inclusions & Add-Ons', value: 'inclusions-add-ons', sortOrder: 11, archived: false },
    { id: 'other', label: 'Other', value: 'other', sortOrder: 12, archived: false },
  ],
  ingredientRoles: [
    { id: 'primary', label: 'Primary', value: 'primary', description: 'Main ingredient defining the flavour', sortOrder: 1, archived: false },
    { id: 'supporting', label: 'Supporting', value: 'supporting', description: 'Enhances or complements the primary flavour', sortOrder: 2, archived: false },
    { id: 'accent', label: 'Accent', value: 'accent', description: 'Adds subtle notes or complexity', sortOrder: 3, archived: false },
  ],
  tastingNotes: [
    { id: 'citrus', label: 'Citrus', value: 'citrus', sortOrder: 1, archived: false },
    { id: 'floral', label: 'Floral', value: 'floral', sortOrder: 2, archived: false },
    { id: 'bittersweet', label: 'Bittersweet', value: 'bittersweet', sortOrder: 3, archived: false },
    { id: 'earthy', label: 'Earthy', value: 'earthy', sortOrder: 4, archived: false },
    { id: 'herbaceous', label: 'Herbaceous', value: 'herbaceous', sortOrder: 5, archived: false },
    { id: 'spicy', label: 'Spicy', value: 'spicy', sortOrder: 6, archived: false },
    { id: 'woody', label: 'Woody', value: 'woody', sortOrder: 7, archived: false },
    { id: 'tropical', label: 'Tropical', value: 'tropical', sortOrder: 8, archived: false },
    { id: 'berry', label: 'Berry', value: 'berry', sortOrder: 9, archived: false },
    { id: 'stone-fruit', label: 'Stone Fruit', value: 'stone-fruit', sortOrder: 10, archived: false },
  ],
  productCategories: [
    { id: 'gelato', label: 'Gelato', value: 'gelato', sortOrder: 1, archived: false },
    { id: 'sorbet', label: 'Sorbet', value: 'sorbet', sortOrder: 2, archived: false },
    { id: 'pastry', label: 'Pastry', value: 'pastry', sortOrder: 3, archived: false },
    { id: 'drink', label: 'Drink', value: 'drink', sortOrder: 4, archived: false },
    { id: 'snack', label: 'Snack', value: 'snack', sortOrder: 5, archived: false },
  ],
  formatCategories: [
    { id: 'frozen', label: 'Frozen', value: 'frozen', description: 'Ice cream, sorbet, soft serve', sortOrder: 1, archived: false },
    { id: 'food', label: 'Food', value: 'food', description: 'Sandwiches, focaccia', sortOrder: 2, archived: false },
    { id: 'experience', label: 'Experience', value: 'experience', description: 'Tastings, events', sortOrder: 3, archived: false },
    { id: 'bundle', label: 'Bundle', value: 'bundle', description: 'Multi-item packages', sortOrder: 4, archived: false },
  ],
  servingStyles: [
    { id: 'scoop', label: 'Scoop', value: 'scoop', description: 'Traditional scooped ice cream', sortOrder: 1, archived: false },
    { id: 'soft-serve', label: 'Soft Serve', value: 'soft-serve', description: 'Soft-serve machine dispensed', sortOrder: 2, archived: false },
    { id: 'packaged', label: 'Packaged', value: 'packaged', description: 'Pre-packaged containers', sortOrder: 3, archived: false },
    { id: 'plated', label: 'Plated', value: 'plated', description: 'Plated dessert experience', sortOrder: 4, archived: false },
  ],
  modifierTypes: [
    { id: 'topping', label: 'Topping', value: 'topping', sortOrder: 1, archived: false },
    { id: 'sauce', label: 'Sauce', value: 'sauce', sortOrder: 2, archived: false },
    { id: 'crunch', label: 'Crunch', value: 'crunch', sortOrder: 3, archived: false },
    { id: 'drizzle', label: 'Drizzle', value: 'drizzle', sortOrder: 4, archived: false },
    { id: 'premium-addon', label: 'Premium Add-on', value: 'premium-addon', sortOrder: 5, archived: false },
  ],
  allergens: [
    { id: 'dairy', label: 'Dairy', value: 'dairy', sortOrder: 1, archived: false },
    { id: 'egg', label: 'Egg', value: 'egg', sortOrder: 2, archived: false },
    { id: 'gluten', label: 'Gluten', value: 'gluten', sortOrder: 3, archived: false },
    { id: 'tree-nuts', label: 'Tree Nuts', value: 'tree-nuts', sortOrder: 4, archived: false },
    { id: 'peanuts', label: 'Peanuts', value: 'peanuts', sortOrder: 5, archived: false },
    { id: 'sesame', label: 'Sesame', value: 'sesame', sortOrder: 6, archived: false },
    { id: 'soy', label: 'Soy', value: 'soy', sortOrder: 7, archived: false },
  ],
  ingredientTextures: [
    { id: 'creamy', label: 'Creamy', value: 'creamy', sortOrder: 1, archived: false },
    { id: 'icy', label: 'Icy', value: 'icy', sortOrder: 2, archived: false },
    { id: 'crunchy', label: 'Crunchy', value: 'crunchy', sortOrder: 3, archived: false },
    { id: 'silky', label: 'Silky', value: 'silky', sortOrder: 4, archived: false },
    { id: 'chewy', label: 'Chewy', value: 'chewy', sortOrder: 5, archived: false },
    { id: 'smooth', label: 'Smooth', value: 'smooth', sortOrder: 6, archived: false },
    { id: 'grainy', label: 'Grainy', value: 'grainy', sortOrder: 7, archived: false },
    { id: 'airy', label: 'Airy', value: 'airy', sortOrder: 8, archived: false },
    { id: 'dense', label: 'Dense', value: 'dense', sortOrder: 9, archived: false },
    { id: 'liquid', label: 'Liquid', value: 'liquid', sortOrder: 10, archived: false },
    { id: 'gel', label: 'Gel', value: 'gel', sortOrder: 11, archived: false },
    { id: 'crisp', label: 'Crisp', value: 'crisp', sortOrder: 12, archived: false },
  ],
  ingredientProcesses: [
    { id: 'raw', label: 'Raw', value: 'raw', sortOrder: 1, archived: false },
    { id: 'roasted', label: 'Roasted', value: 'roasted', sortOrder: 2, archived: false },
    { id: 'toasted', label: 'Toasted', value: 'toasted', sortOrder: 3, archived: false },
    { id: 'grilled', label: 'Grilled', value: 'grilled', sortOrder: 4, archived: false },
    { id: 'infused', label: 'Infused', value: 'infused', sortOrder: 5, archived: false },
    { id: 'fermented', label: 'Fermented', value: 'fermented', sortOrder: 6, archived: false },
    { id: 'candied', label: 'Candied', value: 'candied', sortOrder: 7, archived: false },
    { id: 'caramelized', label: 'Caramelized', value: 'caramelized', sortOrder: 8, archived: false },
    { id: 'dried', label: 'Dried', value: 'dried', sortOrder: 9, archived: false },
    { id: 'freeze-dried', label: 'Freeze-dried', value: 'freeze-dried', sortOrder: 10, archived: false },
    { id: 'smoked', label: 'Smoked', value: 'smoked', sortOrder: 11, archived: false },
    { id: 'pickled', label: 'Pickled', value: 'pickled', sortOrder: 12, archived: false },
    { id: 'compressed', label: 'Compressed', value: 'compressed', sortOrder: 13, archived: false },
    { id: 'extracted', label: 'Extracted', value: 'extracted', sortOrder: 14, archived: false },
    { id: 'reduced', label: 'Reduced', value: 'reduced', sortOrder: 15, archived: false },
    { id: 'browned', label: 'Browned', value: 'browned', sortOrder: 16, archived: false },
  ],
  ingredientAttributes: [
    { id: 'local', label: 'Local', value: 'local', sortOrder: 1, archived: false },
    { id: 'imported', label: 'Imported', value: 'imported', sortOrder: 2, archived: false },
    { id: 'seasonal', label: 'Seasonal', value: 'seasonal', sortOrder: 3, archived: false },
    { id: 'foraged', label: 'Foraged', value: 'foraged', sortOrder: 4, archived: false },
    { id: 'organic', label: 'Organic', value: 'organic', sortOrder: 5, archived: false },
    { id: 'biodynamic', label: 'Biodynamic', value: 'biodynamic', sortOrder: 6, archived: false },
    { id: 'fair-trade', label: 'Fair Trade', value: 'fair-trade', sortOrder: 7, archived: false },
    { id: 'wild', label: 'Wild', value: 'wild', sortOrder: 8, archived: false },
    { id: 'heritage-variety', label: 'Heritage Variety', value: 'heritage-variety', sortOrder: 9, archived: false },
    { id: 'animal-derived', label: 'Animal-Derived', value: 'animal-derived', sortOrder: 10, archived: false },
    { id: 'vegan', label: 'Vegan', value: 'vegan', sortOrder: 11, archived: false },
    { id: 'vegetarian', label: 'Vegetarian', value: 'vegetarian', sortOrder: 12, archived: false },
  ],
  ingredientUsedAs: [
    { id: 'base', label: 'Base', value: 'base', sortOrder: 1, archived: false },
    { id: 'accent', label: 'Accent', value: 'accent', sortOrder: 2, archived: false },
    { id: 'infusion', label: 'Infusion', value: 'infusion', sortOrder: 3, archived: false },
    { id: 'garnish', label: 'Garnish', value: 'garnish', sortOrder: 4, archived: false },
    { id: 'swirl', label: 'Swirl', value: 'swirl', sortOrder: 5, archived: false },
    { id: 'mix-in', label: 'Mix-in', value: 'mix-in', sortOrder: 6, archived: false },
    { id: 'topping', label: 'Topping', value: 'topping', sortOrder: 7, archived: false },
    { id: 'coating', label: 'Coating', value: 'coating', sortOrder: 8, archived: false },
    { id: 'filling', label: 'Filling', value: 'filling', sortOrder: 9, archived: false },
    { id: 'pairing', label: 'Pairing', value: 'pairing', sortOrder: 10, archived: false },
  ],
  storyCategories: [
    { id: 'the-lab', label: 'The Lab', value: 'the-lab', description: 'Behind-the-scenes development and experimentation', sortOrder: 1, archived: false },
    { id: 'flavour-notes', label: 'Flavour Notes', value: 'flavour-notes', description: 'Deep dives into flavour profiles and tasting', sortOrder: 2, archived: false },
    { id: 'core-idea', label: 'Core Idea', value: 'core-idea', description: 'The concept or inspiration behind a flavour', sortOrder: 3, archived: false },
    { id: 'origin-story', label: 'Origin Story', value: 'origin-story', description: 'Where an ingredient or idea comes from', sortOrder: 4, archived: false },
    { id: 'process', label: 'Process', value: 'process', description: 'How something is made', sortOrder: 5, archived: false },
  ],
  storyTags: [
    { id: 'seasonal', label: 'Seasonal', value: 'seasonal', sortOrder: 1, archived: false },
    { id: 'local', label: 'Local', value: 'local', sortOrder: 2, archived: false },
    { id: 'collaboration', label: 'Collaboration', value: 'collaboration', sortOrder: 3, archived: false },
    { id: 'technique', label: 'Technique', value: 'technique', sortOrder: 4, archived: false },
    { id: 'ingredient-focus', label: 'Ingredient Focus', value: 'ingredient-focus', sortOrder: 5, archived: false },
    { id: 'place', label: 'Place', value: 'place', sortOrder: 6, archived: false },
    { id: 'theme', label: 'Theme', value: 'theme', sortOrder: 7, archived: false },
  ],
}

export async function getTaxonomyValues(category) {
  const taxonomies = await getTaxonomies()
  const stored = taxonomies[category]
  if (stored && stored.length > 0) {
    return stored
  }
  // Only fall back to defaults if the category is completely absent
  const defaults = TAXONOMY_DEFAULTS[category]
  if (defaults) {
    taxonomies[category] = defaults
    await saveTaxonomies(taxonomies)
    return defaults
  }
  return []
}

export async function addTaxonomyValue(category, value) {
  const taxonomies = await getTaxonomies()
  if (!taxonomies[category]) {
    taxonomies[category] = TAXONOMY_DEFAULTS[category] ? [...TAXONOMY_DEFAULTS[category]] : []
  }
  const newValue = {
    id: value.id || value.value,
    label: value.label,
    value: value.value,
    sortOrder: value.sortOrder || taxonomies[category].length + 1,
    archived: value.archived || false,
  }
  taxonomies[category].push(newValue)
  await saveTaxonomies(taxonomies)
  return newValue
}

export async function updateTaxonomyValue(category, id, updates) {
  const taxonomies = await getTaxonomies()
  if (!taxonomies[category]) {
    throw new Error(`Taxonomy category ${category} not found`)
  }
  const index = taxonomies[category].findIndex(item => item.id === id)
  if (index === -1) {
    throw new Error(`Taxonomy value ${id} not found in category ${category}`)
  }
  taxonomies[category][index] = { ...taxonomies[category][index], ...updates }
  await saveTaxonomies(taxonomies)
  return taxonomies[category][index]
}

export async function deleteTaxonomyValue(category, id) {
  const taxonomies = await getTaxonomies()
  if (!taxonomies[category]) {
    throw new Error(`Taxonomy category ${category} not found`)
  }
  const index = taxonomies[category].findIndex(item => item.id === id)
  if (index === -1) {
    throw new Error(`Taxonomy value ${id} not found in category ${category}`)
  }
  taxonomies[category].splice(index, 1)
  await saveTaxonomies(taxonomies)
  return true
}

// Requests (traiteur + gateaux signatures contact forms)
export async function getRequests() {
  return getData('requests')
}

export async function saveRequests(requests) {
  return saveData('requests', requests)
}
