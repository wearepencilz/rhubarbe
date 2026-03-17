import type { Flavour, FlavourType, Status, BaseStyle, FlavourIngredient } from '@/types';

export type FlavourSeed = {
  id: string;
  name: string;
  slug: string;
  type: "Gelato" | "Sorbet" | "Special";
  status: "Active" | "Archived" | "Upcoming" | "Draft";
  description?: string;
  shortDescription?: string;
  ingredientIds: string[];
  primaryIngredientIds: string[];
  optionalIngredientIds?: string[];
  defaultOfferingFormats: string[];
  canBeTwist: boolean;
  canBePint: boolean;
  canBeSandwich: boolean;
  canBeTasting: boolean;
  dietaryNotes?: string[];
  archiveNotes?: string;
  tags?: string[];
  isActive: boolean;
};

export const flavoursSeed: FlavourSeed[] = [
  {
    id: "grilled-corn",
    name: "Grilled Corn",
    slug: "grilled-corn",
    type: "Gelato",
    status: "Archived",
    description:
      "A sweet, savoury gelato built around grilled corn, browned butter, and honey.",
    shortDescription: "Browned butter, grilled corn, honey.",
    ingredientIds: ["milk", "cream", "grilled-corn", "browned-butter", "honey"],
    primaryIngredientIds: ["grilled-corn"],
    defaultOfferingFormats: ["Soft Serve", "Twist", "Pint", "Tasting"],
    canBeTwist: true,
    canBePint: true,
    canBeSandwich: false,
    canBeTasting: true,
    dietaryNotes: ["Contains dairy"],
    archiveNotes: "Served alongside Wild Tomatoes.",
    tags: ["Seasonal", "Smoky", "Sweet", "Summer"],
    isActive: true,
  },
  {
    id: "wild-tomatoes",
    name: "Wild Tomatoes",
    slug: "wild-tomatoes",
    type: "Sorbet",
    status: "Archived",
    description:
      "A bright, savoury-leaning sorbet built from garden tomato mix and white peaches.",
    shortDescription: "Tomato, peach.",
    ingredientIds: ["garden-tomato-mix", "white-peaches", "himalayan-sea-salt"],
    primaryIngredientIds: ["garden-tomato-mix"],
    defaultOfferingFormats: ["Soft Serve", "Twist", "Pint", "Tasting"],
    canBeTwist: true,
    canBePint: true,
    canBeSandwich: false,
    canBeTasting: true,
    dietaryNotes: ["Dairy-free"],
    archiveNotes: "Served alongside Grilled Corn.",
    tags: ["Seasonal", "Garden", "Bright", "Summer"],
    isActive: true,
  },
  {
    id: "basil-lemon",
    name: "Basil Lemon",
    slug: "basil-lemon",
    type: "Gelato",
    status: "Archived",
    description:
      "A fresh herbal gelato combining basil and lemon over a creamy dairy base.",
    shortDescription: "Basil, lemon.",
    ingredientIds: ["milk", "cream", "basil", "lemon"],
    primaryIngredientIds: ["basil", "lemon"],
    defaultOfferingFormats: ["Soft Serve", "Twist", "Pint", "Sandwich", "Tasting"],
    canBeTwist: true,
    canBePint: true,
    canBeSandwich: true,
    canBeTasting: true,
    dietaryNotes: ["Contains dairy"],
    archiveNotes: "Served alongside Raspberry.",
    tags: ["Herbal", "Citrus", "Fresh", "Summer"],
    isActive: true,
  },
  {
    id: "raspberry",
    name: "Raspberry",
    slug: "raspberry",
    type: "Sorbet",
    status: "Archived",
    description: "A sharp, vivid raspberry sorbet.",
    shortDescription: "Raspberry.",
    ingredientIds: ["raspberries", "himalayan-sea-salt"],
    primaryIngredientIds: ["raspberries"],
    defaultOfferingFormats: ["Soft Serve", "Twist", "Pint", "Tasting"],
    canBeTwist: true,
    canBePint: true,
    canBeSandwich: false,
    canBeTasting: true,
    dietaryNotes: ["Dairy-free"],
    archiveNotes: "Served alongside Basil Lemon.",
    tags: ["Berry", "Bright", "Acidic", "Summer"],
    isActive: true,
  },
  {
    id: "mint-lime",
    name: "Mint Lime",
    slug: "mint-lime",
    type: "Gelato",
    status: "Archived",
    description:
      "A cooling gelato with mint and lime over a creamy dairy base.",
    shortDescription: "Mint, lime.",
    ingredientIds: ["milk", "cream", "mint", "lime"],
    primaryIngredientIds: ["mint", "lime"],
    optionalIngredientIds: ["tajin"],
    defaultOfferingFormats: ["Soft Serve", "Twist", "Pint", "Tasting"],
    canBeTwist: true,
    canBePint: true,
    canBeSandwich: false,
    canBeTasting: true,
    dietaryNotes: ["Contains dairy"],
    archiveNotes: "Optional Tajín topping. Served alongside Melon.",
    tags: ["Cooling", "Citrus", "Fresh", "Summer"],
    isActive: true,
  },
  {
    id: "melon",
    name: "Melon",
    slug: "melon",
    type: "Sorbet",
    status: "Archived",
    description:
      "A clean, juicy melon sorbet built from red and yellow watermelon.",
    shortDescription: "Watermelon, white melon.",
    ingredientIds: ["red-watermelon", "yellow-watermelon", "himalayan-sea-salt"],
    primaryIngredientIds: ["red-watermelon", "yellow-watermelon"],
    optionalIngredientIds: ["tajin"],
    defaultOfferingFormats: ["Soft Serve", "Twist", "Pint", "Tasting"],
    canBeTwist: true,
    canBePint: true,
    canBeSandwich: false,
    canBeTasting: true,
    dietaryNotes: ["Dairy-free"],
    archiveNotes: "Optional Tajín topping. Served alongside Mint Lime.",
    tags: ["Melon", "Juicy", "Fresh", "Summer"],
    isActive: true,
  },
  {
    id: "spruce-tip",
    name: "Spruce Tip",
    slug: "spruce-tip",
    type: "Gelato",
    status: "Archived",
    description:
      "A resinous, foresty gelato built around spruce tip and a creamy dairy base.",
    shortDescription: "Spruce tip.",
    ingredientIds: ["milk", "cream", "spruce-tip"],
    primaryIngredientIds: ["spruce-tip"],
    defaultOfferingFormats: ["Soft Serve", "Twist", "Pint", "Tasting"],
    canBeTwist: true,
    canBePint: true,
    canBeSandwich: false,
    canBeTasting: true,
    dietaryNotes: ["Contains dairy"],
    archiveNotes: "Served alongside Wild Blueberry.",
    tags: ["Foraged", "Botanical", "Forest", "Summer"],
    isActive: true,
  },
  {
    id: "wild-blueberry",
    name: "Wild Blueberry",
    slug: "wild-blueberry",
    type: "Sorbet",
    status: "Archived",
    description: "A deeply flavoured wild blueberry sorbet.",
    shortDescription: "Wild blueberry.",
    ingredientIds: ["wild-strawberry-quebec", "himalayan-sea-salt"],
    primaryIngredientIds: ["wild-strawberry-quebec"],
    defaultOfferingFormats: ["Soft Serve", "Twist", "Pint", "Tasting"],
    canBeTwist: true,
    canBePint: true,
    canBeSandwich: false,
    canBeTasting: true,
    dietaryNotes: ["Dairy-free"],
    archiveNotes: "Served alongside Spruce Tip.",
    tags: ["Wild", "Berry", "Local", "Summer"],
    isActive: true,
  },
  {
    id: "vanilla",
    name: "Vanilla",
    slug: "vanilla",
    type: "Gelato",
    status: "Archived",
    description:
      "A classic Madagascar Bourbon vanilla gelato with a rich dairy base.",
    shortDescription: "Madagascar Bourbon vanilla.",
    ingredientIds: ["milk", "cream", "madagascar-bourbon-vanilla"],
    primaryIngredientIds: ["madagascar-bourbon-vanilla"],
    defaultOfferingFormats: ["Soft Serve", "Twist", "Pint", "Sandwich", "Tasting"],
    canBeTwist: true,
    canBePint: true,
    canBeSandwich: true,
    canBeTasting: true,
    dietaryNotes: ["Contains dairy"],
    archiveNotes: "Served alongside Strawberry Thyme.",
    tags: ["Classic", "Warm", "Creamy"],
    isActive: true,
  },
  {
    id: "strawberry-thyme",
    name: "Strawberry Thyme",
    slug: "strawberry-thyme",
    type: "Sorbet",
    status: "Archived",
    description:
      "A strawberry sorbet sharpened and lifted with fresh thyme.",
    shortDescription: "Strawberry, thyme.",
    ingredientIds: ["ile-dorleans-strawberries", "thyme", "himalayan-sea-salt"],
    primaryIngredientIds: ["ile-dorleans-strawberries", "thyme"],
    defaultOfferingFormats: ["Soft Serve", "Twist", "Pint", "Tasting"],
    canBeTwist: true,
    canBePint: true,
    canBeSandwich: false,
    canBeTasting: true,
    dietaryNotes: ["Dairy-free"],
    archiveNotes: "Served alongside Vanilla.",
    tags: ["Local", "Berry", "Herbal", "Summer"],
    isActive: true,
  },
];

