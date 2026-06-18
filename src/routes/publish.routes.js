import { Router } from "express";
import { publishMessage } from "../redis/publisher.js";
import { requireApiToken } from "../websocket/websocket.auth.js";
import { validatePublishMessage } from "../validators/message.validator.js";

const router = Router();

router.post("/publish", requireApiToken, async (request, response, next) => {
  try {
    const validation = validatePublishMessage(request.body);

    if (!validation.valid) {
      response.status(400).json({ errors: validation.errors });
      return;
    }

    const result = await publishMessage(validation.value);

    response.status(202).json({
      ok: true,
      result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
