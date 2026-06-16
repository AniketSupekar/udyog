import { getCache, setCache, delCache } from "../config/redis.js";

export const CACHE_KEYS = {
  products:           (businessId) => `products:${businessId}`,
  dashboardSummary:   (businessId) => `dashboard:summary:${businessId}`,
  dashboardSnapshot:  (businessId) => `dashboard:snapshot:${businessId}`,
  analyticsOverview:  (businessId) => `analytics:overview:${businessId}`,
  expenseSummary:     (businessId) => `expenses:summary:${businessId}`,
};

export const CACHE_TTL = {
  products:           300,
  dashboardSummary:   30,
  dashboardSnapshot:  60,
  analyticsOverview:  300,
  expenseSummary:     300,
};

export const invalidateOrderCache = async (businessId) => {
  await Promise.all([
    delCache(CACHE_KEYS.dashboardSummary(businessId)),
    delCache(CACHE_KEYS.dashboardSnapshot(businessId)),
    delCache(CACHE_KEYS.analyticsOverview(businessId)),
  ]);
};

export const invalidateProductCache = async (businessId) => {
  await delCache(CACHE_KEYS.products(businessId));
};

// Expenses affect analytics overview (profit calc) so invalidate that too
export const invalidateExpenseCache = async (businessId) => {
  await Promise.all([
    delCache(CACHE_KEYS.expenseSummary(businessId)),
    delCache(CACHE_KEYS.analyticsOverview(businessId)),
  ]);
};

export const invalidateAllCache = async (businessId) => {
  await Promise.all([
    delCache(CACHE_KEYS.products(businessId)),
    delCache(CACHE_KEYS.dashboardSummary(businessId)),
    delCache(CACHE_KEYS.dashboardSnapshot(businessId)),
    delCache(CACHE_KEYS.analyticsOverview(businessId)),
    delCache(CACHE_KEYS.expenseSummary(businessId)),
  ]);
};

export { getCache, setCache, delCache };