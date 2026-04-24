// src/utils/ApiError.js
// Custom error class — every thrown error in this app uses this
// Gives us consistent HTTP status codes + error codes + messages
// The global error handler reads this to format the response

export class ApiError extends Error {
  constructor(statusCode, message, code = null, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;       // Machine-readable e.g. "ORDER_NOT_FOUND"
    this.errors = errors;   // Field-level validation errors
    this.isOperational = true; // Distinguish from unexpected crashes
  }

  // 400
  static badRequest(message, code = "BAD_REQUEST", errors = []) {
    return new ApiError(400, message, code, errors);
  }

  // 401
  static unauthorized(message = "Not authenticated") {
    return new ApiError(401, message, "UNAUTHORIZED");
  }

  // 403
  static forbidden(message = "Access denied") {
    return new ApiError(403, message, "FORBIDDEN");
  }

  // 404
  static notFound(message = "Resource not found") {
    return new ApiError(404, message, "NOT_FOUND");
  }

  // 409
  static conflict(message, code = "CONFLICT") {
    return new ApiError(409, message, code);
  }

  // 429
  static tooManyRequests(message = "Too many requests") {
    return new ApiError(429, message, "RATE_LIMITED");
  }

  // 500
  static internal(message = "Internal server error") {
    return new ApiError(500, message, "INTERNAL_ERROR");
  }
}