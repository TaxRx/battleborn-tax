// Epic 3: Admin Service Performance Utilities
// File: performance-utils.ts
// Purpose: Performance optimization utilities for account operations
// Story: 1.2 - Account CRUD Operations

export interface QueryOptimizationOptions {
  enablePagination?: boolean;
  enableCaching?: boolean;
  maxLimit?: number;
  defaultLimit?: number;
  enablePrefetch?: boolean;
  selectFields?: string[];
}

export interface PerformanceMetrics {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  recordCount?: number;
  cacheHit?: boolean;
  queryComplexity?: 'simple' | 'medium' | 'complex';
}

// Simple in-memory cache for frequently accessed data
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

/**
 * Cache management utilities
 */
export class CacheManager {
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_CACHE_SIZE = 1000;

  static set(key: string, data: any, ttl: number = CacheManager.DEFAULT_TTL): void {
    // Prevent cache from growing too large
    if (cache.size >= CacheManager.MAX_CACHE_SIZE) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }

    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  static get(key: string): any | null {
    const item = cache.get(key);
    if (!item) return null;

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      cache.delete(key);
      return null;
    }

    return item.data;
  }

  static delete(key: string): void {
    cache.delete(key);
  }

  static clear(): void {
    cache.clear();
  }

  static invalidatePattern(pattern: string): void {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  }

  static getStats(): { size: number; keys: string[] } {
    return {
      size: cache.size,
      keys: Array.from(cache.keys())
    };
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static metrics: PerformanceMetrics[] = [];
  private static readonly MAX_METRICS = 100;

  static startTimer(operation: string): PerformanceMetrics {
    const metric: PerformanceMetrics = {
      operation,
      startTime: Date.now()
    };
    
    return metric;
  }

  static endTimer(metric: PerformanceMetrics, additionalData?: Partial<PerformanceMetrics>): void {
    metric.endTime = Date.now();
    metric.duration = metric.endTime - metric.startTime;
    
    if (additionalData) {
      Object.assign(metric, additionalData);
    }

    // Store metric
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    // Log slow operations
    if (metric.duration && metric.duration > 2000) {
      console.warn('Slow operation detected:', metric);
    }
  }

  static getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  static getAverageTime(operation: string): number {
    const operationMetrics = this.metrics.filter(m => m.operation === operation && m.duration);
    if (operationMetrics.length === 0) return 0;
    
    const totalTime = operationMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    return totalTime / operationMetrics.length;
  }

  static clearMetrics(): void {
    this.metrics = [];
  }
}

/**
 * Optimize Supabase queries for better performance
 */
export function optimizeQuery(
  query: any,
  options: QueryOptimizationOptions = {}
): any {
  const {
    enablePagination = true,
    maxLimit = 100,
    defaultLimit = 50,
    selectFields = []
  } = options;

  // Apply field selection if specified
  if (selectFields.length > 0) {
    query = query.select(selectFields.join(','));
  }

  // Apply reasonable limits to prevent large data transfers
  if (enablePagination) {
    // This will be applied later when pagination parameters are known
    // Just store the limits for validation
    query._maxLimit = maxLimit;
    query._defaultLimit = defaultLimit;
  }

  return query;
}

/**
 * Create cache key for query results
 */
export function createCacheKey(
  table: string,
  filters: Record<string, any> = {},
  pagination: { page: number; limit: number } = { page: 1, limit: 50 }
): string {
  const filterString = Object.entries(filters)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join('|');
  
  return `${table}:${filterString}:page${pagination.page}:limit${pagination.limit}`;
}

/**
 * Execute query with caching and performance monitoring
 */
export async function executeOptimizedQuery<T>(
  queryBuilder: () => Promise<{ data: T; error: any; count?: number }>,
  cacheKey: string,
  operation: string,
  options: QueryOptimizationOptions = {}
): Promise<{ data: T; error: any; count?: number; fromCache?: boolean }> {
  const { enableCaching = true } = options;
  const metric = PerformanceMonitor.startTimer(operation);

  // Check cache first
  if (enableCaching) {
    const cachedResult = CacheManager.get(cacheKey);
    if (cachedResult) {
      PerformanceMonitor.endTimer(metric, { 
        cacheHit: true,
        queryComplexity: 'simple'
      });
      return { ...cachedResult, fromCache: true };
    }
  }

  // Execute query
  try {
    const result = await queryBuilder();
    
    // Cache successful results
    if (enableCaching && !result.error) {
      CacheManager.set(cacheKey, result);
    }

    PerformanceMonitor.endTimer(metric, {
      cacheHit: false,
      recordCount: Array.isArray(result.data) ? result.data.length : 1,
      queryComplexity: determineQueryComplexity(cacheKey)
    });

    return result;
  } catch (error) {
    PerformanceMonitor.endTimer(metric, {
      cacheHit: false,
      queryComplexity: 'complex'
    });
    throw error;
  }
}

