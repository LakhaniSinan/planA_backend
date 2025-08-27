import jwt from "jsonwebtoken";
import Admin from "../../model/admin/Model.js"; // Use capital 'U' to avoid collision
import { errorHelper } from "../../utilities/helpers.js";

const verifyAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return errorHelper(res, null, "Unauthorized: No token provided", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find admin by id, exclude password field for security
    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin) {
      return errorHelper(res, null, "Unauthorized: Admin not found", 401);
    }

    // Optional: verify role is admin, if you have roles in Admin schema
    if (admin.role !== "admin") {
      return errorHelper(res, null, "Forbidden: Not an admin", 403);
    }

    req.user = admin; // Attach admin object to request
    next();
  } catch (error) {
    return errorHelper(res, null, "Unauthorized: Invalid token", 401);
  }
};


export default verifyAdmin;
