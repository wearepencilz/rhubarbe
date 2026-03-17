#!/usr/bin/env node

/**
 * Script to automatically link ingredients to taxonomy categories
 * Maps old category values to new taxonomy IDs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ingredientsPath = path.join(__dirname, '../public/data/ingredients.json');
const settingsPath = path.join(__dirname, '../public/data/settings.json');

// Category mapping: old category -> new taxonomy ID
const categoryMapping = {
  // Dairy & Bases
  'Dairy': 'dairy-bases',
  'Fat': 'dairy-bases',
  
  // Fruits & Vegetables
  'Fruit': 'fruits-vegetables',
  'fruit': 'fruits-vegetables',
  'Vegetable': 'fruits-vegetables',
  
  // Nuts, Seeds & Grains
  'Grain': 'nuts-seeds-grains',
  
  // Spices, Herbs & Botanicals
  'Herb': 'spices-herbs-botanicals',
  'Botanical': 'spices-herbs-botanicals',
  'Aromatic': 'spices-herbs-botanicals',
  'Salt': 'spices-herbs-botanicals',
  
  // Sweeteners & Syrups
  'Sweetener': 'sweeteners-syrups',
  
  // Condiments & Sauces (map to closest category)
  'Sauce': 'sweeteners-syrups',
  'Condiment': 'sweeteners-syrups',
  
  // Default for unknown
  'new': null,
};

function main() {
  console.log('🔗 Linking ingredients to taxonomy categories...\n');

  // Read files
  const ingredients = JSON.parse(fs.readFileSync(ingredientsPath, 'utf8'));
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

  // Get available taxonomy categories
  const taxonomyCategories = settings.ingredientCategories || [];
  console.log(`Found ${taxonomyCategories.length} taxonomy categories:`);
  taxonomyCategories.forEach(cat => {
    console.log(`  - ${cat.label} (${cat.id})`);
  });
  console.log('');

  // Track statistics
  const stats = {
    total: ingredients.length,
    updated: 0,
    alreadyLinked: 0,
    unmapped: 0,
    byCategory: {}
  };

  // Update ingredients
  ingredients.forEach(ingredient => {
    const oldCategory = ingredient.category;
    
    // Skip if already has taxonomyCategory
    if (ingredient.taxonomyCategory) {
      stats.alreadyLinked++;
      return;
    }

    // Map to new taxonomy
    const newTaxonomyId = categoryMapping[oldCategory];
    
    if (newTaxonomyId) {
      ingredient.taxonomyCategory = newTaxonomyId;
      stats.updated++;
      stats.byCategory[newTaxonomyId] = (stats.byCategory[newTaxonomyId] || 0) + 1;
      console.log(`✓ ${ingredient.name}: "${oldCategory}" → "${newTaxonomyId}"`);
    } else {
      stats.unmapped++;
      console.log(`⚠ ${ingredient.name}: "${oldCategory}" → (no mapping)`);
    }
  });

  // Write updated ingredients
  fs.writeFileSync(ingredientsPath, JSON.stringify(ingredients, null, 2));

  // Print summary
  console.log('\n📊 Summary:');
  console.log(`  Total ingredients: ${stats.total}`);
  console.log(`  Already linked: ${stats.alreadyLinked}`);
  console.log(`  Newly linked: ${stats.updated}`);
  console.log(`  Unmapped: ${stats.unmapped}`);
  
  if (Object.keys(stats.byCategory).length > 0) {
    console.log('\n  Distribution:');
    Object.entries(stats.byCategory)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        const cat = taxonomyCategories.find(c => c.id === category);
        console.log(`    ${cat?.label || category}: ${count}`);
      });
  }

  console.log('\n✅ Done! Ingredients have been linked to taxonomy categories.');
}

main();
