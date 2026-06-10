import { OPEN, Server } from "ws";
import { authenticateRequest } from "./websocket.auth";
import { addClient, removeClient, subscribeClient, unsubscribeClient, getStats } from "./websocket.clients";
import { validateWebSocketMessage } from "../validators/message.validator";
import { publishMessage } from "../redis/publisher";
import { subscribeRedisChannel } from "../redis/subscriber";
import { canSubscribe } from "../security/channel-policy";
import { jwtSecret, allowClientPublish } from "../config/env";
import { info, error as _error } from "../utils/logger";

function sendJson(socket, message) {
  if (socket.readyState === OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function attachWebSocketServer(server) {
  const wss = new Server({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const auth = authenticateRequest(request);

    if (!auth.authenticated) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    request.identity = auth.identity;

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  wss.on("connection", (socket, request) => {
    const client = addClient(socket, {
      ip: request.socket.remoteAddress,
      userAgent: request.headers["user-agent"],
      identity: request.identity,
    });

    info("WebSocket client connected", { clientId: client.id });

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
        if (jwtSecret && !canSubscribe(client.metadata.identity, message.channel)) {
          sendJson(socket, {
            event: "forbidden",
            channel: message.channel,
            reason: "You are not allowed to subscribe to this channel",
          });
          return;
        }

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
        if (!allowClientPublish) {
          sendJson(socket, {
            event: "forbidden",
            reason: "Client publish is disabled",
          });
          return;
        }

        const result = await publishMessage(message);
        sendJson(socket, { event: "published", channel: message.channel, result });
      }
    });

    socket.on("close", () => {
      removeClient(client);
      info("WebSocket client disconnected", { clientId: client.id });
    });

    socket.on("error", (error) => {
      _error("WebSocket client error", {
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

export default {
  attachWebSocketServer,
};
