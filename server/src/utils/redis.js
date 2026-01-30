import Redis from "ioredis";

const redisUrl =
  process.env.NODE_ENV === "production"
    ? process.env.REDIS_PROD_URL
    : process.env.REDIS_LOCAL_URL;

const redis = new Redis(redisUrl);

redis.on("connect", () => {
  console.log(`✅ Redis connected (${process.env.NODE_ENV})`);
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err);
});

export default redis;