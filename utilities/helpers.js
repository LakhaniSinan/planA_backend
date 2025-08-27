import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
// Standard success response
const successHelper = (res, data, message, status = 200) => {
  res.status(status).json({
    data,
    status: "success",
    message,
  });
};

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Standard error response
const errorHelper = (res, error, message, status = 400) => {
  console.error("Error:", error);
  res.status(status).json({
    error,
    status: "error",
    message: message || "Something went wrong",
  });
};

// JWT token generation
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id }, // payload
    process.env.JWT_SECRET, // secret key
    { expiresIn: "1d" } // expires in 1 day
  );
};

const signToken = (data) => {
  return jwt.sign(data, process.env.JWT_SECRET, {
    expiresIn: '30m',
  });
};


export {
  successHelper,
  errorHelper,
  generateToken,
  hashPassword,
  signToken
};
