import { rateLimitWindowMs, rateLimitMax } from "../config/env";

const hits = new Map();

function rateLimitMiddleware(request, response, next) {
  const key = request.ip || request.socket.remoteAddress || "unknown";
  const now = Date.now();
  const current = hits.get(key);

  if (!current || current.resetAt <= now) {
    hits.set(key, {
      count: 1,
      resetAt: now + rateLimitWindowMs,
    });
    next();
    return;
  }

  current.count += 1;

  if (current.count > rateLimitMax) {
    response.status(429).json({ error: "Too many requests" });
    return;
  }

  next();
}

export default rateLimitMiddleware;
