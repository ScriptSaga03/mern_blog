import express from "express";
import {
  registerController,
  loginController,
  getMeController,
  adminTestController,
  verifyEmailController,
  resendVerificationEmailController,
  resendLoginOtpController,
  verifyLoginOtpController,
} from "../controllers/auth.controller.js";
import {
  challengeIdValidationRules,
  emailValidationRules,
  loginValidationRules,
  otpValidationRules,
  registerValidationRules as registerValidation,
} from "../validators/auth.validator.js";
import { validationMiddleware } from "../middleware/validation.middleware.js";
import { isAuthenticatedUser } from "../middleware/isAuthenticatedUser.middleware.js";
import authorizedRole from "../middleware/isAuthorizedRole.middleware.js";
import {
  loginLimiter,
  registerLimiter,
  resendOTPLimiter,
  resendVerificationLinkLimiter,
  verifyOTPLimiter,
} from "../middleware/rateLimitter.middleware.js";

// CREATE EXPRESS ROUTER
const router = express.Router();

// AUTHENTICATION ROUTES

// REGISTER
router.post(
  "/register",
  registerLimiter,
  registerValidation,
  validationMiddleware,
  registerController,
);


// VERIFY EMAIL
router.get("/verify-email", verifyEmailController);
// RESEND EMAIL VERIFICATION LINK
router.post(
  "/resend-verification",
  resendVerificationLinkLimiter,
  emailValidationRules,
  validationMiddleware,
  resendVerificationEmailController,
);

// LOGIN
router.post(
  "/login",
  loginLimiter,
  loginValidationRules,
  validationMiddleware,
  loginController,
);

router.post(
  "/verify-login-otp",
  // verifyOTPLimiter,
  emailValidationRules,
  otpValidationRules,
  challengeIdValidationRules,
  validationMiddleware,
  verifyLoginOtpController,
);

// RESEND OTP FOR LOGIN
router.post(
  "/resend-login-otp",
  resendOTPLimiter,
  emailValidationRules,
  challengeIdValidationRules,
  validationMiddleware,
  resendLoginOtpController,
);

// ME
router.get("/me", isAuthenticatedUser, getMeController);
// RBAC
router.get(
  "/admin-test",
  isAuthenticatedUser,
  authorizedRole("admin"),
  adminTestController,
);

export default router;
