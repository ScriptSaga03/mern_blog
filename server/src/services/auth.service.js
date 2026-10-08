import bcrypt from "bcryptjs";
import User from "../model/user.model.js";
import AppError from "../utils/AppError.js";
import {generateToken} from "../utils/generateToken.js"

const registerUser = async (userData) => {
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
  // 4 CREATE NEW USER
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  // 5 SENETIZE RETURN OBJ
  const userResponse = user.toObject();
  //   REMOVE PASSWORD FROM RESPONSE
  delete userResponse.password;

  // 6 RETURN USER
  return userResponse;
};

// ======================= Login Services =======================
const loginUser = async (userData) => {
  const { email, password } = userData;

  // 1 FETCH USER
  const user = await User.findOne({ email }).select("+password").lean();
  if (!user) {
    throw AppError(401, "Invalid email or password!");
  }

  // 2 COMPARE PASSWORD
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw AppError(401, "Invalid email or password!");
  }

  // 3 GENERATE JWT
  const token = generateToken(user)

  // Return LOGIN DATA
  return {
    user:{
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token
  };
};

// EXPORT
export { registerUser, loginUser };

// IMPORTANT
/*
findOne() matching user search karta hai.
.lean() result ko normal JavaScript object ke form mein deta hai, Mongoose document ke bajaye.
Humein yahan sirf check karna hai ki user exist karta hai ya nahi, isliye .lean() use karna bilkul theek hai.



===================== second ====================
Database mein password hashed form mein store hoga, lekin API response mein password — even hashed password — nahi jaana chahiye.

So response roughly aisa hona chahiye:

{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "_id": "...",
    "name": "Mehtab",
    "email": "mehtab@example.com",
    "role": "user",
    "createdAt": "...",
    "updatedAt": "..."
  }
}

Password completely absent. ✅
*/
