import rateLimit from "express-rate-limit";

const createLimiter = (windowMs, maxRequests, errorMessage) => {
  return rateLimit({
    windowMs,
    limit: maxRequests,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    ipv6Subnet: 60,

    handler: (req, res, next, options) => {
      return res.status(429).json({
        success: false,
        message: errorMessage,
        retryAfterMinutes: Math.ceil(windowMs / (60 * 1000)),
      });
    },
  });
};

// REGISTER LIMITER
const registerLimiter = createLimiter(
  10 * 60 * 1000,
  3,
  "Too many requests! Please try after 10 mins",
);

// RESEND EMAIL VERIFICATION LINK 
const resendVerificationLinkLimiter = createLimiter(
   15 * 60 * 1000,
  5,
  "Too many requests! Please try after 15 mins",
);



// LOGIN LIMITER
const loginLimiter = createLimiter(
  15 * 60 * 1000,
  5,
  "Too many requests! Please try after 15 mins",
);


// VERIFY OTP 
const verifyOTPLimiter  = createLimiter(
  10 * 60 * 1000,
  5,
  "Too many requests! Please try after 15 mins",
);

const resendOTPLimiter  = createLimiter(
  10 * 60 * 1000,
  5,
  "Too many requests! Please try after 15 mins",
);



// PRODUCT LIMITER
const getProductLimiter = createLimiter(
  60 * 60 * 1000,
  100,
  "Too many requests.",
);

// GLOBAL LIMITER FOR SERVER
const globalLimiter = createLimiter(60 * 60 * 1000, 100, "Too many requests.");

export { registerLimiter, loginLimiter, getProductLimiter , globalLimiter, resendVerificationLinkLimiter, verifyOTPLimiter, resendOTPLimiter};
