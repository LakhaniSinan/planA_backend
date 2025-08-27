const jwt = require("jsonwebtoken");
const User = require("../model/user/userModel");
const Admin = require("../model/admin/adminModel");

const verifyOptionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return next(); // no token

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if it's a user
    const user = await User.findById(decoded.id)
    if (user) {
      req.user = user; // user object with promo
      return next();
    }

    // Check if it's an admin
    const admin = await Admin.findById(decoded.id).select("-password");
    if (admin) {
      req.user = admin; // attach admin to req.user for shared logic
      return next();
    }

    // Token valid but no matching user/admin
    return next();
  } catch (err) {
    console.log("Optional auth failed:", err.message);
  }
};

export default verifyOptionalAuth;
