import { getSubscriberClient } from "../config/redis.js";
import { broadcastToChannel } from "../websocket/websocket.broadcast.js";
import { error as _error } from "../utils/logger.js";

const subscribedChannels = new Set();

export async function subscribeRedisChannel(channel) {
  if (subscribedChannels.has(channel)) {
    return false;
  }

  const client = await getSubscriberClient();

  if (!client) {
    subscribedChannels.add(channel);
    return false;
  }

  await client.subscribe(channel, (rawMessage) => {
    try {
      const message = JSON.parse(rawMessage);
      broadcastToChannel(message);
    } catch (error) {
      _error("Invalid Redis message", { error: error.message, channel });
    }
  });

  subscribedChannels.add(channel);
  return true;
}

export async function unsubscribeRedisChannel(channel) {
  if (!subscribedChannels.has(channel)) {
    return false;
  }

  const client = await getSubscriberClient();

  if (client) {
    await client.unsubscribe(channel);
  }

  subscribedChannels.delete(channel);
  return true;
}

export default {
  subscribeRedisChannel,
  unsubscribeRedisChannel,
};
