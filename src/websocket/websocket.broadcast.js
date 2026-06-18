import WebSocket from "ws";
import { getClientsByChannel } from "./websocket.clients.js";

const { OPEN } = WebSocket;

function buildMessage({ channel, event = "message", payload }) {
  return JSON.stringify({
    channel,
    event,
    payload,
    sentAt: new Date().toISOString(),
  });
}

export function broadcastToChannel(message) {
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
