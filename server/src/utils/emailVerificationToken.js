
import crypto from "node:crypto";

export const generateEmailVerificationToken = () => {
  // Generate a cryptographically secure random token
  const token = crypto.randomBytes(32).toString("hex");

  // Hash the token before storing it in the database
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  return {
    token,
    hashedToken,
  };
};
