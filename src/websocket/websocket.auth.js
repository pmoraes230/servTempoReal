import { URL } from "url";
import { websocketToken, apiToken } from "../config/env";

function authenticateRequest(request) {
  if (!websocketToken) {
    return { authenticated: true };
  }

  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const tokenFromQuery = requestUrl.searchParams.get("token");
  const authorization = request.headers.authorization || "";
  const tokenFromHeader = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  const token = tokenFromQuery || tokenFromHeader;

  if (token !== websocketToken) {
    return { authenticated: false, reason: "Invalid WebSocket token" };
  }

  return { authenticated: true };
}

function requireApiToken(request, response, next) {
  if (!apiToken) {
    next();
    return;
  }

  const authorization = request.headers.authorization || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : request.headers["x-api-token"];

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
