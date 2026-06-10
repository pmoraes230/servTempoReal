import { error as _error } from "../utils/logger";

function notFoundMiddleware(request, response) {
  response.status(404).json({
    error: "Not found",
    path: request.originalUrl,
  });
}

function errorMiddleware(error, request, response, next) {
  _error("Unhandled request error", {
    error: error.message,
    path: request.originalUrl,
  });

  response.status(error.status || 500).json({
    error: error.message || "Internal server error",
  });
}

export default {
  notFoundMiddleware,
  errorMiddleware,
};
