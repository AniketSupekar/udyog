// src/utils/asyncHandler.js
// Wraps every async controller function
// Any thrown error (including ApiError) flows to globalErrorHandler
// Eliminates try/catch from every single controller — clean code

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;