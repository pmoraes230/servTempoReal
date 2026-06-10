import { Router } from "express";
import { publishMessage } from "../redis/publisher";
// import default from "../websocket/websocket.auth";
// const { requireApiToken } = default;
import { validatePublishMessage } from "../validators/message.validator";

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
