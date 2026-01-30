import Redis from "ioredis";

let redis = null;

const redisUrl =
  process.env.NODE_ENV === "production"
    ? process.env.REDIS_PROD_URL
    : process.env.REDIS_LOCAL_URL;

if (redisUrl) {
  redis = new Redis(redisUrl);

  redis.on("connect", () => {
    console.log(`✅ Redis connected (${process.env.NODE_ENV})`);
  });

  redis.on("error", (err) => {
    console.error("❌ Redis error:", err.message);
  });
} else {
  console.warn(
    `⚠️ Redis disabled (no ${
      process.env.NODE_ENV === "production"
        ? "REDIS_PROD_URL"
        : "REDIS_LOCAL_URL"
    } found)`
  );
}

export default redis;