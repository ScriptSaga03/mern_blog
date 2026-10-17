const validateEnv = () => {
  const requiredVariables = [
    "MONGO_URI",
    "JWT_SECRET_KEY",
    "JWT_EXPIRED_IN",
  ];

  const missingVariables = requiredVariables.filter(
    (key) => !process.env[key]?.trim(),
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVariables.join(", ")}`,
    );
  }

  // Use a sufficiently long JWT secret
  if (process.env.JWT_SECRET_KEY.length < 32) {
    throw new Error("JWT_SECRET_KEY must be at least 32 characters long.");
  }

  // Accept explicit duration units to avoid ambiguous values like "120"
  const validExpiry = /^\d+(s|m|h|d|w|y)$/i;

  if (!validExpiry.test(process.env.JWT_EXPIRED_IN)) {
    throw new Error(
      "JWT_EXPIRED_IN must include a valid unit, such as 15m, 1h, or 7d.",
    );
  }
};


export {validateEnv}
