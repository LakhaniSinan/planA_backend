import express from "express";
import {
  registerAdmin,
  loginAdmin,
  changePassword,
  forgotPassword,
  resetPassword,
  getAdminDetails,
  updateAdminDetails,
} from "../../controller/admin/authController.js";
import verifyAdmin from "../../middleware/admin/auth.js";

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.put("/change-password", changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/get/details", getAdminDetails);
router.put("/update/details", updateAdminDetails);

export default router;
