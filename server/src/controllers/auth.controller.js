import {
  loginUserService,
  registerUserService,
  verifyEmailService,
  resendVerificationEmailService,
  resendOtpService,
  verifyLoginOtpService,
} from "../services/auth.service.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

// USER REGISTER CONTROLLER
const registerController = asyncHandler(async (req, res) => {
  const user = await registerUserService(req.body);

  return res.status(201).json({
    success: true,
    message:
      "Registration successful! Please check your email and click the verification link to verify your account.",
    data: {
      name: user.name,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      token: user.emailVerificationToken,
    },
  });
});

// VERIFY EMAIL VERIFICATION CONTROLLER
const verifyEmailController = asyncHandler(async (req, res) => {
  const { token } = req.query;

  const result = await verifyEmailService(token);

  return res.status(200).json({
    success: true,
    statusCode: 200,
    message: "✅ Email verified successfully! You can now log in.",
    data: result,
  });
});

// RESEND EMAIL VERIFICATION EMAIL LINK
const resendVerificationEmailController = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const result = await resendVerificationEmailService(email);

  return res.status(200).json({
    success: true,
    message: result.message,
  });
});

// ======================= Login =======================
const loginController = asyncHandler(async (req, res) => {
  const result = await loginUserService(req.body);

  return res.status(200).json({
    success: true,
    statusCode: 200,
    message:
      "✅ Credentials verified. An OTP has been sent to your registered email.",
    data: result,
  });
});

// VERIFY LOGIN OTP CONTROLLER
const verifyLoginOtpController = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw AppError(400, "Email and OTP are required.");
  }

  const { user, token } = await verifyLoginOtpService({ email, otp });

  return res.status(200).json({
    success: true,
    message: "Login successful via OTP.",
    data: user,
    token,
  });
});

// RESEND OTP

const resendLoginOtpController = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await resendOtpService(email);

  return res.status(200).json({
    success: true,
    message: result.message,
  });
});

// ======================= Get Current User =======================
const getMeController = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Authentication successful.",
    data: {
      user: req.user,
    },
  });
});

// ======================= Admin Test =======================
const adminTestController = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Admin authorization successful.",
    data: {
      user: req.user,
    },
  });
});

export {
  registerController,
  loginController,
  getMeController,
  adminTestController,
  verifyEmailController,
  resendVerificationEmailController,
  verifyLoginOtpController,
  resendLoginOtpController,
};
