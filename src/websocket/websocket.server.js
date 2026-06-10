const WebSocket = require("ws");
const { authenticateRequest } = require("./websocket.auth");
const {
  addClient,
  removeClient,
  subscribeClient,
  unsubscribeClient,
  getStats,
} = require("./websocket.clients");
const {
  validateWebSocketMessage,
} = require("../validators/message.validator");
const { publishMessage } = require("../redis/publisher");
const { subscribeRedisChannel } = require("../redis/subscriber");
const logger = require("../utils/logger");

function sendJson(socket, message) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function attachWebSocketServer(server) {
  const wss = new WebSocket.Server({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const auth = authenticateRequest(request);

    if (!auth.authenticated) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  wss.on("connection", (socket, request) => {
    const client = addClient(socket, {
      ip: request.socket.remoteAddress,
      userAgent: request.headers["user-agent"],
    });

    logger.info("WebSocket client connected", { clientId: client.id });

    sendJson(socket, {
      event: "connected",
      clientId: client.id,
    });

    socket.on("message", async (rawMessage) => {
      const validation = validateWebSocketMessage(rawMessage);

      if (!validation.valid) {
        sendJson(socket, { event: "error", errors: validation.errors });
        return;
      }

      const message = validation.value;

      if (message.type === "subscribe") {
        subscribeClient(client, message.channel);
        await subscribeRedisChannel(message.channel);
        sendJson(socket, { event: "subscribed", channel: message.channel });
        return;
      }

      if (message.type === "unsubscribe") {
        unsubscribeClient(client, message.channel);
        sendJson(socket, { event: "unsubscribed", channel: message.channel });
        return;
      }

      if (message.type === "publish") {
        const result = await publishMessage(message);
        sendJson(socket, { event: "published", channel: message.channel, result });
      }
    });

    socket.on("close", () => {
      removeClient(client);
      logger.info("WebSocket client disconnected", { clientId: client.id });
    });

    socket.on("error", (error) => {
      logger.error("WebSocket client error", {
        clientId: client.id,
        error: error.message,
      });
    });
  });

  return {
    server: wss,
    getStats,
  };
}

module.exports = {
  attachWebSocketServer,
};
