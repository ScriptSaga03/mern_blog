import bcrypt from "bcryptjs";
import path from "node:path";
import ejs from "ejs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import User from "../model/user.model.js";
import AppError from "../utils/AppError.js";
import { generateToken } from "../utils/generateToken.js";
import { generateLoginChallenge } from "../utils/generateLoginChallenge.js";
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

  // 1. FETCH USER
  const user = await User.findOne({ email }).select(
    "+password +loginOtpAttempts +loginOtpLockedUntil",
  );

  if (!user) {
    throw AppError(401, "Invalid email or password!");
  }

  // 2. VERIFY PASSWORD
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw AppError(401, "Invalid email or password!");
  }

  // 3. CHECK EMAIL VERIFICATION
  if (!user.isEmailVerified) {
    throw AppError(403, "Please verify your email before logging in.");
  }

  // 4. CHECK ACTIVE OTP LOCKOUT
  if (user.loginOtpLockedUntil && user.loginOtpLockedUntil > new Date()) {
    const remainingTime = Math.ceil(
      (user.loginOtpLockedUntil.getTime() - Date.now()) / 1000,
    );

    throw AppError(
      429,
      `Too many attempts. Try again after ${Math.ceil(remainingTime / 60)} minutes.`,
    );
  }

  // 5. RESET EXPIRED LOCKOUT
  user.loginOtpAttempts = 0;
  user.loginOtpLockedUntil = undefined;

  // 6. GENERATE OTP AND CHALLENGE
  const { otp, otpHash } = generateLoginOtp();
  const { challengeId, challengeHash } = generateLoginChallenge();

  user.loginOtpHash = otpHash;
  user.loginOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
  user.loginChallengeHash = challengeHash;

  await user.save({ validateBeforeSave: false });

  // 7. SEND OTP EMAIL
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
      subject: "Your YoBlogger Login OTP",
      message: `Your login OTP is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`,
      template: htmlContent,
    });
  } catch (error) {
    user.loginOtpHash = undefined;
    user.loginOtpExpires = undefined;
    user.loginChallengeHash = undefined;

    await user.save({ validateBeforeSave: false });

    throw AppError(500, "Unable to send login OTP. Please try again.");
  }

  // 8. RETURN LOGIN CHALLENGE
  return {
    email: user.email,
    challengeId,
  };
};

// ========================================== VERIFY LOGIN OTP SERVICE ==========================================

// const verifyLoginOtpService = async ({ email, otp, challengeId }) => {
//   // 1. Validate required inputs
//   if (!challengeId || !otp) {
//     throw AppError(400, "OTP and login challenge are required.");
//   }

//   // 2. Find user with OTP and challenge fields
//   const user = await User.findOne({ email }).select(
//     "+loginOtpHash +loginOtpExpires +loginOtpAttempts +loginOtpLockedUntil +loginChallengeHash",
//   );

//   if (!user || !user.loginOtpHash || !user.loginChallengeHash) {
//     throw AppError(400, "Invalid or expired login challenge.");
//   }

//   // 3. Check OTP expiry
//   if (!user.loginOtpExpires || user.loginOtpExpires <= new Date()) {
//     throw AppError(400, "Invalid or expired OTP.");
//   }

//   // 4. Hash incoming challenge ID
//   const submittedChallengeHash = crypto
//     .createHash("sha256")
//     .update(challengeId)
//     .digest("hex");

//   // 4. Compare challenge hashes safely
//   const isChallengeValid = crypto.timingSafeEqual(
//     Buffer.from(submittedChallengeHash, "hex"),
//     Buffer.from(user.loginChallengeHash, "hex"),
//   );

//   if (!isChallengeValid) {
//     throw AppError(400, "Invalid or expired login challenge.");
//   }

//   // 6. Check temporary lock
//   if (user.loginOtpLockedUntil && user.loginOtpLockedUntil > new Date()) {
//     throw AppError(429, "Too many attempts. Try again later.");
//   }

//   // 7. Generate hash of submitted OTP
//   const submittedOtpHash = crypto
//     .createHmac("sha256", process.env.OTP_SECRET)
//     .update(otp)
//     .digest("hex");

//   // 8. Compare OTP hashes safely
//   const isOtpValid = crypto.timingSafeEqual(
//     Buffer.from(submittedOtpHash, "hex"),
//     Buffer.from(user.loginOtpHash, "hex"),
//   );

//   // 9. Handle incorrect OTP atomically
//   if (!isOtpValid) {
//     const now = new Date();

