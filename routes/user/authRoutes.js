import express from "express";
const router = express.Router();

import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  updateUser,
  changePassword,
  deleteUser,
  getUsers,
  getUsersById,
} from "../../controller/user/authController.js";

import { verifyUser } from "../../middleware/user/auth.js";

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/get", getUsers);
router.get("/get/:id", getUsersById);
router.post("/forgot", forgotPassword);
router.put("/reset-password", resetPassword);

// Protected routes
router.put("/update/:id", verifyUser, updateUser);
router.put("/change-password/:id", verifyUser, changePassword);
router.delete("/delete/:id", verifyUser, deleteUser);

export default router;
