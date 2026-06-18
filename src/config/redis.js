import { createClient } from "redis";
import { redisUrl } from "./env.js";
import { warn, error as _error, info } from "../utils/logger.js";

let publisherClient;
let subscriberClient;

async function createRedisClient(name) {
  if (!redisUrl) {
    warn(`Redis disabled for ${name}: REDIS_URL is not configured`);
    return null;
  }

  const client = createClient({ url: redisUrl });

  client.on("error", (error) => {
    _error(`Redis ${name} error`, { error: error.message });
  });

  await client.connect();
  info(`Redis ${name} connected`);
  return client;
}

export async function getPublisherClient() {
  if (!publisherClient) {
    publisherClient = await createRedisClient("publisher");
  }

  return publisherClient;
}

export async function getSubscriberClient() {
  if (!subscriberClient) {
    subscriberClient = await createRedisClient("subscriber");
  }

  return subscriberClient;
}

export async function disconnectRedis() {
  const clients = [publisherClient, subscriberClient].filter(Boolean);
  await Promise.allSettled(clients.map((client) => client.quit()));
}

export default {
  getPublisherClient,
  getSubscriberClient,
  disconnectRedis,
};
