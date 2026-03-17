/**
 * Seed Import Script
 * 
 * Adapts legacy seed data structure to current CMS schema.
 * Maps old field names to new CMS fields without changing UI.
 * 
 * Usage: npx tsx scripts/seed-import.ts
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import type { 
  Ingredient, 
  Flavour, 
  Format, 
  FlavourIngredient 
} from '../types/index.js';

// ============================================================================
// Legacy Type Definitions (from seed file)
// ============================================================================

type ItemCategory =
  | "Soft Serve"
  | "Twist"
  | "Pint"
  | "Sandwich"
  | "Tasting"
  | "Topping"
  | "Combo"
  | "Retail";

type FormatType =
  | "Single Flavour"
  | "Dual Flavour"
  | "Packaged"
  | "Composed"
  | "Add-on"
  | "Bundle";

type FlavourType = "Gelato" | "Sorbet" | "Special";

type IngredientCategory =
  | "Dairy"
  | "Fruit"
  | "Vegetable"
  | "Herb"
  | "Spice"
  | "Aromatic"
  | "Nut"
  | "Seed"
  | "Grain"
  | "Sweetener"
  | "Salt"
  | "Fat"
  | "Liquid"
  | "Chocolate / Cocoa"
  | "Coffee / Tea"
  | "Fermented"
  | "Savoury"
  | "Condiment"
  | "Baked Good"
  | "Preserve"
  | "Sauce"
  | "Confection"
  | "Alcohol"
  | "Botanical"
  | "Regional Specialty"
  | "Other";

type IngredientRole =
  | "Base"
  | "Primary Flavour"
  | "Supporting Flavour"
  | "Sweetener"
  | "Mix-in"
  | "Inclusion"
  | "Swirl"
  | "Sauce"
  | "Topping"
  | "Garnish"
  | "Coating"
  | "Filling"
  | "Pairing"
  | "Optional Add-on"
  | "Combo Component"
  | "Retail Component"
  | "Other";

interface LegacyIngredient {
  id: string;
  name: string;
  slug: string;
  category: IngredientCategory;
  roles: IngredientRole[];
  tags?: string[];
  origin?: string;
  notes?: string;
  isActive: boolean;
}

interface LegacyFlavour {
  id: string;
  name: string;
  slug: string;
  type: FlavourType;
  description: string;
  shortDescription?: string;
  ingredientIds: string[];
  primaryIngredientIds: string[];
  optionalAddOnIngredientIds?: string[];
  defaultFormatIds: string[];
  canBeTwist: boolean;
  canBePint: boolean;
  canBeSandwich: boolean;
  canBeTasting: boolean;
  isActive: boolean;
  tags?: string[];
}

interface LegacyFormat {
  id: string;
  name: string;
  slug: string;
  itemCategory: ItemCategory;
  formatType: FormatType;
  description: string;
  minFlavours: number;
  maxFlavours: number;
  allowsOptionalAddOns: boolean;
  isPackaged: boolean;
  isActive: boolean;
}

// ============================================================================
// Mapping Functions
// ============================================================================

function mapIngredient(legacy: LegacyIngredient): Ingredient {
  const now = new Date().toISOString();
  
  return {
    id: legacy.id,
    name: legacy.name,
    latinName: undefined,
    category: legacy.category,
    roles: legacy.roles as any,
    descriptors: (legacy.tags || []) as any[],
    origin: legacy.origin || 'Unknown',
    allergens: inferAllergens(legacy),
    seasonal: legacy.tags?.includes('Seasonal') || false,
    image: undefined,
    description: legacy.notes,
    createdAt: now,
    updatedAt: now,
  } as Ingredient;
}

function mapFlavour(legacy: LegacyFlavour, ingredients: Ingredient[]): Flavour {
  const now = new Date().toISOString();
  
  // Build ingredient relationships
  const flavourIngredients: FlavourIngredient[] = legacy.ingredientIds.map((id, index) => ({
    ingredientId: id,
    displayOrder: index,
    quantity: undefined,
    notes: undefined,
  }));
  
  // Calculate allergens from ingredients
  const allergens = new Set<string>();
  
  legacy.ingredientIds.forEach(id => {
    const ing = ingredients.find(i => i.id === id);
    if (ing) {
      ing.allergens.forEach(a => allergens.add(a));
    }
  });
  
  return {
    id: legacy.id,
    name: legacy.name,
    slug: legacy.slug,
    type: legacy.type.toLowerCase() as any,
    baseStyle: inferBaseStyle(legacy.type),
    description: legacy.description,
    shortDescription: legacy.shortDescription || legacy.description,
    story: undefined,
    tastingNotes: undefined,
    ingredients: flavourIngredients,
    keyNotes: legacy.tags || [],
    allergens: Array.from(allergens) as any[],
    dietaryClaims: [],
    colour: '#FFFFFF',
    image: undefined,
    season: inferSeason(legacy.tags),
    status: legacy.isActive ? 'active' : 'archived',
    canBeUsedInTwist: legacy.canBeTwist,
    canBeSoldAsPint: legacy.canBePint,
    canBeUsedInSandwich: legacy.canBeSandwich,
    shopifyProductId: undefined,
    shopifyProductHandle: undefined,
    syncStatus: 'not_linked',
    sortOrder: 0,
    featured: false,
    createdAt: now,
    updatedAt: now,
  } as Flavour;
}

function mapFormat(legacy: LegacyFormat): Format {
  const now = new Date().toISOString();
  
  return {
    id: legacy.id,
    name: legacy.name,
    slug: legacy.slug,
    category: inferFormatCategory(legacy.itemCategory),
    description: legacy.description,
    requiresFlavours: legacy.minFlavours > 0,
    minFlavours: legacy.minFlavours,
    maxFlavours: legacy.maxFlavours,
    allowMixedTypes: legacy.itemCategory === 'Twist',
    canIncludeAddOns: legacy.allowsOptionalAddOns,
    defaultSizes: ['regular'],
    servingStyles: [inferServingStyle(legacy)].filter(Boolean),
    createdAt: now,
    updatedAt: now,
  } as Format;
}

// ============================================================================
// Helper Functions
// ============================================================================

function inferAllergens(ingredient: LegacyIngredient): any[] {
  const allergens: any[] = [];
  const name = ingredient.name.toLowerCase();
  const category = ingredient.category.toLowerCase();
  
  if (category.includes('dairy') || name.includes('milk') || name.includes('cream')) {
    allergens.push('dairy');
  }
  if (category.includes('egg')) {
    allergens.push('eggs');
  }
  if (category.includes('nut') || name.includes('nut')) {
    allergens.push('nuts');
  }
  if (name.includes('soy')) {
    allergens.push('soy');
  }
  if (category.includes('grain') && !name.includes('rice')) {
    allergens.push('gluten');
  }
  if (name.includes('sesame')) {
    allergens.push('sesame');
  }
  
  return allergens;
}

function inferDietaryFlags(ingredient: LegacyIngredient): any[] {
  const flags: any[] = [];
  const allergens = inferAllergens(ingredient);
  
  if (!allergens.includes('dairy')) {
    flags.push('dairy-free');
  }
  if (!allergens.includes('gluten')) {
    flags.push('gluten-free');
  }
  if (!allergens.includes('nuts')) {
    flags.push('nut-free');
  }
  
  const category = ingredient.category.toLowerCase();
  if (!category.includes('dairy') && !category.includes('egg') && 
      !allergens.includes('dairy') && !allergens.includes('eggs')) {
    flags.push('vegan');
  }
  
  if (!allergens.includes('dairy') && !allergens.includes('eggs')) {
    flags.push('vegetarian');
  }
  
  return flags;
}

function inferBaseStyle(type: FlavourType): any {
  switch (type) {
    case 'Gelato':
      return 'dairy';
    case 'Sorbet':
      return 'fruit';
    case 'Special':
      return 'other';
    default:
      return 'dairy';
  }
}

function inferSeason(tags?: string[]): string | undefined {
  if (!tags) return undefined;
  
  const seasonTags = ['Spring', 'Summer', 'Fall', 'Autumn', 'Winter'];
  const found = tags.find(tag => seasonTags.some(s => tag.includes(s)));
  return found;
}

function inferFormatCategory(itemCategory: ItemCategory): any {
  switch (itemCategory) {
    case 'Soft Serve':
    case 'Twist':
    case 'Pint':
      return 'frozen';
    case 'Sandwich':
    case 'Tasting':
      return 'food';
    case 'Combo':
      return 'bundle';
    case 'Topping':
    case 'Retail':
      return 'frozen';
    default:
      return 'frozen';
  }
}

function inferServingStyle(format: LegacyFormat): any {
  if (format.isPackaged) return 'packaged';
  if (format.itemCategory === 'Soft Serve' || format.itemCategory === 'Twist') {
    return 'soft-serve';
  }
  if (format.itemCategory === 'Tasting') return 'plated';
  return 'scoop';
}

// ============================================================================
// Seed Data (paste your seed data here)
// ============================================================================

const legacyIngredients: LegacyIngredient[] = [
  {
    id: "milk",
    name: "Milk",
    slug: "milk",
    category: "Dairy",
    roles: ["Base"],
    tags: ["Creamy", "Core base"],
    isActive: true,
  },
  {
    id: "cream",
    name: "Cream",
    slug: "cream",
    category: "Dairy",
    roles: ["Base"],
    tags: ["Creamy", "Rich", "Core base"],
    isActive: true,
  },
  {
    id: "browned-butter",
    name: "Browned Butter",
    slug: "browned-butter",
    category: "Fat",
    roles: ["Supporting Flavour"],
    tags: ["Browned", "Nutty", "Rich"],
    isActive: true,
  },
  {
    id: "garden-tomato-mix",
    name: "Garden Tomato Mix",
    slug: "garden-tomato-mix",
    category: "Vegetable",
    roles: ["Base", "Primary Flavour"],
    tags: ["Fresh", "Seasonal", "Garden", "Savoury"],
    isActive: true,
  },
  {
    id: "white-peaches",
    name: "White Peaches",
    slug: "white-peaches",
    category: "Fruit",
    roles: ["Base", "Primary Flavour"],
    tags: ["Fresh", "Seasonal"],
    isActive: true,
  },
  {
    id: "ile-dorleans-strawberries",
    name: "L'Île-d'Orléans Strawberries",
    slug: "ile-dorleans-strawberries",
    category: "Fruit",
    roles: ["Base", "Primary Flavour"],
    tags: ["Local", "Seasonal"],
    origin: "L'Île-d'Orléans, Québec",
    isActive: true,
  },
  {
    id: "wild-strawberry-quebec",
    name: "Wild Strawberry Québec",
    slug: "wild-strawberry-quebec",
    category: "Fruit",
    roles: ["Base", "Primary Flavour"],
    tags: ["Wild", "Local"],
    origin: "Québec",
    isActive: true,
  },
  {
    id: "wild-blueberry",
    name: "Wild Blueberry",
    slug: "wild-blueberry",
    category: "Fruit",
    roles: ["Base", "Primary Flavour"],
    tags: ["Wild", "Local"],
    origin: "Québec",
    isActive: true,
  },
  {
    id: "red-watermelon",
    name: "Red Watermelon",
    slug: "red-watermelon",
    category: "Fruit",
    roles: ["Base", "Primary Flavour"],
    tags: ["Fresh", "Seasonal"],
    isActive: true,
  },
  {
    id: "yellow-watermelon",
    name: "Yellow Watermelon",
    slug: "yellow-watermelon",
    category: "Fruit",
    roles: ["Base", "Primary Flavour"],
    tags: ["Fresh", "Seasonal"],
    isActive: true,
  },
  {
    id: "white-melon",
    name: "White Melon",
    slug: "white-melon",
    category: "Fruit",
    roles: ["Base", "Primary Flavour"],
    tags: ["Fresh", "Seasonal"],
    isActive: true,
  },
  {
    id: "lime",
    name: "Lime",
    slug: "lime",
    category: "Fruit",
    roles: ["Supporting Flavour"],
    tags: ["Citrus", "Acidic", "Fresh"],
    isActive: true,
  },
  {
    id: "lemon",
    name: "Lemon",
    slug: "lemon",
    category: "Fruit",
    roles: ["Supporting Flavour"],
    tags: ["Citrus", "Acidic", "Fresh"],
    isActive: true,
  },
  {
    id: "raspberries",
    name: "Raspberries",
    slug: "raspberries",
    category: "Fruit",
    roles: ["Base", "Primary Flavour"],
    tags: ["Fresh", "Seasonal", "Acidic"],
    isActive: true,
  },
  {
    id: "grilled-corn",
    name: "Grilled Corn",
    slug: "grilled-corn",
    category: "Grain",
    roles: ["Base", "Primary Flavour"],
    tags: ["Grilled", "Sweet", "Smoky", "Seasonal"],
    isActive: true,
  },
  {
    id: "thyme",
    name: "Thyme",
    slug: "thyme",
    category: "Herb",
    roles: ["Supporting Flavour", "Garnish"],
    tags: ["Herbal", "Fresh"],
    isActive: true,
  },
  {
    id: "madagascar-bourbon-vanilla",
    name: "Madagascar Bourbon Vanilla",
    slug: "madagascar-bourbon-vanilla",
    category: "Aromatic",
    roles: ["Primary Flavour", "Supporting Flavour"],
    tags: ["Warm", "Floral"],
    origin: "Madagascar",
    isActive: true,
  },
  {
    id: "spruce-tip",
    name: "Spruce Tip",
    slug: "spruce-tip",
    category: "Botanical",
    roles: ["Primary Flavour", "Supporting Flavour"],
    tags: ["Foraged", "Wild"],
    isActive: true,
  },
  {
    id: "mint",
    name: "Mint",
    slug: "mint",
    category: "Herb",
    roles: ["Primary Flavour", "Supporting Flavour", "Garnish"],
    tags: ["Fresh", "Herbal"],
    isActive: true,
  },
  {
    id: "basil",
    name: "Basil",
    slug: "basil",
    category: "Herb",
    roles: ["Primary Flavour", "Supporting Flavour", "Garnish"],
    tags: ["Fresh", "Herbal"],
    isActive: true,
  },
  {
    id: "honey",
    name: "Honey",
    slug: "honey",
    category: "Sweetener",
    roles: ["Sweetener", "Supporting Flavour"],
    tags: ["Sweet", "Floral"],
    isActive: true,
  },
  {
    id: "sun-dried-mole",
    name: "Sun-Dried Mole",
    slug: "sun-dried-mole",
    category: "Sauce",
    roles: ["Topping", "Garnish", "Optional Add-on"],
    tags: ["Savoury", "Spicy"],
    isActive: true,
  },
  {
    id: "himalayan-sea-salt",
    name: "Himalayan Sea Salt",
    slug: "himalayan-sea-salt",
    category: "Salt",
    roles: ["Supporting Flavour", "Garnish"],
    tags: ["Mineral", "Salty"],
    isActive: true,
  },
  {
    id: "tajin",
    name: "Tajín",
    slug: "tajin",
    category: "Condiment",
    roles: ["Topping", "Garnish", "Optional Add-on"],
    tags: ["Spicy", "Acidic", "Salty"],
    isActive: true,
  },
];

const legacyFormats: LegacyFormat[] = [
  {
    id: "soft-serve-single",
    name: "Soft Serve",
    slug: "soft-serve",
    itemCategory: "Soft Serve",
    formatType: "Single Flavour",
    description: "A single-flavour soft serve product.",
    minFlavours: 1,
    maxFlavours: 1,
    allowsOptionalAddOns: true,
    isPackaged: false,
    isActive: true,
  },
  {
    id: "twist",
    name: "Twist",
    slug: "twist",
    itemCategory: "Twist",
    formatType: "Dual Flavour",
    description: "A two-flavour twist product.",
    minFlavours: 2,
    maxFlavours: 2,
    allowsOptionalAddOns: true,
    isPackaged: false,
    isActive: true,
  },
  {
    id: "pint",
    name: "Pint",
    slug: "pint",
    itemCategory: "Pint",
    formatType: "Packaged",
    description: "A packaged pint product, usually one flavour.",
    minFlavours: 1,
    maxFlavours: 2,
    allowsOptionalAddOns: false,
    isPackaged: true,
    isActive: true,
  },
  {
    id: "sandwich",
    name: "Ice Cream Sandwich",
    slug: "ice-cream-sandwich",
    itemCategory: "Sandwich",
    formatType: "Composed",
    description: "A composed sandwich format using one flavour and baked components.",
    minFlavours: 1,
    maxFlavours: 1,
    allowsOptionalAddOns: false,
    isPackaged: false,
    isActive: true,
  },
  {
    id: "tasting",
    name: "Tasting",
    slug: "tasting",
    itemCategory: "Tasting",
    formatType: "Composed",
    description: "A tasting portion or curated pairing.",
    minFlavours: 1,
    maxFlavours: 3,
    allowsOptionalAddOns: true,
    isPackaged: false,
    isActive: true,
  },
];

const legacyFlavours: LegacyFlavour[] = [
  {
    id: "grilled-corn",
    name: "Grilled Corn",
    slug: "grilled-corn",
    type: "Gelato",
    description: "A gelato built around grilled corn, browned butter, and honey.",
    shortDescription: "Browned butter, grilled corn, honey.",
    ingredientIds: ["milk", "cream", "grilled-corn", "browned-butter", "honey"],
    primaryIngredientIds: ["grilled-corn"],
    optionalAddOnIngredientIds: ["sun-dried-mole"],
    defaultFormatIds: ["soft-serve-single", "twist", "pint", "tasting"],
    canBeTwist: true,
    canBePint: true,
    canBeSandwich: false,
    canBeTasting: true,
    isActive: true,
    tags: ["Seasonal", "Summer", "Smoky", "Sweet"],
  },
  {
    id: "wild-tomatoes",
    name: "Wild Tomatoes",
    slug: "wild-tomatoes",
    type: "Sorbet",
    description: "A bright tomato and white peach sorbet.",
    shortDescription: "Tomato, peach.",
    ingredientIds: ["garden-tomato-mix", "white-peaches", "himalayan-sea-salt"],
    primaryIngredientIds: ["garden-tomato-mix", "white-peaches"],
    optionalAddOnIngredientIds: ["sun-dried-mole"],
    defaultFormatIds: ["soft-serve-single", "twist", "pint", "tasting"],
    canBeTwist: true,
    canBePint: true,
    canBeSandwich: false,
    canBeTasting: true,
    isActive: true,
    tags: ["Garden", "Bright", "Seasonal", "Summer"],
  },
  {
    id: "basil-lemon",
    name: "Basil Lemon",
    slug: "basil-lemon",
    type: "Gelato",
    description: "A fresh basil and lemon gelato over a creamy dairy base.",
    shortDescription: "Basil, lemon.",
    ingredientIds: ["milk", "cream", "basil", "lemon"],
    primaryIngredientIds: ["basil", "lemon"],
    defaultFormatIds: ["soft-serve-single", "twist", "pint", "sandwich", "tasting"],
    canBeTwist: true,
    canBePint: true,
    canBeSandwich: true,
    canBeTasting: true,
    isActive: true,
    tags: ["Herbal", "Fresh", "Citrus", "Summer"],
  },
  {
    id: "raspberry",
    name: "Raspberry",
    slug: "raspberry",
    type: "Sorbet",
    description: "A vivid raspberry sorbet.",
    shortDescription: "Raspberry.",
    ingredientIds: ["raspberries", "himalayan-sea-salt"],
    primaryIngredientIds: ["raspberries"],
    defaultFormatIds: ["soft-serve-single", "twist", "pint", "tasting"],
    canBeTwist: true,
    canBePint: true,
    canBeSandwich: false,
    canBeTasting: true,
    isActive: true,
    tags: ["Berry", "Bright", "Acidic", "Summer"],
  },
];

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log('🌱 Starting seed import...\n');
  
  // Map ingredients
  console.log('📦 Mapping ingredients...');
  const ingredients = legacyIngredients.map(mapIngredient);
  console.log(`✓ Mapped ${ingredients.length} ingredients\n`);
  
  // Map formats
  console.log('📋 Mapping formats...');
  const formats = legacyFormats.map(mapFormat);
  console.log(`✓ Mapped ${formats.length} formats\n`);
  
  // Map flavours (requires ingredients for allergen calculation)
  console.log('🍦 Mapping flavours...');
  const flavours = legacyFlavours.map(f => mapFlavour(f, ingredients));
  console.log(`✓ Mapped ${flavours.length} flavours\n`);
  
  // Write to JSON files
  const dataDir = join(process.cwd(), 'public', 'data');
  
  console.log('💾 Writing data files...');
  writeFileSync(
    join(dataDir, 'ingredients.json'),
    JSON.stringify(ingredients, null, 2)
  );
  console.log('✓ Written ingredients.json');
  
  writeFileSync(
    join(dataDir, 'formats.json'),
    JSON.stringify(formats, null, 2)
  );
  console.log('✓ Written formats.json');
  
  writeFileSync(
    join(dataDir, 'flavours.json'),
    JSON.stringify(flavours, null, 2)
  );
  console.log('✓ Written flavours.json');
  
  console.log('\n✅ Seed import complete!');
  console.log('\nSummary:');
  console.log(`  - ${ingredients.length} ingredients`);
  console.log(`  - ${formats.length} formats`);
  console.log(`  - ${flavours.length} flavours`);
  console.log('\nYou can now start the dev server and view the data in the CMS.');
}

main().catch(console.error);
