import { createServer } from "http";
import createApp from "./app";
import { port as _port, redisUrl } from "./config/env";
import { disconnectRedis } from "./config/redis";
import { attachWebSocketServer } from "./websocket/websocket.server";
import { info } from "./utils/logger";

const server = createServer();
const websocketGateway = attachWebSocketServer(server);
const app = createApp(websocketGateway);

server.on("request", app);

server.listen(_port, () => {
  info("Realtime server started", {
    port: _port,
    websocketUrl: `ws://localhost:${_port}`,
    redisEnabled: Boolean(redisUrl),
  });
});

async function shutdown(signal) {
  info("Shutting down server", { signal });

  server.close(async () => {
    await disconnectRedis();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
