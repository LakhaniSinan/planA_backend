import User from "../../model/user/Model.js";
import sendEmail from "../../utilities/email.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import {
  successHelper,
  errorHelper,
  hashPassword,
  generateToken,
} from "../../utilities/helpers.js";
import { generateOtp, hashOtp } from "../../utilities/otp.js";

const registerUser = async (req, res) => {
  try {
    const { name, email, password, contactNumber } = req.body;
    console.log("Request body:", req.body);

    if (!name || !email || !password || !contactNumber)
      return errorHelper(res, null, "All fields are required", 400);

    const existingUser = await User.findOne({ email });
    console.log("Existing user:", existingUser);

    if (existingUser)
      return errorHelper(res, null, "Email already registered", 400);

    const hashedPassword = await hashPassword(password);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      contactNumber,
    });

    console.log("New user created:", newUser);

    const token = generateToken(newUser);
    return successHelper(
      res,
      { user: newUser, token },
      "User registered successfully",
      201
    );
  } catch (error) {
    console.error(error);
    return errorHelper(res, error, "Registration failed", 500);
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return errorHelper(res, null, "Email and password required", 400);

    const user = await User.findOne({ email }).select("+password");
    if (!user) return errorHelper(res, null, "User not found", 404);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return errorHelper(res, null, "Invalid credentials", 401);

    const token = generateToken(user);
    user.password = undefined;

    return successHelper(res, { user, token }, "Login successful");
  } catch (error) {
    return errorHelper(res, error, "Login failed", 500);
  }
};

// Update user info
const updateUser = async (req, res) => {
  const id = req.params.id;
  try {
    const updates = { ...req.body };
    if ("password" in updates) delete updates.password;
    if ("role" in updates) delete updates.role;

    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) return errorHelper(res, null, "User not found", 404);

    return successHelper(res, updatedUser, "User updated successfully");
  } catch (error) {
    return errorHelper(res, error, "Update failed", 500);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return errorHelper(res, null, "Email is required", 400);

    const user = await User.findOne({ email });
    if (!user) return errorHelper(res, null, "User not found", 404);

    // Generate OTP
    const otp = generateOtp();
    const hashed = hashOtp(otp);

    // Save OTP + expiry (30 min) to user
    user.resetPasswordOtp = hashed;
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    // Send OTP via email
    const message = `Your password reset OTP is: ${otp}\n\nIt will expire in 30 minutes.`;
    await sendEmail(user.email, "Password Reset OTP", message);

    return successHelper(res, null, "OTP sent to email", 200);
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    return errorHelper(res, error, "Failed to send OTP", 500);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { otp, newPassword, confirmNewPassword, email } = req.body;

    if (!otp || !newPassword || !confirmNewPassword) {
      return errorHelper(
        res,
        null,
        "OTP, new password, and confirm password are required",
        400
      );
    }

    if (newPassword !== confirmNewPassword) {
      return errorHelper(res, null, "Passwords do not match", 400);
    }

    // Find the logged-in user from token
    const user = await User.findOne({ email });
    if (!user) return errorHelper(res, null, "User not found", 404);

    // Verify OTP
    const hashed = hashOtp(otp);
    if (
      user.resetPasswordOtp !== hashed ||
      !user.resetPasswordExpire ||
      user.resetPasswordExpire < Date.now()
    ) {
      return errorHelper(res, null, "Invalid or expired OTP", 400);
    }

    // Hash new password
    user.password = await hashPassword(newPassword);

    // Clear OTP fields
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return successHelper(res, null, "Password reset successfully", 200);
  } catch (error) {
    console.error("Error in resetPassword:", error);
    return errorHelper(res, error, "Reset password failed", 500);
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    if (!users.length) return errorHelper(res, null, "No users found", 404);

    return successHelper(res, users, "Users fetched successfully");
  } catch (error) {
    return errorHelper(res, error, "Failed to fetch users", 500);
  }
};

const getUsersById = async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorHelper(res, null, "Invalid user ID", 400);
  }
  try {
    const user = await User.findById(id).select("-password");
    if (!user) return errorHelper(res, null, "User not found", 404);
    return successHelper(res, user, "User fetched successfully", 200);
  } catch (error) {
    return errorHelper(res, error, "Failed to fetch user", 500);
  }
};

const changePassword = async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorHelper(res, null, "Invalid user ID", 400);
  }
  try {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;
    const user = await User.findById(id).select("+password");

    if (!user) return errorHelper(res, null, "User not found", 404);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return errorHelper(res, null, "Old password incorrect", 400);

    if (newPassword !== confirmNewPassword) {
      return errorHelper(
        res,
        "newPassword and confirmNewPassword don't match!",
        "newPassword and confirmNewPassword don't match!",
        400
      );
    }

    user.password = await hashPassword(newPassword);
    await user.save();

    return successHelper(res, null, "Password changed successfully");
  } catch (error) {
    return errorHelper(res, error, "Failed to change password", 500);
  }
};

const deleteUser = async (req, res) => {
  const id = req.params.id;
  try {
    let user = await User.findById(id);
    console.log("User found:", user);
    if (!user) {
      return errorHelper(res, null, "User not found", 404);
    }

    if (user.role === "admin")
      return errorHelper(res, null, "Cannot delete admin user", 403);

    const deletingUser = await User.findByIdAndDelete(id);
    console.log("User deleted successfully:", deletingUser);

    return successHelper(res, user, "User deleted successfully");
  } catch (error) {
    console.log("Error deleting user:", error);
    return errorHelper(res, error, "Delete failed", 500);
  }
};

export {
  registerUser,
  loginUser,
  updateUser,
  forgotPassword,
  resetPassword,
  changePassword,
  deleteUser,
  getUsers,
  getUsersById,
};