/**
 * Invalidate related cache entries when data changes
 */
export function invalidateRelatedCache(operation: string, accountId?: string): void {
  switch (operation) {
    case 'create':
    case 'update':
    case 'delete':
      // Invalidate account list caches
      CacheManager.invalidatePattern('accounts:');
      
      // Invalidate specific account cache if ID provided
      if (accountId) {
        CacheManager.invalidatePattern(`account:${accountId}`);
        CacheManager.invalidatePattern(`activities:${accountId}`);
      }
      break;
      
    case 'activity_log':
      // Invalidate activity-related caches
      if (accountId) {
        CacheManager.invalidatePattern(`activities:${accountId}`);
      }
      CacheManager.invalidatePattern('recent_activities');
      CacheManager.invalidatePattern('activity_summary');
      break;
  }
}

/**
 * Optimize pagination parameters
 */
export function optimizePagination(
  page: number,
  limit: number,
  totalCount?: number
): { page: number; limit: number; offset: number; isLastPage?: boolean } {
  const optimizedLimit = Math.min(limit, 100); // Cap at 100
  const optimizedPage = Math.max(1, page);
  const offset = (optimizedPage - 1) * optimizedLimit;
  
  let isLastPage: boolean | undefined;
  if (totalCount !== undefined) {
    isLastPage = offset + optimizedLimit >= totalCount;
  }

  return {
    page: optimizedPage,
    limit: optimizedLimit,
    offset,
    isLastPage
  };
}

/**
 * Determine query complexity based on filters and joins
 */
function determineQueryComplexity(cacheKey: string): 'simple' | 'medium' | 'complex' {
  const filters = cacheKey.split(':')[1];
  const filterCount = filters ? filters.split('|').length : 0;
  
  if (filterCount === 0) return 'simple';
  if (filterCount <= 3) return 'medium';
  return 'complex';
}

/**
 * Prefetch related data to reduce subsequent queries
 */
export async function prefetchRelatedData(
  supabase: any,
  accountIds: string[]
): Promise<void> {
  if (accountIds.length === 0) return;

  try {
    // Prefetch profile counts for accounts
    const { data: profileCounts } = await supabase
      .from('profiles')
      .select('account_id')
      .in('account_id', accountIds);

    // Cache profile counts
    const countsByAccount = profileCounts?.reduce((acc: Record<string, number>, profile: any) => {
      acc[profile.account_id] = (acc[profile.account_id] || 0) + 1;
      return acc;
    }, {}) || {};

    for (const accountId of accountIds) {
      CacheManager.set(
        `profile_count:${accountId}`,
        countsByAccount[accountId] || 0,
        60000 // 1 minute cache
      );
    }
  } catch (error) {
    console.warn('Failed to prefetch related data:', error);
  }
}

/**
 * Batch operations for better performance
 */
export function createBatchProcessor<T>(
  batchSize: number = 50,
  processor: (batch: T[]) => Promise<void>
) {
  const batches: T[][] = [];
  let currentBatch: T[] = [];

  return {
    add(item: T): void {
      currentBatch.push(item);
      if (currentBatch.length >= batchSize) {
        batches.push(currentBatch);
        currentBatch = [];
      }
    },

    async process(): Promise<void> {
      // Process remaining items
      if (currentBatch.length > 0) {
        batches.push(currentBatch);
      }

      // Process all batches
      for (const batch of batches) {
        await processor(batch);
      }
    },

    getBatchCount(): number {
      return batches.length + (currentBatch.length > 0 ? 1 : 0);
    }
  };
}

/**
 * Database connection health check
 */
export async function checkDatabaseHealth(supabase: any): Promise<{
  isHealthy: boolean;
  responseTime: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    await supabase.from('accounts').select('id').limit(1);
    const responseTime = Date.now() - startTime;
    
    return {
      isHealthy: true,
      responseTime
    };
  } catch (error) {
    return {
      isHealthy: false,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}