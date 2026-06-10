import { createClient } from "redis";
import env from "./env";
import { warn, error as _error, info } from "../utils/logger";

let publisherClient;
let subscriberClient;

async function createRedisClient(name) {
  if (!env.redisUrl) {
    warn(`Redis disabled for ${name}: REDIS_URL is not configured`);
    return null;
  }

  const client = createClient({ url: env.redisUrl });

  client.on("error", (error) => {
    _error(`Redis ${name} error`, { error: error.message });
  });

  await client.connect();
  info(`Redis ${name} connected`);
  return client;
}

async function getPublisherClient() {
  if (!publisherClient) {
    publisherClient = await createRedisClient("publisher");
  }

  return publisherClient;
}

async function getSubscriberClient() {
  if (!subscriberClient) {
    subscriberClient = await createRedisClient("subscriber");
  }

  return subscriberClient;
}

async function disconnectRedis() {
  const clients = [publisherClient, subscriberClient].filter(Boolean);

  await Promise.allSettled(clients.map((client) => client.quit()));
}

export default {
  getPublisherClient,
  getSubscriberClient,
  disconnectRedis,
};
