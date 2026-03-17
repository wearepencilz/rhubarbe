import { randomUUID } from 'crypto';
import { saveFormats } from '../lib/db.js';
import type { Format } from '../types/index.js';

const defaultFormats: Record<string, any>[] = [
  {
    name: 'Soft Serve',
    slug: 'soft-serve',
    category: 'frozen',
    description: 'Single flavour soft serve in cup or cone',
    requiresFlavours: true,
    minFlavours: 1,
    maxFlavours: 1,
    allowMixedTypes: false,
    canIncludeAddOns: true,
    defaultSizes: ['small', 'medium', 'large'],
    servingStyle: 'soft-serve',
    menuSection: 'Soft Serve',
  },
  {
    name: 'Twist',
    slug: 'twist',
    category: 'frozen',
    description: 'Two flavours swirled together in soft serve',
    requiresFlavours: true,
    minFlavours: 2,
    maxFlavours: 2,
    allowMixedTypes: true,
    canIncludeAddOns: true,
    defaultSizes: ['small', 'medium', 'large'],
    servingStyle: 'soft-serve',
    menuSection: 'Soft Serve',
  },
  {
    name: 'Pint',
    slug: 'pint',
    category: 'frozen',
    description: 'Packaged pint for take-home',
    requiresFlavours: true,
    minFlavours: 1,
    maxFlavours: 1,
    allowMixedTypes: false,
    canIncludeAddOns: false,
    defaultSizes: ['pint'],
    servingStyle: 'packaged',
    menuSection: 'Take Home',
  },
  {
    name: 'Sandwich',
    slug: 'sandwich',
    category: 'frozen',
    description: 'Ice cream sandwich with cookie or wafer',
    requiresFlavours: true,
    minFlavours: 1,
    maxFlavours: 1,
    allowMixedTypes: false,
    canIncludeAddOns: false,
    defaultSizes: ['standard'],
    servingStyle: 'plated',
    menuSection: 'Sandwiches',
  },
  {
    name: 'Tasting',
    slug: 'tasting',
    category: 'experience',
    description: 'Curated tasting with multiple flavours and pairings',
    requiresFlavours: true,
    minFlavours: 2,
    maxFlavours: 5,
    allowMixedTypes: true,
    canIncludeAddOns: true,
    defaultSizes: ['tasting'],
    servingStyle: 'plated',
    menuSection: 'Experiences',
  },
  {
    name: 'Combo',
    slug: 'combo',
    category: 'bundle',
    description: 'Bundle of multiple items (e.g., focaccia + soft serve)',
    requiresFlavours: false,
    minFlavours: 0,
    maxFlavours: 0,
    allowMixedTypes: false,
    canIncludeAddOns: false,
    defaultSizes: [],
    servingStyle: 'plated',
    menuSection: 'Combos',
  },
];

async function seedFormats() {
  console.log('🌱 Seeding default formats...');
  
  const now = new Date().toISOString();
  const formats = defaultFormats.map(format => ({
    ...format,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
  })) as Format[];

  try {
    await saveFormats(formats);
    console.log(`✓ Created ${formats.length} default formats:`);
    formats.forEach(f => {
      console.log(`  - ${f.name} (${f.slug})`);
    });
  } catch (error) {
    console.error('✗ Error seeding formats:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedFormats()
    .then(() => {
      console.log('✓ Seeding complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('✗ Seeding failed:', error);
      process.exit(1);
    });
}

export { seedFormats };
