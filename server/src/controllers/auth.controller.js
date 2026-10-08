import { loginUser, registerUser } from "../services/auth.service.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const register = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body);

  return res.status(201).json({
    success: true,
    message: "User registered successfully.",
    data: user,
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
            user: req.user
        }
    });
});

export { register, login , getMe, adminTest};