//     let updatedUser = await User.findOneAndUpdate(
//       {
//         _id: user._id,
//         loginOtpHash: user.loginOtpHash,
//         loginChallengeHash: user.loginChallengeHash,
//         loginOtpExpires: { $gt: now },
//         loginOtpAttempts: { $lt: 5 },
//         $or: [
//           { loginOtpLockedUntil: { $exists: false } },
//           { loginOtpLockedUntil: null },
//           { loginOtpLockedUntil: { $lte: now } },
//         ],
//       },
//       [
//         {
//           $set: {
//             loginOtpAttempts: {
//               $add: [{ $ifNull: ["$loginOtpAttempts", 0] }, 1],
//             },
//           },
//         },
//         {
//           $set: {
//             loginOtpLockedUntil: {
//               $cond: [
//                 { $gte: ["$loginOtpAttempts", 5] },
//                 new Date(now.getTime() + 15 * 60 * 1000),
//                 "$loginOtpLockedUntil",
//               ],
//             },
//           },
//         },
//       ],
//       {
//         returnDocument: "after",
//         updatePipeline: true,
//       },
//     ).select("+loginOtpAttempts +loginOtpLockedUntil");

//     if (!updatedUser) {
//       throw AppError(429, "Too many incorrect attempts. Try again later.");
//     }

//     if (updatedUser.loginOtpAttempts >= 5) {
//       throw AppError(
//         429,
//         "Too many incorrect attempts. Try again after 15 minutes.",
//       );
//     }

//     throw AppError(400, "Invalid or expired OTP.");
//   }

//   // 10. Consume OTP and challenge atomically
//   const now = new Date();

//   const verifiedUser = await User.findOneAndUpdate(
//     {
//       _id: user._id,
//       loginOtpHash: user.loginOtpHash,
//       loginChallengeHash: user.loginChallengeHash,
//       loginOtpExpires: { $gt: now },
//       loginOtpAttempts: { $lt: 5 },
//       $or: [
//         { loginOtpLockedUntil: { $exists: false } },
//         { loginOtpLockedUntil: null },
//         { loginOtpLockedUntil: { $lte: now } },
//       ],
//     },
//     {
//       $unset: {
//         loginOtpHash: 1,
//         loginOtpExpires: 1,
//         loginChallengeHash: 1,
//         loginOtpLockedUntil: 1,
//       },
//       $set: {
//         loginOtpAttempts: 0,
//       },
//     },
//     {
//       new: true,
//     },
//   ).select("name email role");

//   if (!verifiedUser) {
//     throw AppError(400, "Invalid or expired login challenge.");
//   }

//   // 11. Generate JWT only after successful verification
//   const token = generateToken(verifiedUser);

//   return {
//     user: {
//       userId: verifiedUser._id,
//       name: verifiedUser.name,
//       email: verifiedUser.email,
//       role: verifiedUser.role,
//     },
//     token,
//   };
// };

const verifyLoginOtpService = async ({ email, otp, challengeId }) => {
  // 1. Validate required inputs
  if (!challengeId || !otp) {
    throw AppError(400, "OTP and login challenge are required.");
  }

  // 2. Find user with OTP and challenge fields
  const user = await User.findOne({ email }).select(
    "+loginOtpHash +loginOtpExpires +loginOtpAttempts +loginOtpLockedUntil +loginChallengeHash",
  );

  if (!user || !user.loginOtpHash || !user.loginChallengeHash) {
    throw AppError(400, "Invalid or expired login challenge.");
  }

  // 3. Hash incoming challenge ID
  const submittedChallengeHash = crypto
    .createHash("sha256")
    .update(challengeId)
    .digest("hex");

  // 4. Compare challenge hashes safely
  const isChallengeValid = crypto.timingSafeEqual(
    Buffer.from(submittedChallengeHash, "hex"),
    Buffer.from(user.loginChallengeHash, "hex"),
  );

  if (!isChallengeValid) {
    throw AppError(400, "Invalid or expired login challenge.");
  }

  // 5. Check temporary lock
  if (
    user.loginOtpAttempts >= 5 ||
    (user.loginOtpLockedUntil &&
      user.loginOtpLockedUntil > new Date())
  ) {
    throw AppError(429, "Too many attempts. Try again later.");
  }

  // 6. Check OTP expiry
  if (!user.loginOtpExpires || user.loginOtpExpires <= new Date()) {
    throw AppError(400, "Invalid or expired OTP.");
  }

  // 7. Generate hash of submitted OTP
  const submittedOtpHash = crypto
    .createHmac("sha256", process.env.OTP_SECRET)
    .update(otp)
    .digest("hex");

  // 8. Compare OTP hashes safely
  const isOtpValid = crypto.timingSafeEqual(
    Buffer.from(submittedOtpHash, "hex"),
    Buffer.from(user.loginOtpHash, "hex"),
  );

  // 9. Handle incorrect OTP atomically
  if (!isOtpValid) {
    const now = new Date();

    let updatedUser = await User.findOneAndUpdate(
      {
        _id: user._id,
        loginOtpHash: user.loginOtpHash,
        loginChallengeHash: user.loginChallengeHash,
        loginOtpExpires: { $gt: now },
        loginOtpAttempts: { $lt: 5 },
        $or: [
          { loginOtpLockedUntil: { $exists: false } },
          { loginOtpLockedUntil: null },
          { loginOtpLockedUntil: { $lte: now } },
        ],
      },
      [
        {
          $set: {
            loginOtpAttempts: {
              $add: [{ $ifNull: ["$loginOtpAttempts", 0] }, 1],
            },
          },
        },
        {
          $set: {
            loginOtpLockedUntil: {
              $cond: [
                { $gte: ["$loginOtpAttempts", 5] },
                new Date(now.getTime() + 15 * 60 * 1000),
                "$loginOtpLockedUntil",
              ],
            },
          },
        },
      ],
      {
        returnDocument: "after",
        updatePipeline: true,
      },
    ).select("+loginOtpAttempts +loginOtpLockedUntil");

    if (!updatedUser) {
      throw AppError(429, "Too many incorrect attempts. Try again later.");
    }

    if (updatedUser.loginOtpAttempts >= 5) {
      throw AppError(
        429,
        "Too many incorrect attempts. Try again after 15 minutes.",
      );
    }

    throw AppError(400, "Invalid or expired OTP.");
  }

  // 10. Consume OTP and challenge atomically
  const now = new Date();

  const verifiedUser = await User.findOneAndUpdate(
    {
      _id: user._id,
      loginOtpHash: user.loginOtpHash,
      loginChallengeHash: user.loginChallengeHash,
      loginOtpExpires: { $gt: now },
      loginOtpAttempts: { $lt: 5 },
      $or: [
        { loginOtpLockedUntil: { $exists: false } },
        { loginOtpLockedUntil: null },
        { loginOtpLockedUntil: { $lte: now } },
      ],
    },
    {
      $unset: {
        loginOtpHash: 1,
        loginOtpExpires: 1,
        loginChallengeHash: 1,
        loginOtpLockedUntil: 1,
      },
      $set: {
        loginOtpAttempts: 0,
      },
    },
    {
      new: true,
    },
  ).select("name email role");

  if (!verifiedUser) {
    throw AppError(400, "Invalid or expired login challenge.");
  }

  // 11. Generate JWT only after successful verification
  const token = generateToken(verifiedUser);

  return {
    user: {
      userId: verifiedUser._id,
      name: verifiedUser.name,
      email: verifiedUser.email,
      role: verifiedUser.role,
    },
    token,
  };
};

