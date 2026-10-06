import { registerUser } from "../services/auth.service.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const register = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body);

  return res.status(201).json({
    success: true,
    message: "User registered successfully.",
    data: user,
  });
});

export { register };
