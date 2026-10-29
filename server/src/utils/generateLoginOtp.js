import crypto from "node:crypto";



export const generateLoginOtp = () => {
  const otp = crypto.randomInt(100000, 1000000).toString();

  return {
    otp,
    otpHash: crypto
      .createHmac("sha256", process.env.OTP_SECRET)
      .update(otp)
      .digest("hex"),
  };
};