// ************************************************ RESEND OTP SERVICE *********************************************************

const resendOtpService = async (email, challengeId) => {
  // 1. Validate challenge
  if (!challengeId) {
    throw AppError(400, "Login challenge is required.");
  }

  // 2. Find user and explicitly select security fields
  const user = await User.findOne({ email }).select(
    "+loginOtpHash +loginOtpExpires +loginOtpAttempts +loginOtpLockedUntil +loginChallengeHash",
  );

  if (!user || !user.loginChallengeHash || !user.loginOtpHash) {
    throw AppError(400, "Invalid or expired login challenge.");
  }

  // 3. Check email verification
  if (!user.isEmailVerified) {
    throw AppError(400, "Invalid or expired login challenge.");
  }

  // 4. Verify challenge ID
  const submittedChallengeHash = crypto
    .createHash("sha256")
    .update(challengeId)
    .digest("hex");

  const isChallengeValid = crypto.timingSafeEqual(
    Buffer.from(submittedChallengeHash, "hex"),
    Buffer.from(user.loginChallengeHash, "hex"),
  );

  if (!isChallengeValid) {
    throw AppError(400, "Invalid or expired login challenge.");
  }

  // 5. Check account lock
  if (user.loginOtpLockedUntil && user.loginOtpLockedUntil > new Date()) {
    throw AppError(429, "Too many attempts. Try again later.");
  }

  // 6. Check existing OTP expiry
  if (!user.loginOtpExpires || user.loginOtpExpires <= new Date()) {
    throw AppError(400, "Login challenge expired. Please login again.");
  }

  // 7. Generate new OTP
  const { otp, otpHash } = generateLoginOtp();

  user.loginOtpHash = otpHash;
  user.loginOtpExpires = new Date(Date.now() + 10 * 60 * 1000);

  await user.save({ validateBeforeSave: false });

  // 8. Send new OTP
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
      message: `Your new login OTP is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`,
      template: htmlContent,
    });
  } catch (error) {
    // Invalidate pending login challenge if email fails
    user.loginOtpHash = undefined;
    user.loginOtpExpires = undefined;
    user.loginChallengeHash = undefined;

    await user.save({ validateBeforeSave: false });

    throw AppError(500, "Unable to send new OTP. Please try again.");
  }

  return {
    message: "New login OTP sent successfully to your email.",
  };
};

// EXPORT
export {
  registerUserService,
  loginUserService,
  verifyEmailService,
  resendVerificationEmailService,
  resendOtpService,
  verifyLoginOtpService,
};
