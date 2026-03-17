import type { Ingredient, IngredientCategory, IngredientRole } from '@/types';

export type IngredientSeed = {
  id: string;
  name: string;
  slug: string;
  category: IngredientCategory;
  roles: IngredientRole[];
  tags?: string[];
  origin?: string;
  notes?: string;
  isActive: boolean;
};

export const ingredientsSeed: IngredientSeed[] = [
  {
    id: "milk",
    name: "Milk",
    slug: "milk",
    category: "Dairy",
    roles: ["Base"],
    tags: ["Creamy", "Core base"],
    notes: "Primary dairy base ingredient for gelato.",
    isActive: true,
  },
  {
    id: "cream",
    name: "Cream",
    slug: "cream",
    category: "Dairy",
    roles: ["Base"],
    tags: ["Creamy", "Rich", "Core base"],
    notes: "Used to enrich dairy base.",
    isActive: true,
  },
  {
    id: "browned-butter",
    name: "Browned Butter",
    slug: "browned-butter",
    category: "Fat",
    roles: ["Supporting Flavour"],
    tags: ["Browned", "Nutty", "Rich"],
    notes: "Butter cooked until nutty and aromatic.",
    isActive: true,
  },
  {
    id: "garden-tomato-mix",
    name: "Garden Tomato Mix",
    slug: "garden-tomato-mix",
    category: "Vegetable",
    roles: ["Base", "Primary Flavour"],
    tags: ["Fresh", "Seasonal", "Savoury", "Garden"],
    notes: "Mixed tomato varieties used for sorbet or savoury-leaning flavour builds.",
    isActive: true,
  },
  {
    id: "white-peaches",
    name: "White Peaches",
    slug: "white-peaches",
    category: "Fruit",
    roles: ["Base", "Primary Flavour"],
    tags: ["Fresh", "Seasonal", "Juicy", "Stone fruit"],
    isActive: true,
  },
  {
    id: "ile-dorleans-strawberries",
    name: "L'Île-d'Orléans Strawberries",
    slug: "ile-dorleans-strawberries",
    category: "Fruit",
    roles: ["Base", "Primary Flavour"],
    tags: ["Local", "Seasonal", "Fresh", "Berry"],
    origin: "L'Île-d'Orléans, Québec",
    isActive: true,
  },
  {
    id: "wild-strawberry-quebec",
    name: "Wild Strawberry Québec",
    slug: "wild-strawberry-quebec",
    category: "Fruit",
    roles: ["Base", "Primary Flavour"],
    tags: ["Wild", "Local", "Seasonal", "Berry"],
    origin: "Québec",
    isActive: true,
  },
  {
    id: "red-watermelon",
    name: "Red Watermelon",
    slug: "red-watermelon",
    category: "Fruit",
    roles: ["Base", "Primary Flavour"],
    tags: ["Fresh", "Seasonal", "Melon"],
    isActive: true,
  },
  {
    id: "yellow-watermelon",
    name: "Yellow Watermelon",
    slug: "yellow-watermelon",
    category: "Fruit",
    roles: ["Base", "Primary Flavour"],
    tags: ["Fresh", "Seasonal", "Melon"],
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
    tags: ["Berry", "Fresh", "Seasonal", "Acidic"],
    isActive: true,
  },
  {
    id: "grilled-corn",
    name: "Grilled Corn",
    slug: "grilled-corn",
    category: "Grain",
    roles: ["Base", "Primary Flavour"],
    tags: ["Grilled", "Seasonal", "Sweet", "Smoky"],
    notes: "Operationally classified as grain for consistency, even if used like a vegetable.",
    isActive: true,
  },
  {
    id: "thyme",
    name: "Thyme",
    slug: "thyme",
    category: "Herb",
    roles: ["Supporting Flavour", "Garnish"],
    tags: ["Herbal", "Fresh", "Aromatic"],
    isActive: true,
  },
  {
    id: "madagascar-bourbon-vanilla",
    name: "Madagascar Bourbon Vanilla",
    slug: "madagascar-bourbon-vanilla",
    category: "Aromatic",
    roles: ["Primary Flavour", "Supporting Flavour"],
    tags: ["Warm", "Floral", "Sweet", "Classic"],
    origin: "Madagascar",
    isActive: true,
  },
  {
    id: "spruce-tip",
    name: "Spruce Tip",
    slug: "spruce-tip",
    category: "Botanical",
    roles: ["Primary Flavour", "Supporting Flavour"],
    tags: ["Foraged", "Resinous", "Herbal", "Wild"],
    isActive: true,
  },
  {
    id: "mint",
    name: "Mint",
    slug: "mint",
    category: "Herb",
    roles: ["Primary Flavour", "Supporting Flavour", "Garnish"],
    tags: ["Fresh", "Cooling", "Herbal"],
    isActive: true,
  },
  {
    id: "basil",
    name: "Basil",
    slug: "basil",
    category: "Herb",
    roles: ["Primary Flavour", "Supporting Flavour", "Garnish"],
    tags: ["Fresh", "Herbal", "Green"],
    isActive: true,
  },
  {
    id: "honey",
    name: "Honey",
    slug: "honey",
    category: "Sweetener",
    roles: ["Supporting Flavour"],
    tags: ["Sweet", "Floral", "Natural"],
    isActive: true,
  },
  {
    id: "sun-dried-mole",
    name: "Sun-Dried Mole",
    slug: "sun-dried-mole",
    category: "Sauce",
    roles: ["Topping", "Garnish", "Optional Add-on"],
    tags: ["Savoury", "Spicy", "Dried", "Complex"],
    notes: "Optional topping component, not a base ingredient.",
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
    notes: "Seasoning blend used as topping or add-on.",
    isActive: true,
  },
];

/**
 * Transform seed data to full Ingredient format
 */
export function transformSeedToIngredient(seed: IngredientSeed): Ingredient {
  const now = new Date().toISOString();
  
  // Map tags to descriptors (filter to only valid descriptor tags)
  const validDescriptors = [
    "Local", "Imported", "Seasonal", "Foraged", "Fresh", "Dried",
    "Roasted", "Toasted", "Grilled", "Browned", "Caramelized",
    "Fermented", "Infused", "Candied", "Citrus", "Acidic",
    "Floral", "Herbal", "Earthy", "Smoky", "Savoury",
    "Sweet", "Bitter", "Spicy", "Crunchy", "Creamy"
  ];
  
  const descriptors = (seed.tags || []).filter(tag => 
    validDescriptors.includes(tag)
  ) as any[];
  
  return {
    id: seed.id,
    name: seed.name,
    category: seed.category,
    roles: seed.roles,
    descriptors,
    origin: seed.origin || "Unknown",
    allergens: [],
    seasonal: seed.tags?.includes("Seasonal") || false,
    description: seed.notes,
    createdAt: now,
    updatedAt: now,
  };
}
