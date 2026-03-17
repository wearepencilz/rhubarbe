import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// PostgreSQL connection pool for game database
let pool: Pool | null = null;

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
}

/**
 * Get or create PostgreSQL connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    
    if (!connectionString) {
      throw new Error(
        'Database connection string not found. Please set DATABASE_URL or POSTGRES_URL environment variable.'
      );
    }

    pool = new Pool({
      connectionString,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });
  }

  return pool;
}

/**
 * Execute a query with automatic retry logic for transient failures
 */
export async function queryWithRetry<T extends QueryResultRow = any>(
  text: string,
  params?: any[],
  options: RetryOptions = {}
): Promise<QueryResult<T>> {
  const { maxAttempts = 3, delayMs = 100 } = options;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const pool = getPool();
      const result = await pool.query<T>(text, params);
      return result;
    } catch (error) {
      lastError = error as Error;
      
      // Check if error is retryable (connection issues, timeouts, etc.)
      const isRetryable = isTransientError(error as Error);
      
      if (!isRetryable || attempt === maxAttempts) {
        console.error(`Query failed after ${attempt} attempt(s):`, error);
        throw error;
      }

      // Exponential backoff
      const delay = delayMs * Math.pow(2, attempt - 1);
      console.warn(`Query attempt ${attempt} failed, retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw lastError || new Error('Query failed after all retry attempts');
}

/**
 * Execute a transaction with automatic retry logic
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxAttempts = 3, delayMs = 100 } = options;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      lastError = error as Error;
      
      const isRetryable = isTransientError(error as Error);
      
      if (!isRetryable || attempt === maxAttempts) {
        console.error(`Transaction failed after ${attempt} attempt(s):`, error);
        throw error;
      }

      const delay = delayMs * Math.pow(2, attempt - 1);
      console.warn(`Transaction attempt ${attempt} failed, retrying in ${delay}ms...`);
      await sleep(delay);
    } finally {
      client.release();
    }
  }

  throw lastError || new Error('Transaction failed after all retry attempts');
}

/**
 * Check if an error is transient and should be retried
 */
function isTransientError(error: Error): boolean {
  const transientErrorCodes = [
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    '57P03', // cannot_connect_now
    '53300', // too_many_connections
    '08006', // connection_failure
    '08001', // sqlclient_unable_to_establish_sqlconnection
    '08004', // sqlserver_rejected_establishment_of_sqlconnection
  ];

  const errorMessage = error.message.toLowerCase();
  const errorCode = (error as any).code;

  return (
    transientErrorCodes.includes(errorCode) ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('network')
  );
}

/**
 * Helper function to sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Close the connection pool (useful for cleanup in tests)
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Check database connection health
 */
export async function checkConnection(): Promise<boolean> {
  try {
    const result = await queryWithRetry('SELECT 1 as health_check');
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// ============================================================================
// QUERY HELPER FUNCTIONS
// ============================================================================

/**
 * Insert a single row and return the inserted record
 */
export async function insertOne<T extends QueryResultRow = any>(
  table: string,
  data: Record<string, any>
): Promise<T> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const columns = keys.join(', ');

  const query = `
    INSERT INTO ${table} (${columns})
    VALUES (${placeholders})
    RETURNING *
  `;

  const result = await queryWithRetry<T>(query, values);
  return result.rows[0];
}

/**
 * Update a single row by ID and return the updated record
 */
export async function updateById<T extends QueryResultRow = any>(
  table: string,
  id: string,
  data: Record<string, any>
): Promise<T | null> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');

  const query = `
    UPDATE ${table}
    SET ${setClause}
    WHERE id = $1
    RETURNING *
  `;

  console.log('Update query:', query);
  console.log('Update params:', [id, ...values]);

  const result = await queryWithRetry<T>(query, [id, ...values]);
  return result.rows[0] || null;
}

/**
 * Find a single row by ID
 */
export async function findById<T extends QueryResultRow = any>(
  table: string,
  id: string
): Promise<T | null> {
  const query = `SELECT * FROM ${table} WHERE id = $1`;
  const result = await queryWithRetry<T>(query, [id]);
  return result.rows[0] || null;
}

/**
 * Find rows with optional filtering, sorting, and pagination
 */
export async function findMany<T extends QueryResultRow = any>(
  table: string,
  options: {
    where?: Record<string, any>;
    orderBy?: { column: string; direction: 'ASC' | 'DESC' };
    limit?: number;
    offset?: number;
  } = {}
): Promise<T[]> {
  const { where, orderBy, limit, offset } = options;
  
  let query = `SELECT * FROM ${table}`;
  const values: any[] = [];
  let paramIndex = 1;

  // Add WHERE clause
  if (where && Object.keys(where).length > 0) {
    const conditions = Object.keys(where).map((key) => {
      values.push(where[key]);
      return `${key} = $${paramIndex++}`;
    });
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  // Add ORDER BY clause
  if (orderBy) {
    query += ` ORDER BY ${orderBy.column} ${orderBy.direction}`;
  }

  // Add LIMIT clause
  if (limit) {
    query += ` LIMIT $${paramIndex++}`;
    values.push(limit);
  }

  // Add OFFSET clause
  if (offset) {
    query += ` OFFSET $${paramIndex++}`;
    values.push(offset);
  }

  const result = await queryWithRetry<T>(query, values);
  return result.rows;
}

/**
 * Count rows with optional filtering
 */
export async function count(
  table: string,
  where?: Record<string, any>
): Promise<number> {
  let query = `SELECT COUNT(*) as count FROM ${table}`;
  const values: any[] = [];
  let paramIndex = 1;

  if (where && Object.keys(where).length > 0) {
    const conditions = Object.keys(where).map((key) => {
      values.push(where[key]);
      return `${key} = $${paramIndex++}`;
    });
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  const result = await queryWithRetry<{ count: string }>(query, values);
  return parseInt(result.rows[0].count, 10);
}

/**
 * Delete a row by ID
 */
export async function deleteById(table: string, id: string): Promise<boolean> {
  const query = `DELETE FROM ${table} WHERE id = $1`;
  const result = await queryWithRetry(query, [id]);
  return (result.rowCount || 0) > 0;
}

/**
 * Execute a raw SQL query (use with caution)
 */
export async function raw<T extends QueryResultRow = any>(
  query: string,
  params?: any[]
): Promise<QueryResult<T>> {
  return queryWithRetry<T>(query, params);
}

// ============================================================================
// SPECIALIZED QUERY FUNCTIONS FOR GAME FEATURE
// ============================================================================

/**
 * Get active campaign by ID
 */
export async function getActiveCampaign(campaignId: string) {
  const query = `
    SELECT * FROM campaigns
    WHERE id = $1 AND status = 'active'
  `;
  const result = await queryWithRetry(query, [campaignId]);
  return result.rows[0] || null;
}

/**
 * Get leaderboard for a campaign
 */
export async function getLeaderboard(
  campaignId: string,
  limit: number = 100
) {
  const query = `
    SELECT 
      s.id,
      s.player_name,
      s.score,
      s.completion_time,
      s.created_at,
      gs.is_golden_spoon,
      ROW_NUMBER() OVER (ORDER BY s.score DESC, s.created_at ASC) as rank
    FROM scores s
    JOIN game_sessions gs ON s.session_id = gs.id
    WHERE s.campaign_id = $1
      AND s.is_valid = TRUE
      AND s.is_flagged = FALSE
    ORDER BY s.score DESC, s.created_at ASC
    LIMIT $2
  `;
  const result = await queryWithRetry(query, [campaignId, limit]);
  return result.rows;
}

/**
 * Check if session ID has already been used for score submission
 */
export async function isSessionUsed(sessionId: string): Promise<boolean> {
  const query = `SELECT 1 FROM scores WHERE session_id = $1`;
  const result = await queryWithRetry(query, [sessionId]);
  return result.rows.length > 0;
}

/**
 * Get remaining rewards for a campaign
 */
export async function getRemainingRewards(campaignId: string): Promise<number> {
  const query = `SELECT reward_remaining FROM campaigns WHERE id = $1`;
  const result = await queryWithRetry<{ reward_remaining: number }>(query, [campaignId]);
  return result.rows[0]?.reward_remaining || 0;
}

/**
 * Check rate limit for IP address
 */
export async function checkRateLimit(
  ipAddress: string,
  windowSeconds: number = 30
): Promise<boolean> {
  const query = `
    SELECT COUNT(*) as count
    FROM scores s
    JOIN game_sessions gs ON s.session_id = gs.id
    WHERE gs.ip_address = $1
      AND s.created_at > NOW() - INTERVAL '${windowSeconds} seconds'
  `;
  const result = await queryWithRetry<{ count: string }>(query, [ipAddress]);
  const count = parseInt(result.rows[0].count, 10);
  return count === 0; // Returns true if no recent submissions (rate limit not exceeded)
}

/**
 * Check browser fingerprint for recent submissions
 */
export async function checkBrowserFingerprint(
  fingerprint: string,
  windowSeconds: number = 60
): Promise<number> {
  const query = `
    SELECT COUNT(*) as count
    FROM scores s
    JOIN game_sessions gs ON s.session_id = gs.id
    WHERE gs.browser_fingerprint = $1
      AND s.created_at > NOW() - INTERVAL '${windowSeconds} seconds'
  `;
  const result = await queryWithRetry<{ count: string }>(query, [fingerprint]);
  return parseInt(result.rows[0].count, 10);
}

/**
 * Log validation check
 */
export async function logValidation(data: {
  sessionId?: string;
  validationType: string;
  passed: boolean;
  reason?: string;
  ipAddress?: string;
  browserFingerprint?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  await insertOne('validation_logs', {
    session_id: data.sessionId || null,
    validation_type: data.validationType,
    passed: data.passed,
    reason: data.reason || null,
    ip_address: data.ipAddress || null,
    browser_fingerprint: data.browserFingerprint || null,
    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
  });
}

/**
 * Log analytics event
 */
export async function logAnalyticsEvent(data: {
  campaignId: string;
  sessionId?: string;
  eventType: string;
  eventData?: Record<string, any>;
}): Promise<void> {
  await insertOne('analytics_events', {
    campaign_id: data.campaignId,
    session_id: data.sessionId || null,
    event_type: data.eventType,
    event_data: data.eventData ? JSON.stringify(data.eventData) : null,
  });
}

/**
 * Find all rows with optional ordering
 * Convenience wrapper around findMany
 */
export async function findAll<T extends QueryResultRow = any>(
  table: string,
  options: {
    orderBy?: string;
    order?: 'ASC' | 'DESC';
  } = {}
): Promise<T[]> {
  const { orderBy, order = 'ASC' } = options;
  
  return findMany<T>(table, {
    orderBy: orderBy ? { column: orderBy, direction: order } : undefined,
  });
}
