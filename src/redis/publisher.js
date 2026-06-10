import { getPublisherClient } from "../config/redis";
import { broadcastToChannel } from "../websocket/websocket.broadcast";

async function publishMessage(message) {
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
