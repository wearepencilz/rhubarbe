// Sync queue processor for Shopify metafield synchronization

import { getIngredients, getSyncJobs, saveSyncJobs, getSyncLogs, saveSyncLogs } from '@/lib/db';
import { updateProductMetafields, type ProductMetafieldInput } from '@/lib/shopify/admin';
import { computeDietaryClaims } from '@/lib/dietary-claims';
import type { Flavour, Ingredient, SyncJob, SyncLog, Allergen } from '@/types';

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // Exponential backoff in ms

// Helper function to calculate allergens from ingredients
function calculateAllergens(ingredientIds: string[], allIngredients: Ingredient[]): Allergen[] {
  const allergenSet = new Set<Allergen>();
  
  ingredientIds.forEach(id => {
    const ingredient = allIngredients.find(ing => ing.id === id);
    if (ingredient) {
      ingredient.allergens.forEach(allergen => allergenSet.add(allergen));
    }
  });
  
  return Array.from(allergenSet);
}

// Build metafield payload from flavour data
export function buildMetafieldPayload(flavour: Flavour, allIngredients: Ingredient[]): ProductMetafieldInput[] {
  const ingredientIds = flavour.ingredients.map(fi => fi.ingredientId);
  const allergens = calculateAllergens(ingredientIds, allIngredients);
  const ingredients = ingredientIds
    .map(id => allIngredients.find(ing => ing.id === id))
    .filter(Boolean) as Ingredient[];
  const dietaryClaims = computeDietaryClaims(ingredients);
  const hasSeasonalIngredients = ingredientIds.some(id => {
    const ing = allIngredients.find(i => i.id === id);
    return ing?.seasonal;
  });
  
  return [
    {
      namespace: 'custom',
      key: 'flavour_id',
      value: flavour.id,
      type: 'single_line_text_field'
    },
    {
      namespace: 'custom',
      key: 'ingredient_ids',
      value: JSON.stringify(ingredientIds),
      type: 'json'
    },
    {
      namespace: 'custom',
      key: 'allergens',
      value: JSON.stringify(allergens),
      type: 'json'
    },
    {
      namespace: 'custom',
      key: 'dietary_tags',
      value: JSON.stringify(dietaryClaims),
      type: 'json'
    },
    {
      namespace: 'custom',
      key: 'seasonal_ingredients',
      value: hasSeasonalIngredients.toString(),
      type: 'boolean'
    }
  ];
}

// Create a new sync job
export async function createSyncJob(flavourId: string, productId: string): Promise<SyncJob> {
  const jobs = await getSyncJobs() as SyncJob[];
  
  const newJob: SyncJob = {
    id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    flavourId,
    productId,
    status: 'pending',
    attempts: 0,
    maxAttempts: MAX_RETRIES,
    createdAt: new Date().toISOString()
  };
  
  jobs.push(newJob);
  await saveSyncJobs(jobs);
  
  return newJob;
}

// Process a single sync job
export async function processSyncJob(jobId: string): Promise<void> {
  const jobs = await getSyncJobs() as SyncJob[];
  const jobIndex = jobs.findIndex(j => j.id === jobId);
  
  if (jobIndex === -1) {
    throw new Error(`Sync job ${jobId} not found`);
  }
  
  const job = jobs[jobIndex];
  
  // Update job status to processing
  job.status = 'processing';
  job.processedAt = new Date().toISOString();
  job.attempts += 1;
  await saveSyncJobs(jobs);
  
  const startTime = Date.now();
  
  try {
    // Get flavour and ingredients — queue now operates on products
    const flavours = [] as any[];
    const flavour = undefined;
    
    if (!flavour) {
      throw new Error(`Flavour ${job.flavourId} not found`);
    }
    
    const allIngredients = await getIngredients() as Ingredient[];
    
    // Build metafield payload
    const metafields = buildMetafieldPayload(flavour, allIngredients);
    
    // Update Shopify product metafields
    await updateProductMetafields(job.productId, metafields);
    
    // Update job status to completed
    job.status = 'completed';
    job.completedAt = new Date().toISOString();
    delete job.error;
    await saveSyncJobs(jobs);
    
    // Update flavour sync status (no-op: flavours removed)
    
    // Log success
    await logSync(job.flavourId, job.productId, 'update', 'success', Date.now() - startTime);
    
  } catch (error: any) {
    console.error(`Sync job ${jobId} failed:`, error);
    
    // Update job with error
    job.error = error.message;
    
    // Check if we should retry
    if (job.attempts < job.maxAttempts) {
      job.status = 'pending'; // Retry
    } else {
      job.status = 'failed'; // Max retries reached
      
      // Update flavour sync status to failed (no-op: flavours removed)
    }
    
    await saveSyncJobs(jobs);
    
    // Log failure
    await logSync(job.flavourId, job.productId, 'update', 'failure', Date.now() - startTime, error.message);
    
    throw error;
  }
}

// Log sync operation
async function logSync(
  flavourId: string,
  productId: string,
  action: 'create' | 'update' | 'delete',
  status: 'success' | 'failure',
  duration: number,
  error?: string
): Promise<void> {
  const logs = await getSyncLogs() as SyncLog[];
  
  const newLog: SyncLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    flavourId,
    productId,
    action,
    status,
    error,
    timestamp: new Date().toISOString(),
    duration
  };
  
  logs.push(newLog);
  
  // Keep only last 1000 logs
  if (logs.length > 1000) {
    logs.splice(0, logs.length - 1000);
  }
  
  await saveSyncLogs(logs);
}

// Get pending sync jobs
export async function getPendingSyncJobs(): Promise<SyncJob[]> {
  const jobs = await getSyncJobs() as SyncJob[];
  return jobs.filter(j => j.status === 'pending');
}

// Retry failed sync job
export async function retrySyncJob(jobId: string): Promise<void> {
  const jobs = await getSyncJobs() as SyncJob[];
  const jobIndex = jobs.findIndex(j => j.id === jobId);
  
  if (jobIndex === -1) {
    throw new Error(`Sync job ${jobId} not found`);
  }
  
  const job = jobs[jobIndex];
  
  // Reset job for retry
  job.status = 'pending';
  job.attempts = 0;
  delete job.error;
  delete job.processedAt;
  delete job.completedAt;
  
  await saveSyncJobs(jobs);
}
