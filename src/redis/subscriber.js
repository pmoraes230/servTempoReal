const { getSubscriberClient } = require("../config/redis");
const { broadcastToChannel } = require("../websocket/websocket.broadcast");
const logger = require("../utils/logger");

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
      logger.error("Invalid Redis message", { error: error.message, channel });
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

module.exports = {
  subscribeRedisChannel,
  unsubscribeRedisChannel,
};
