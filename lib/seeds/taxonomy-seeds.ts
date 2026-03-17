/**
 * Taxonomy Seed Data
 * 
 * This file contains the canonical seed data for all taxonomy categories.
 * Use this to restore or reset taxonomy values if needed.
 * 
 * To restore from seeds:
 * 1. Copy the relevant array from this file
 * 2. Update public/data/settings.json with the seed data
 * 3. Restart the dev server to reload the data
 */

// Flavour Tags (keyNotes) - Used to describe flavour profiles
export const flavourTagsSeed = [
  "sweet",
  "rich",
  "buttery",
  "caramelized",
  "honeyed",
  "fresh",
  "refreshing",
  "bright",
  "citrusy",
  "fruity",
  "floral",
  "jammy",
  "savory",
  "earthy",
  "herbal",
  "green",
  "nutty",
  "toasted",
  "smoky",
  "spiced",
  "creamy",
  "light"
];

// Flavour Types - Determines format eligibility
export const flavourTypesSeed = [
  { value: "gelato", label: "Gelato" },
  { value: "sorbet", label: "Sorbet" }
];

// Ingredient Categories
export const ingredientCategoriesSeed = [
  "Dairy & Bases",
  "Fruits & Vegetables",
  "Nuts, Seeds & Grains",
  "Spices, Herbs & Botanicals",
  "Sweeteners & Syrups",
  "Chocolate, Coffee & Cacao",
  "Floral & Aromatic",
  "Funky, Fermented & Savoury",
  "Salts & Minerals",
  "Regional or Cultural Staples",
  "Inclusions & Add-Ons",
  "Other"
];

// Ingredient Roles
export const ingredientRolesSeed = [
  { value: "primary", label: "Primary", description: "Main ingredient defining the flavour" },
  { value: "supporting", label: "Supporting", description: "Enhances or complements the primary flavour" },
  { value: "accent", label: "Accent", description: "Adds subtle notes or complexity" }
];

// Tasting Notes - For ingredient descriptors
export const tastingNotesSeed = [
  "citrus",
  "floral",
  "bittersweet",
  "earthy",
  "herbaceous",
  "spicy",
  "woody",
  "tropical",
  "berry",
  "stone-fruit"
];

// Format Categories
export const formatCategoriesSeed = [
  { value: "frozen", label: "Frozen", description: "Ice cream, sorbet, soft serve" },
  { value: "food", label: "Food", description: "Sandwiches, focaccia" },
  { value: "experience", label: "Experience", description: "Tastings, events" },
  { value: "bundle", label: "Bundle", description: "Multi-item packages" }
];

// Serving Styles
export const servingStylesSeed = [
  { value: "scoop", label: "Scoop", description: "Traditional scooped ice cream" },
  { value: "soft-serve", label: "Soft Serve", description: "Soft-serve machine dispensed" },
  { value: "packaged", label: "Packaged", description: "Pre-packaged containers" },
  { value: "plated", label: "Plated", description: "Plated dessert experience" }
];

// Modifier Types
export const modifierTypesSeed = [
  { value: "topping", label: "Topping" },
  { value: "sauce", label: "Sauce" },
  { value: "crunch", label: "Crunch" },
  { value: "drizzle", label: "Drizzle" },
  { value: "premium-addon", label: "Premium Add-on" }
];

// Allergens
export const allergensSeed = [
  { value: "dairy", label: "Dairy" },
  { value: "egg", label: "Egg" },
  { value: "gluten", label: "Gluten" },
  { value: "tree-nuts", label: "Tree Nuts" },
  { value: "peanuts", label: "Peanuts" },
  { value: "sesame", label: "Sesame" },
  { value: "soy", label: "Soy" }
];

/**
 * Helper function to convert seed array to taxonomy format
 * 
 * @param seeds - Array of strings or objects
 * @param startOrder - Starting sort order (default: 1)
 * @returns Array of taxonomy objects with id, label, value, sortOrder, archived
 */
export function convertToTaxonomyFormat(
  seeds: string[] | Array<{ value: string; label: string; description?: string }>,
  startOrder: number = 1
) {
  return seeds.map((item, index) => {
    if (typeof item === 'string') {
      // Convert string to proper case for label
      const label = item.charAt(0).toUpperCase() + item.slice(1);
      return {
        id: item,
        label,
        value: item,
        sortOrder: startOrder + index,
        archived: false
      };
    } else {
      // Object with value, label, and optional description
      return {
        id: item.value,
        label: item.label,
        value: item.value,
        ...(item.description && { description: item.description }),
        sortOrder: startOrder + index,
        archived: false
      };
    }
  });
}

/**
 * Example usage:
 * 
 * const keyNotes = convertToTaxonomyFormat(flavourTagsSeed);
 * const formatCategories = convertToTaxonomyFormat(formatCategoriesSeed);
 */
