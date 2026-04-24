// src/config/redis.js
// Redis connection with graceful degradation
// If Redis is down, cache operations are no-ops — app keeps working
import Redis from "ioredis";
import { env } from "./env.js";

const redisUrl = env.isProd ? env.REDIS_PROD_URL : env.REDIS_LOCAL_URL;

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) return null; // Stop retrying after 3 attempts
    return Math.min(times * 200, 2000);
  },
  lazyConnect: true,
});

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => console.error("❌ Redis error:", err.message));

/**
 * GET from cache — returns null on any failure (graceful degradation)
 */
export const getCache = async (key) => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

/**
 * SET to cache with TTL in seconds
 */
export const setCache = async (key, value, ttl = 60) => {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttl);
  } catch {
    // Silent fail — cache miss is acceptable
  }
};

/**
 * DELETE by exact key or wildcard pattern
 */
export const delCache = async (pattern) => {
  try {
    if (!pattern.includes("*")) {
      await redis.del(pattern);
      return;
    }
    let cursor = 0;
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100
      );
      cursor = Number(nextCursor);
      if (keys.length) await redis.del(...keys);
    } while (cursor !== 0);
  } catch {
    // Silent fail
  }
};

export default redis;