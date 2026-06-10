require("dotenv").config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3000),
  redisUrl: process.env.REDIS_URL || "",
  apiToken: process.env.API_TOKEN || "",
  websocketToken: process.env.WEBSOCKET_TOKEN || process.env.API_TOKEN || "",
  jwtSecret: process.env.JWT_SECRET || "",
  allowClientPublish: process.env.ALLOW_CLIENT_PUBLISH === "true",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 120),
};

export default env;
