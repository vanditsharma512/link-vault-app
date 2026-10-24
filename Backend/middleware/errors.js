/**
 * 404 handler for unknown /api/* endpoints.
 */
function apiNotFoundHandler(req, res, next) {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "The requested API endpoint was not found"
    }
  });
}

/**
 * Central error handler for API and server errors.
 * Logs server-side without secrets and returns standard error shape to client.
 */
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const code = err.code || (status === 500 ? "INTERNAL_SERVER_ERROR" : "BAD_REQUEST");
  const message = status === 500 ? "An unexpected server error occurred" : (err.message || "Bad Request");

  // Log error server-side without exposing internal sensitive details
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message || err);

  res.status(status).json({
    error: {
      code,
      message
    }
  });
}

module.exports = {
  apiNotFoundHandler,
  errorHandler
};
