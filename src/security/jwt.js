import { createHmac, timingSafeEqual } from "crypto";

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );

  return Buffer.from(padded, "base64").toString("utf8");
}

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function verifyHs256Jwt(token, secret) {
  const parts = String(token || "").split(".");

  if (parts.length !== 3) {
    return { valid: false, reason: "Invalid token format" };
  }

  try {
    const [encodedHeader, encodedPayload, signature] = parts;
    const header = JSON.parse(base64UrlDecode(encodedHeader));

    if (header.alg !== "HS256") {
      return { valid: false, reason: "Unsupported token algorithm" };
    }

    const expectedSignature = base64UrlEncode(
      createHmac("sha256", secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest(),
    );

    const received = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);

    if (
      received.length !== expected.length ||
      !timingSafeEqual(received, expected)
    ) {
      return { valid: false, reason: "Invalid token signature" };
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return { valid: false, reason: "Token expired" };
    }

    return { valid: true, payload };
  } catch (error) {
    return { valid: false, reason: "Invalid token payload" };
  }
}

export default {
  verifyHs256Jwt,
};
