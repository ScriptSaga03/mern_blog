import bcrypt from "bcryptjs";
import path from "node:path";
import ejs from "ejs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import User from "../model/user.model.js";
import AppError from "../utils/AppError.js";
import { generateToken } from "../utils/generateToken.js";
import { generateEmailVerificationToken } from "../utils/emailVerificationToken.js";

import { sendMails } from "./email.service.js";
import { generateLoginOtp } from "../utils/generateLoginOtp.js";

// directiory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================== REGISTER USER SERVICE ===============================================
const registerUserService = async (userData) => {
  const { name, email, password } = userData;

  // 1 CHECK USER ALREADY EXIST
  const existingUser = await User.findOne({ email }).lean();
  if (existingUser) {
    throw AppError(409, "User with this email already exists!");
  }

  // 2 GENERATE SALT
  const salt = await bcrypt.genSalt(12);
  // 3 HASH PASSWORD
  const hashedPassword = await bcrypt.hash(password, salt);

  // 4 GENERATE SECURE VERIFICATION TOKEN
  const { token, hashedToken } = generateEmailVerificationToken();

  const emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);

  // 5 CREATE NEW USER
  let user;
  try {
    user = await User.create({
      name,
      email,
      password: hashedPassword,
      emailVerificationToken: hashedToken,
      emailVerificationExpires,
    });
  } catch (error) {
    if (error.code === 11000) {
      throw AppError(409, "User with this email already exists!");
    }
    throw error;
  }

  // 6 SEND VERIFICATION EMAIL
  const verificationUrl = `${process.env.BACKEND_URL}/api/v1/auth/verify-email?token=${token}`;

  // SEND EMAIL
  try {
    // HTML TEMPLATE
    const templatePath = path.join(
      __dirname,
      "..",
      "views",
      "templates",
      "emailVerificationPage.ejs",
    );

    const htmlContent = await ejs.renderFile(templatePath, {
      name: user.name,
      actionUrl: verificationUrl,
      expiresIn: "15 minutes",
      buttonText: "Verify Email Address",
    });

    await sendMails({
      email: user.email,
      subject: "Verify Your YoBlogger Account",
      message: `Hello ${user.name}, Please verify your email by clicking on this link: ${verificationUrl}`,
      template: htmlContent,
    });
  } catch (error) {
    console.error("❌ DETAILED EMAIL ERROR:", error);
    await User.findByIdAndDelete(user._id);
    throw AppError(500, "❌ Email could not be sent. Please try again later!");
  }

  // 7 SANITIZE RETURN OBJ
  const userResponse = user.toObject();
  //  REMOVE IMPORTANT FEILDS FROM RESPONSE
  delete userResponse.password;
  delete userResponse.emailVerificationToken;
  delete userResponse.emailVerificationExpires;

  // 8 RETURN USER
  return userResponse;
};

//============================================ VERIFY EMAIL SERVICE FOR REGISTRAITION ============================================
const verifyEmailService = async (plainToken) => {
  if (!plainToken) {
    throw AppError(400, "Verification token is missing!");
  }

  // 1. Hash incoming plain token to compare with DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(plainToken)
    .digest("hex");

  // 2. Find user with matching token and valid expiry

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  }).select("+emailVerificationToken +emailVerificationExpires");

  if (!user) {
    throw AppError(400, "❌ Invalid or expired verification token!");
  }

  // 3. Update user status & clear token fields
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;

  await user.save({ validateBeforeSave: false });

  return { email: user.email, isEmailVerified: user.isEmailVerified };
};

// ================================================ RESEND EMAIL SERVICE ================================================
const resendVerificationEmailService = async (email) => {
  const genericMessage =
    "If this account needs verification, a new email will be sent shortly.";

  //  1. Check if user exists
  const user = await User.findOne({ email });
  // Don't reveal whether the account exists or is verified.
  if (!user || user.isEmailVerified) {
    return { message: genericMessage };
  }

  // Generate new token
  const { token, hashedToken } = generateEmailVerificationToken();

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  //  Update user record with new token
  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpires = expiresAt;
  await user.save();

  const verificationUrl = `${process.env.BACKEND_URL}/api/v1/auth/verify-email?token=${token}`;

  try {
    const templatePath = path.join(
      __dirname,
      "..",
      "views",
      "templates",
      "emailVerificationPage.ejs",
    );

    const htmlContent = await ejs.renderFile(templatePath, {
      name: user.name,
      actionUrl: verificationUrl,
      expiresIn: "15 minutes",
      buttonText: "Verify Email Address",
    });

    await sendMails({
      email: user.email,
      subject: "Verify Your YoBlogger Account",
      message: `Hello ${user.name}, verify your email using this link: ${verificationUrl}`,
      template: htmlContent,
    });
  } catch (error) {
    // Invalidate the newly issued token if email delivery fails.
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    throw AppError(500, "Unable to send verification email.");
  }

  return { message: genericMessage };
};

