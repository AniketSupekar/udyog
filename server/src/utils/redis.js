// src/utils/redis.js
import Redis from "ioredis";

const isProd = process.env.NODE_ENV === "production";

const redis = new Redis(isProd ? process.env.REDIS_PROD_URL : process.env.REDIS_LOCAL_URL);

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => console.error("❌ Redis error:", err));

/**
 * GET from cache
 */
export const getCache = async (key) => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Redis GET error:", err);
    return null;
  }
};

/**
 * SET to cache with optional TTL in seconds
 */
export const setCache = async (key, value, ttl = 60) => {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttl);
  } catch (err) {
    console.error("Redis SET error:", err);
  }
};

/**
 * DELETE keys safely with optional pattern (wildcard)
 */
export const delCache = async (pattern) => {
  try {
    if (!pattern.includes("*")) {
      await redis.del(pattern);
      return;
    }

    // Scan keys and delete in batches
    let cursor = 0;
    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = Number(nextCursor);
      if (keys.length) await redis.del(...keys);
    } while (cursor !== 0);
  } catch (err) {
    console.error("Redis DEL error:", err);
  }
};

export default redis;