export const centralizedErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";
  const status = statusCode >= 400 && statusCode < 500 ? "Fail" : "Error";

  return res.status(statusCode).json({
    success: false,
    status,
    statusCode,
    message,
  });
};
