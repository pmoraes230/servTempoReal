import express, { json } from "express";
import cors from "cors";
import { corsOrigin } from "./config/env.js";
import publishRoutes from "./routes/publish.routes.js";
import rateLimitMiddleware from "./middlewares/rate-limit.middleware.js";
import { notFoundMiddleware, errorMiddleware } from "./middlewares/error.middleware.js";

function createApp(websocketGateway) {
  const app = express();

  app.use(cors({ origin: corsOrigin }));
  app.use(json({ limit: "1mb" }));
  app.use(rateLimitMiddleware);

  app.get("/health", (request, response) => {
    response.json({
      ok: true,
      websocket: websocketGateway.getStats(),
    });
  });

  app.use("/api", publishRoutes);
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}

export default createApp;
