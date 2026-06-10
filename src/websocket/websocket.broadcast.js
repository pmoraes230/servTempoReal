const WebSocket = require("ws");
const { getClientsByChannel } = require("./websocket.clients").default;

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
    if (client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(serialized);
      delivered += 1;
    }
  }

  return { delivered };
}

module.exports = {
  broadcastToChannel,
};
