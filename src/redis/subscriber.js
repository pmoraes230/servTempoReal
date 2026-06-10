import { getSubscriberClient } from "../config/redis";
import { broadcastToChannel } from "../websocket/websocket.broadcast";
import { error as _error } from "../utils/logger";

const subscribedChannels = new Set();

async function subscribeRedisChannel(channel) {
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

async function unsubscribeRedisChannel(channel) {
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