// ================================================ Login Services ================================================
const loginUserService = async (userData) => {
  const { email, password } = userData;

  // 1 FETCH USER
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw AppError(401, "Invalid email or password!");
  }

  // 2 COMPARE PASSWORD
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw AppError(401, "Invalid email or password!");
  }

  // IS EMAIL ALREADY VERIFIED
  if (!user.isEmailVerified) {
    throw AppError(403, "Please verify your email before logging in,");
  }

  // GENERATE OTP AND IT'S HASH
  const { otp, otpHash } = generateLoginOtp();

  // GENERATE OTP HASH AND EXPIRY
  user.loginOtpHash = otpHash;
  user.loginOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
  user.loginOtpAttempts = 0;
  user.loginOtpLockedUntil = undefined;

  await user.save({ validateBeforeSave: false });

  // SEND EMAIL
  try {
    const templateData = path.join(
      __dirname,
      "..",
      "views",
      "templates",
      "loginOtpPage.ejs",
    );
    // convert ejs into html
    const htmlContent = await ejs.renderFile(templateData, {
      name: user.name,
      otp,
      expiresIn: "10 minutes",
    });

    await sendMails({
      email: user.email,
      subject: "Your YoBlogger Login OTP",
      message: `Your login OTP is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`,
      template: htmlContent,
    });
  } catch (error) {
    console.error("❌ LOGIN ERROR:", error);
    // Invalidate the OTP if email delivery fails
    user.loginOtpHash = undefined;
    user.loginOtpExpires = undefined;
    user.loginOtpAttempts = 0;

    await user.save({ validateBeforeSave: false });
    throw AppError(500, "Unable to send login OTP. Please try again.");
  }

  // Return non-sensitive payload for Step 2
  return {
    userId: user._id,
    email: user.email,
  };
};


// verifyLoginOtpService
const verifyLoginOtpService = async ({ email, otp }) => {
  // 1. Fetch user with OTP fields
  const user = await User.findOne({ email }).select(
    "+loginOtpHash +loginOtpExpires +loginOtpAttempts +loginOtpLockedUntil"
  );

  if (!user) {
    throw AppError(404, "User not found.");
  }

  // 2. Check if locked due to multiple failed attempts
  if (user.loginOtpLockedUntil && user.loginOtpLockedUntil > Date.now()) {
    throw AppError(429, "Account temporarily locked due to too many failed OTP attempts. Try again later.");
  }

  // 3. Check if OTP is expired
  if (!user.loginOtpExpires || user.loginOtpExpires < Date.now()) {
    throw AppError(400, "OTP has expired. Please request a new one.");
  }

  // 4. Hash incoming OTP to compare
  const incomingOtpHash = crypto
    .createHmac("sha256", process.env.OTP_SECRET)
    .update(otp)
    .digest("hex");

  // 5. Compare hashes
  if (incomingOtpHash !== user.loginOtpHash) {
    user.loginOtpAttempts += 1;

    // Lock account if attempts exceed 5
    if (user.loginOtpAttempts >= 5) {
      user.loginOtpLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
    }
    await user.save({ validateBeforeSave: false });

    throw AppError(400, "Invalid OTP. Please try again.");
  }

  // 6. Clear OTP fields upon successful verification
  user.loginOtpHash = undefined;
  user.loginOtpExpires = undefined;
  user.loginOtpAttempts = 0;
  user.loginOtpLockedUntil = undefined;
  await user.save({ validateBeforeSave: false });

  // 7. Generate final JWT Token
  const token = generateToken(user);

  return {
    user: {
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};



// RESEND OTP SERVICE
const resendOtpService = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw AppError(404, "User with this email does not exist");
  }

  // Check if email is verified first
  if (!user.isEmailVerified) {
    throw AppError(403, "Please verify your email before logging in.");
  }

  //  GENERATE NEW OTP
  const { otp, otpHash } = generateLoginOtp();
  // GENERATE OTP HASH AND EXPIRY
  user.loginOtpHash = otpHash;
  user.loginOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
  user.loginOtpAttempts = 0;
  user.loginOtpLockedUntil = undefined;
  await user.save({ validateBeforeSave: false });

  try {
    const templatePath = path.join(
      __dirname,
      "..",
      "views",
      "templates",
      "loginOtpPage.ejs",
    );

    const htmlContent = await ejs.renderFile(templatePath, {
      name: user.name,
      otp,
      expiresIn: "10 minutes",
    });

    await sendMails({
      email: user.email,
      subject: "Your New Login OTP - YoBlogger",
      message: `Your new login OTP is ${otp}. It expires in 10 minutes.`,
      template: htmlContent,
    });
  } catch (error) {
    user.loginOtpHash = undefined;
    user.loginOtpExpires = undefined;
    user.loginOtpAttempts = 0;
    user.loginOtpLockedUntil = undefined;
    await user.save({ validateBeforeSave: false });
    throw AppError(500, "Unable to send new OTP. Please try again.");
  }

  return { message: "New login OTP sent successfully to your email." };
};

// EXPORT
export {
  registerUserService,
  loginUserService,
  verifyEmailService,
  resendVerificationEmailService,
  resendOtpService,
  verifyLoginOtpService
};
