const http = require("http");
const createApp = require("./app");
const env = require("./config/env");
const { disconnectRedis } = require("./config/redis");
const { attachWebSocketServer } = require("./websocket/websocket.server");
const logger = require("./utils/logger");

const server = http.createServer();
const websocketGateway = attachWebSocketServer(server);
const app = createApp(websocketGateway);

server.on("request", app);

server.listen(env.port, () => {
  logger.info("Realtime server started", {
    port: env.port,
    websocketUrl: `ws://localhost:${env.port}`,
    redisEnabled: Boolean(env.redisUrl),
  });
});

async function shutdown(signal) {
  logger.info("Shutting down server", { signal });

  server.close(async () => {
    await disconnectRedis();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
