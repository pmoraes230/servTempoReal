import { getPublisherClient } from "../config/redis";
import websocketBroadcast from "../websocket/websocket.broadcast";
const { broadcastToChannel } = websocketBroadcast;

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
