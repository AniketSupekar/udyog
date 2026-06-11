// src/utils/cacheManager.js
// Single source of truth for all Redis cache keys, TTLs, and invalidation groups.
// Controllers never hardcode cache keys — they import from here.

import { getCache, setCache, delCache } from "../config/redis.js";

// ─── Key Definitions ──────────────────────────────────────────────────────────

export const CACHE_KEYS = {
  products:           (businessId) => `products:${businessId}`,
  dashboardSummary:   (businessId) => `dashboard:summary:${businessId}`,
  dashboardSnapshot:  (businessId) => `dashboard:snapshot:${businessId}`,
  analyticsOverview:  (businessId) => `analytics:overview:${businessId}`,
};

// ─── TTL Definitions (seconds) ────────────────────────────────────────────────

export const CACHE_TTL = {
  products:           300,  // 5 min  — changes on product create/update/delete
  dashboardSummary:   30,   // 30 sec — high frequency reads, needs to feel live
  dashboardSnapshot:  60,   // 1 min  — monthly aggregation, less volatile
  analyticsOverview:  300,  // 5 min  — heavy aggregation, expensive to recompute
};

// ─── Invalidation Groups ─────────────────────────────────────────────────────
// Call these from controllers after mutations. Each group deletes exactly
// the keys that are stale after that type of change.

/**
 * Call after: order created, updated, status changed, payment recorded, deleted
 * Stales: dashboard summary, dashboard snapshot, analytics
 */
export const invalidateOrderCache = async (businessId) => {
  await Promise.all([
    delCache(CACHE_KEYS.dashboardSummary(businessId)),
    delCache(CACHE_KEYS.dashboardSnapshot(businessId)),
    delCache(CACHE_KEYS.analyticsOverview(businessId)),
  ]);
};

/**
 * Call after: product created, updated, deleted
 * Stales: products list only
 */
export const invalidateProductCache = async (businessId) => {
  await delCache(CACHE_KEYS.products(businessId));
};

/**
 * Call after: business profile updated (name, UPI ID etc.)
 * Stales: everything — dashboard snapshot embeds business context
 */
export const invalidateAllCache = async (businessId) => {
  await Promise.all([
    delCache(CACHE_KEYS.products(businessId)),
    delCache(CACHE_KEYS.dashboardSummary(businessId)),
    delCache(CACHE_KEYS.dashboardSnapshot(businessId)),
    delCache(CACHE_KEYS.analyticsOverview(businessId)),
  ]);
};

// ─── Re-export primitives so controllers only import from one place ───────────

export { getCache, setCache, delCache };