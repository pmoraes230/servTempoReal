import { OPEN } from "ws";
import websocketClients from "./websocket.clients";
const { getClientsByChannel } = websocketClients;

function buildMessage({ channel, event = "message", payload }) {
  return JSON.stringify({
    channel,
    event,
    payload,
    sentAt: new Date().toISOString(),
  });
}

function broadcastToChannel(message) {
  const serialized = buildMessage(message);
  const clients = getClientsByChannel(message.channel);
  let delivered = 0;

  for (const client of clients) {
    if (client.socket.readyState === OPEN) {
      client.socket.send(serialized);
      delivered += 1;
    }
  }

  return { delivered };
}

export default {
  broadcastToChannel,
};
