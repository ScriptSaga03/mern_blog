import { loginUser, registerUser } from "../services/auth.service.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import AppError from "../utils/AppError.js";
import crypto from "node:crypto";
import User from "../model/user.model.js";

const register = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body);

  return res.status(201).json({
    success: true,
    message:
      "Registration successful! Please check your email and click the verification link to verify your account.",
    data: {
      name: user.name,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
    },
  });
});

// ======================= Email verification for registrain =======================
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token || typeof token !== "string") {
    throw AppError(400, "Verification token is required.");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: new Date() },
  }).select("+emailVerificationToken +emailVerificationExpires");

  if (!user) {
    throw AppError(400, "Verification link is invalid or has expired.");
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Email verified successfully. You can now log in.",
  });
});

// ======================= Login =======================
const login = asyncHandler(async (req, res) => {
  const { user, token } = await loginUser(req.body);

  return res.status(200).json({
    success: true,
    message: "Login successful.",
    data: user,
    token,
  });
});

// ======================= Get Current User =======================
const getMe = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Authentication successful.",
    data: {
      user: req.user,
    },
  });
});

// ======================= Admin Test =======================
const adminTest = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Admin authorization successful.",
    data: {
      user: req.user,
    },
  });
});

export { register, login, getMe, adminTest, verifyEmail };
