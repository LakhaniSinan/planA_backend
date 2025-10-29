import express from "express";
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
  sendRequestAndSupport,
  googleLogin,
  updateFcmToken,
} from "../../controller/user/authController.js";
const router = express.Router();

import { verifyUser } from "../../middleware/user/auth.js";

router.post("/register", registerUser);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

router.post("/complete-profile", verifyUser, completeProfile);

router.post("/login", loginUser);
router.get("/get", getUsers);
router.get("/get/:id", getUsersById);
router.post("/forgot", forgotPassword);
router.put("/reset-password", resetPassword);
router.put("/admin/update/:id", updateUserByAdmin);
router.put("/admin/change-password/:id", adminChangePassword);
router.put("/admin/reset-password/:id", adminResetPassword);
router.put("/change-password/:id", changePassword);
router.post("/send-request-and-support", sendRequestAndSupport);
router.put("/update/:id", updateUser);
router.delete("/delete/:id", verifyUser, deleteUser);
router.post("/google-login", googleLogin);
router.put("/update-fcm/:id", updateFcmToken);


export default router;
