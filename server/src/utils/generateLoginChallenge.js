import crypto from "node:crypto";

export const generateLoginChallenge = () => {
  const challengeId = crypto.randomBytes(32).toString("hex");

  const challengeHash = crypto
    .createHash("sha256")
    .update(challengeId)
    .digest("hex");

  return {
    challengeId,
    challengeHash,
  };
};