import express from "express";
const router = express.Router();

import {
  registerUser,
  verifyOtp,
  completeProfile,
  resendOtp,
  loginUser,
  forgotPassword,
  resetPassword,
  updateUser,
  changePassword,
  deleteUser,
  getUsers,
  getUsersById,
  adminChangePassword,
  updateUserByAdmin,
  adminResetPassword,
} from "../../controller/user/authController.js";

import { verifyUser } from "../../middleware/user/auth.js";

// =============================================
// NEW OTP-based Registration Flow (Public routes)
// =============================================
router.post("/register", registerUser); // Step 1: Email only
router.post("/verify-otp", verifyOtp); // Step 2: Verify OTP
router.post("/resend-otp", resendOtp); // Resend OTP if needed

// Profile completion (requires token from OTP verification)
router.post("/complete-profile", verifyUser, completeProfile); // Step 3: Complete profile

// =============================================
// Existing routes (Public)
// =============================================
router.post("/login", loginUser);
router.get("/get", getUsers);
router.get("/get/:id", getUsersById);
router.post("/forgot", forgotPassword);
router.put("/reset-password", resetPassword);
router.put("/admin/update/:id", updateUserByAdmin);
router.put("/admin/change-password/:id", adminChangePassword);
router.put("/admin/reset-password/:id", adminResetPassword);

// =============================================
// Protected routes (require full authentication + profile completion)
// =============================================
router.put("/update/:id", verifyUser, updateUser);
router.put("/change-password/:id", verifyUser, changePassword);
router.delete("/delete/:id", verifyUser, deleteUser);

export default router;
