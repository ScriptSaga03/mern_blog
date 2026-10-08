import jwt from "jsonwebtoken";

const generateToken = (user) => {
    
  const payload = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const options = {
    expiresIn: process.env.JWT_EXPIRED_IN,
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET_KEY,
    options
  );
};

export { generateToken };