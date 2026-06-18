export function validatePublishMessage(body) {
  const errors = [];

  if (!body || typeof body !== "object") {
    return { valid: false, errors: ["Body must be a JSON object"] };
  }

  if (!body.channel || typeof body.channel !== "string") {
    errors.push("channel is required and must be a string");
  }

  if (body.payload === undefined) {
    errors.push("payload is required");
  }

  return {
    valid: errors.length === 0,
    errors,
    value: {
      channel: body.channel,
      event: typeof body.event === "string" ? body.event : "message",
      payload: body.payload,
    },
  };
}

export function validateWebSocketMessage(rawMessage) {
  try {
    const message = JSON.parse(rawMessage.toString());

    if (!message || typeof message !== "object") {
      return { valid: false, errors: ["Message must be a JSON object"] };
    }

    if (message.type === "subscribe" || message.type === "unsubscribe") {
      if (!message.channel || typeof message.channel !== "string") {
        return { valid: false, errors: ["channel is required"] };
      }

      return { valid: true, value: message };
    }

    if (message.type === "publish") {
      const result = validatePublishMessage(message);
      return {
        ...result,
        value: result.valid ? { type: "publish", ...result.value } : undefined,
      };
    }

    return { valid: false, errors: ["Unsupported message type"] };
  } catch (error) {
    return { valid: false, errors: ["Invalid JSON"] };
  }
}

export default {
  validatePublishMessage,
  validateWebSocketMessage,
};
