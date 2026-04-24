// src/utils/ApiResponse.js
// Every API response goes through one of these helpers
// Frontend can always expect the same shape: { success, data, message }
// This makes frontend error handling trivial

export const sendSuccess = (res, data = null, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendCreated = (res, data = null, message = "Created successfully") => {
  return sendSuccess(res, data, message, 201);
};

export const sendPaginated = (res, data, pagination, message = "Success") => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination, // { page, limit, total, totalPages }
  });
};

export const sendError = (res, statusCode = 500, message = "Something went wrong", code = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    code,
  });
};