/**
 * Transform seed data to full Flavour format
 */
export function transformSeedToFlavour(seed: FlavourSeed): Flavour {
  const now = new Date().toISOString();
  
  // Map seed type to system type (lowercase)
  const type: FlavourType = seed.type.toLowerCase() as FlavourType;
  
  // Map seed status to system status (lowercase)
  const status: Status = seed.status.toLowerCase() as Status;
  
  // Determine base style from type
  const baseStyle: BaseStyle = type === 'sorbet' ? 'fruit' : 'dairy';
  
  // Transform ingredient IDs to FlavourIngredient format
  const ingredients: FlavourIngredient[] = seed.ingredientIds.map((id, index) => ({
    ingredientId: id,
    displayOrder: index,
    notes: seed.optionalIngredientIds?.includes(id) ? 'Optional' : undefined,
  }));
  
  // Extract key notes from tags (lowercase for consistency)
  const keyNotes = (seed.tags || []).map(tag => tag.toLowerCase());
  
  // Determine color based on flavour name/type (simple heuristic)
  const colour = getColourForFlavour(seed.name, type);
  
  return {
    id: seed.id,
    name: seed.name,
    slug: seed.slug,
    type,
    baseStyle,
    description: seed.description || '',
    shortDescription: seed.shortDescription || '',
    story: seed.archiveNotes,
    tastingNotes: seed.shortDescription,
    ingredients,
    keyNotes,
    
    // Allergens & dietary (empty for now, should be calculated from ingredients)
    allergens: [],
    dietaryClaims: [],
    
    // Display
    colour,
    image: undefined,
    
    // Availability
    season: seed.tags?.includes('Summer') ? 'Summer' : undefined,
    status,
    
    // Format eligibility
    canBeUsedInTwist: seed.canBeTwist,
    canBeSoldAsPint: seed.canBePint,
    canBeUsedInSandwich: seed.canBeSandwich,
    
    // Admin
    sortOrder: 0,
    featured: false,
    
    // Shopify (not linked initially)
    syncStatus: 'not_linked',
    
    // Timestamps
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Simple color mapping based on flavour characteristics
 */
function getColourForFlavour(name: string, type: FlavourType): string {
  const nameLower = name.toLowerCase();
  
  // Specific flavour colors
  if (nameLower.includes('vanilla')) return '#F5E6D3';
  if (nameLower.includes('strawberry')) return '#FF6B9D';
  if (nameLower.includes('raspberry')) return '#E30B5C';
  if (nameLower.includes('blueberry')) return '#4A5899';
  if (nameLower.includes('lemon')) return '#FFF44F';
  if (nameLower.includes('lime')) return '#C7EA46';
  if (nameLower.includes('mint')) return '#98FF98';
  if (nameLower.includes('basil')) return '#7CB342';
  if (nameLower.includes('corn')) return '#FFD54F';
  if (nameLower.includes('tomato')) return '#FF6347';
  if (nameLower.includes('melon') || nameLower.includes('watermelon')) return '#FF6B9D';
  if (nameLower.includes('spruce')) return '#4A7C59';
  
  // Default colors by type
  if (type === 'sorbet') return '#FFB6C1';
  if (type === 'gelato') return '#FFF8DC';
  
  return '#FFFFFF';
}
