// src/config/redis.js
import Redis from "ioredis";
import { env } from "./env.js";

const redisUrl = env.isProd ? env.REDIS_PROD_URL : env.REDIS_LOCAL_URL;

// If no Redis URL configured, export no-op functions — app works without cache
if (!redisUrl) {
  console.warn("⚠️  No Redis URL configured — caching disabled");
}

const redis = redisUrl
  ? new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    })
  : null;

if (redis) {
  redis.on("connect", () => console.log("✅ Redis connected"));
  redis.on("error", (err) => console.error("❌ Redis error:", err.message));
}

export const getCache = async (key) => {
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const setCache = async (key, value, ttl = 60) => {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttl);
  } catch {
    // Silent fail
  }
};

export const delCache = async (pattern) => {
  if (!redis) return;
  try {
    if (!pattern.includes("*")) {
      await redis.del(pattern);
      return;
    }
    let cursor = 0;
    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = Number(nextCursor);
      if (keys.length) await redis.del(...keys);
    } while (cursor !== 0);
  } catch {
    // Silent fail
  }
};

export default redis;