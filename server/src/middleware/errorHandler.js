
const centralizedErrorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = "Internal Server Error";

  if (err.code === 11000) {
    // MongoDB duplicate key
    statusCode = 409;
    message = "A record with this value already exists.";
  } else if (err.name === "ValidationError") {
    // Mongoose validation
    statusCode = 400;
    message = "Database validation failed.";
  } else if (err.name === "CastError") {
    // Invalid MongoDB ObjectId
    statusCode = 400;
    message = "Invalid resource ID.";
  } else if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    "body" in err
  ) {
    // Invalid JSON
    statusCode = 400;
    message = "Invalid JSON request body.";
  } else if (
    Number.isInteger(err.statusCode) &&
    err.statusCode >= 400 &&
    err.statusCode <= 599
  ) {
    // Custom AppError
    statusCode = err.statusCode;
    message = err.message;
  }

  const status =
    statusCode >= 400 && statusCode < 500 ? "Fail" : "Error";

  return res.status(statusCode).json({
    success: false,
    status,
    statusCode,
    message,
  });
};

export { centralizedErrorHandler };
