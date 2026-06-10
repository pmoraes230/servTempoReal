import { URL } from "url";
import { jwtSecret, websocketToken, apiToken } from "../config/env";
import { verifyHs256Jwt } from "../security/jwt";

function getBearerToken(request) {
  const authorization = request.headers.authorization || "";

  if (authorization.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length);
  }

  return "";
}

function getRequestToken(request) {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  return requestUrl.searchParams.get("token") || getBearerToken(request);
}

function buildIdentityFromJwt(payload) {
  return {
    type: "user",
    userId: payload.user_id || payload.sub,
    role: payload.role || "user",
    permissions: payload.permissions || [],
    raw: payload,
  };
}

function authenticateRequest(request) {
  const token = getRequestToken(request);

  if (jwtSecret) {
    const jwt = verifyHs256Jwt(token, jwtSecret);

    if (!jwt.valid) {
      return { authenticated: false, reason: jwt.reason };
    }

    return {
      authenticated: true,
      identity: buildIdentityFromJwt(jwt.payload),
    };
  }

  if (websocketToken && token !== websocketToken) {
    return { authenticated: false, reason: "Invalid WebSocket token" };
  }

  return {
    authenticated: true,
    identity: websocketToken ? { type: "system" } : { type: "anonymous" },
  };
}

function requireApiToken(request, response, next) {
  if (!apiToken) {
    next();
    return;
  }

  const token = getBearerToken(request) || request.headers["x-api-token"];

  if (token !== apiToken) {
    response.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}

export default {
  authenticateRequest,
  requireApiToken,
};
