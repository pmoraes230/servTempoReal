import { getPublisherClient } from "../config/redis.js";
import { broadcastToChannel } from "../websocket/websocket.broadcast.js";

export async function publishMessage(message) {
  const client = await getPublisherClient();

  if (!client) {
    return {
      mode: "memory",
      ...broadcastToChannel(message),
    };
  }

  await client.publish(message.channel, JSON.stringify(message));
  return { mode: "redis", delivered: null };
}

export default {
  publishMessage,
};
