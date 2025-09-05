import Admin from "../../model/admin/Model.js";
import bcrypt from "bcryptjs";
import {
  successHelper,
  errorHelper,
  hashPassword,
  generateToken,
} from "../../utilities/helpers.js";
import { generateOtp, hashOtp } from "../../utilities/otp.js";
import sendEmail from "../../utilities/email.js";

// Register admin
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return errorHelper(res, null, "All fields are required", 400);

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin)
      return errorHelper(res, null, "Email already registered", 400);

    const hashedPassword = await hashPassword(password);
    const newAdmin = await Admin.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = generateToken(newAdmin);

    return successHelper(
      res,
      { admin: newAdmin, token },
      "Admin registered successfully",
      201
    );
  } catch (error) {
    console.error(error);
    return errorHelper(res, error, "Admin registration failed", 500);
  }
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return errorHelper(res, null, "Email and password required", 400);

    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin) return errorHelper(res, null, "Admin not found", 404);

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return errorHelper(res, null, "Invalid credentials", 401);

    const token = generateToken(admin);
    admin.password = undefined;

    return successHelper(res, { admin, token }, "Admin login successful");
  } catch (error) {
    return errorHelper(res, error, "Admin login failed", 500);
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;
    const id = req.user._id;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return errorHelper(res, null, "All password fields are required", 400);
    }

    if (newPassword !== confirmNewPassword) {
      return errorHelper(
        res,
        null,
        "New password and confirm password do not match",
        400
      );
    }

    if (oldPassword === newPassword) {
      return errorHelper(
        res,
        null,
        "New password and Old Password must be different",
        400
      );
    }

    const admin = await Admin.findById(id).select("+password");
    if (!admin) return errorHelper(res, null, "Admin not found", 404);

    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) return errorHelper(res, null, "Old password incorrect", 400);

    admin.password = await hashPassword(newPassword);
    await admin.save();

    return successHelper(res, null, "Password changed successfully");
  } catch (error) {
    return errorHelper(res, error, "Failed to change password", 500);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return errorHelper(res, null, "Email is required", 400);

    const admin = await Admin.findOne({ email });
    if (!admin) return errorHelper(res, null, "Admin not found", 404);

    // Generate OTP
    const otp = generateOtp();
    const hashed = hashOtp(otp);

    // Save OTP + expiry (30 min) to admin
    admin.resetPasswordOtp = hashed;
    admin.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
    await admin.save({ validateBeforeSave: false });

    // Send OTP via email
    const message = `Your password reset OTP is: ${otp}\n\nIt will expire in 30 minutes.`;
    await sendEmail(admin.email, "Password Reset OTP", message);

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

    // Find the logged-in admin from token
    const admin = await Admin.findOne({ email });
    if (!admin) return errorHelper(res, null, "Admin not found", 404);

    // Verify OTP
    const hashed = hashOtp(otp);
    if (
      admin.resetPasswordOtp !== hashed ||
      !admin.resetPasswordExpire ||
      admin.resetPasswordExpire < Date.now()
    ) {
      return errorHelper(res, null, "Invalid or expired OTP", 400);
    }

    admin.password = await hashPassword(newPassword);

    admin.resetPasswordOtp = undefined;
    admin.resetPasswordExpire = undefined;

    await admin.save();

    return successHelper(res, null, "Password reset successfully", 200);
  } catch (error) {
    console.error("Error in resetPassword:", error);
    return errorHelper(res, error, "Reset password failed", 500);
  }
};

const getAdminDetails = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id);
    return successHelper(res, admin, "Admin details fetched successfully");
  } catch (error) {
    return errorHelper(res, error, "Failed to fetch admin details", 500);
  }
};

const updateAdminDetails = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndUpdate(req.user._id, req.body, {
      new: true,
    });
    return successHelper(res, admin, "Admin details updated successfully");
  } catch (error) {
    return errorHelper(res, error, "Failed to update admin details", 500);
  }
};

export {
  registerAdmin,
  loginAdmin,
  changePassword,
  forgotPassword,
  resetPassword,
  getAdminDetails,
  updateAdminDetails,
};
