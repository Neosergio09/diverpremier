import { supabase } from './supabase';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  revalidating?: boolean;
}

// Global in-memory cache store
const cacheStore = new Map<string, CacheEntry<any>>();

// 60 seconds fresh TTL. Beyond 60s, serves stale cached data instantly while refreshing in the background.
const DEFAULT_TTL_MS = 60 * 1000;
// Maximum stale age: 15 minutes. If no refresh happened within 15 minutes, fetch synchronously.
const MAX_STALE_MS = 15 * 60 * 1000;

export async function fetchWithSWR<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = DEFAULT_TTL_MS
): Promise<T> {
  const cached = cacheStore.get(key);
  const now = Date.now();

  if (cached) {
    const age = now - cached.timestamp;

    // 1. Fresh Cache Hit (< 1ms response time)
    if (age < ttlMs) {
      return cached.data as T;
    }

    // 2. Stale Cache Hit: return stale data immediately, revalidate asynchronously in background
    if (age < MAX_STALE_MS) {
      if (!cached.revalidating) {
        cached.revalidating = true;
        fetcher()
          .then((freshData) => {
            cacheStore.set(key, {
              data: freshData,
              timestamp: Date.now(),
              revalidating: false,
            });
            console.log(`⚡ [SWR Cache] Background revalidation complete for: ${key}`);
          })
          .catch((err) => {
            console.error(`⚠️ [SWR Cache] Background revalidation failed for: ${key}`, err);
            cached.revalidating = false;
          });
      }
      return cached.data as T;
    }
  }

  // 3. Cold Start: Fetch directly and populate cache
  const startTime = Date.now();
  const freshData = await fetcher();
  const duration = Date.now() - startTime;
  console.log(`🧊 [SWR Cache] Cold fetch for "${key}" completed in ${duration}ms`);

  cacheStore.set(key, {
    data: freshData,
    timestamp: Date.now(),
    revalidating: false,
  });

  return freshData;
}

export function invalidateCache(key?: string) {
  if (key) {
    cacheStore.delete(key);
    console.log(`🧹 [SWR Cache] Purged key: ${key}`);
  } else {
    cacheStore.clear();
    console.log('🧹 [SWR Cache] Purged all cache');
  }
}

// ─────────────────────────────────────────────────────────────
// Typed Domain Data Fetchers
// ─────────────────────────────────────────────────────────────

export interface CatalogProduct {
  id?: string;
  name: string;
  price: number | string;
  stock_quantity: number;
  category_id?: string;
}

export interface CatalogCategory {
  name: string;
  products: CatalogProduct[];
}

/**
 * Cached fetch for Categories and their associated Products.
 */
export async function getCachedCategoriesWithProducts(): Promise<CatalogCategory[]> {
  return fetchWithSWR<CatalogCategory[]>('catalog:categories_products', async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('name, products(id, name, price, stock_quantity, category_id)')
      .order('name');

    if (error) {
      console.error('❌ Supabase Error in getCachedCategoriesWithProducts:', error.message);
      throw error;
    }

    return (data || []) as CatalogCategory[];
  });
}

/**
 * Cached fetch for all Cocktails in the mixology showcase.
 */
export async function getCachedCocktails() {
  return fetchWithSWR('cocktails:all', async () => {
    const { data, error } = await supabase
      .from('cocktails')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ Supabase Error in getCachedCocktails:', error.message);
      throw error;
    }

    return data || [];
  });
}

export function invalidateCatalogCache() {
  invalidateCache('catalog:categories_products');
}

export function invalidateCocktailsCache() {
  invalidateCache('cocktails:all');
}
