
import { validationResult } from "express-validator";

export const validationMiddleware = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const extractedErrors = errors
      .array({ onlyFirstError: true })
      .map((err) => {
        return {
          field: err.path,
          message: err.msg,
        };
      });

    return res.status(400).json({
      success: false,
      status: "Fail",
      statusCode: 400,
      message: "Validation failed.",
      errors:extractedErrors
    });
  }
  return next();
};
