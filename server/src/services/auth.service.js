import bcrypt from "bcryptjs";
import User from "../model/user.model.js";
import AppError from "../utils/AppError.js";

const registerUser = async (userData) => {
  const { name, email, password } = userData;

  // CHECK USER ALREADY EXIST
  const existingUser = await User.findOne({ email }).lean();
  if (existingUser) {
    throw AppError(409, "User with this email already exists!");
  }

  //   Salt
  const salt = await bcrypt.genSalt(12);
  //   HASH PASSWORD
  const hashedPassword = await bcrypt.hash(password, salt);
  // CREATE NEW USER
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  // SENETIZE RETURN OBJ
  const userResponse = user.toObject();
  //   REMOVE PASSWORD FROM RESPONSE
  delete userResponse.password;

  //   RETURN USER
  return userResponse;
};

// EXPORT
export { registerUser };

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
