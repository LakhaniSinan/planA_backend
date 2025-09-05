import User from "../../model/user/Model.js";
import Interest from "../../model/loanManagement/intrestModel.js";
import sendEmail from "../../utilities/email.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Joi from "joi";
import {
  successHelper,
  errorHelper,
  hashPassword,
  generateToken,
} from "../../utilities/helpers.js";
import { generateOtp, hashOtp } from "../../utilities/otp.js";

const registerUser = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    // Validation schema
    const schema = Joi.object({
      email: Joi.string().email().required().messages({
        "string.email": "Please provide a valid email address",
        "any.required": "Email is required",
      }),
      password: Joi.string()
        .min(8)
        .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])"))
        .required()
        .messages({
          "string.min": "Password must be at least 8 characters long",
          "string.pattern.base":
            "Password must contain at least one uppercase letter, one lowercase letter, and one number",
          "any.required": "Password is required",
        }),
      confirmPassword: Joi.string()
        .valid(Joi.ref("password"))
        .required()
        .messages({
          "any.only": "Confirm password must match password",
          "any.required": "Confirm password is required",
        }),
    });

    // Validate request data
    const { error } = schema.validate({ email, password, confirmPassword });
    if (error) {
      return errorHelper(res, null, error.details[0].message, 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.emailVerified) {
      return errorHelper(
        res,
        null,
        "Email already registered and verified",
        400
      );
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Generate OTP
    const otp = generateOtp();
    const hashedOtp = hashOtp(otp);

    if (existingUser) {
      // Update existing unverified user
      existingUser.password = hashedPassword;
      existingUser.emailVerificationOtp = hashedOtp;
      existingUser.emailVerificationExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
      await existingUser.save();
    } else {
      // Get global default interest rate
      const latestInterest = await Interest.findOne().sort({
        effectiveDate: -1,
      });
      const defaultInterestRate = latestInterest ? latestInterest.rate : 5; // 5% fallback

      // Create new user with email, password, and OTP verification data
      await User.create({
        email,
        password: hashedPassword,
        emailVerificationOtp: hashedOtp,
        emailVerificationExpire: Date.now() + 10 * 60 * 1000, // 10 minutes
        emailVerified: false,
        profileCompleted: false,
        interestRate: defaultInterestRate, // Set default interest rate
      });
    }

    // Send OTP email
    const message = `Welcome to our platform!

Your email verification OTP is: ${otp}

This OTP will expire in 10 minutes.

Please verify your email to continue with your registration and complete your profile.

Thank you for joining us!`;

    await sendEmail(email, "Email Verification - OTP", message);

    return successHelper(
      res,
      { email },
      "Registration successful! OTP sent to your email. Please verify to continue.",
      201
    );
  } catch (error) {
    console.error("Registration error:", error);

    // Handle duplicate email error specifically
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return errorHelper(res, null, "Email already exists", 400);
    }

    return errorHelper(res, error, "Registration failed", 500);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validation
    const schema = Joi.object({
      email: Joi.string().email().required(),
      otp: Joi.string().length(6).required(),
    });

    const { error } = schema.validate({ email, otp });
    if (error) return errorHelper(res, null, error.details[0].message, 400);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return errorHelper(res, null, "User not found", 404);
    }

    if (user.emailVerified) {
      return errorHelper(res, null, "Email already verified", 400);
    }

    // Verify OTP
    const hashedOtp = hashOtp(otp);
    if (
      user.emailVerificationOtp !== hashedOtp ||
      !user.emailVerificationExpire ||
      user.emailVerificationExpire < Date.now()
    ) {
      return errorHelper(res, null, "Invalid or expired OTP", 400);
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationOtp = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    // Generate token for profile completion
    const token = generateToken(user);

    return successHelper(
      res,
      {
        user: { _id: user._id, email: user.email, emailVerified: true },
        token,
        nextStep: "complete_profile",
      },
      "Email verified successfully. Please complete your profile.",
      200
    );
  } catch (error) {
    console.error("OTP verification error:", error);
    return errorHelper(res, error, "OTP verification failed", 500);
  }
};

const completeProfile = async (req, res) => {
  try {
    const {
      fullName,
      dateOfBirth,
      phoneNumber,
      address,
      country,
      state,
      city,
      postalCode,
      governmentId,
    } = req.body;

    // Validation schema
    const schema = Joi.object({
      fullName: Joi.string().min(2).max(100).required(),
      dateOfBirth: Joi.date().max("now").required(),
      phoneNumber: Joi.string().min(10).max(15).required(),
      address: Joi.string().min(5).max(255).required(),
      country: Joi.string().min(2).max(50).required(),
      state: Joi.string().min(2).max(50).required(),
      city: Joi.string().min(2).max(50).required(),
      postalCode: Joi.string().min(3).max(10).required(),
      governmentId: Joi.string().uri().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) return errorHelper(res, null, error.details[0].message, 400);

    // Get user from token (middleware should have set req.user)
    const user = await User.findById(req.user._id);
    if (!user) return errorHelper(res, null, "User not found", 404);

    if (!user.emailVerified) {
      return errorHelper(res, null, "Please verify your email first", 400);
    }

    if (user.profileCompleted) {
      return errorHelper(res, null, "Profile already completed", 400);
    }

    // Hash password

    // Update user with profile data
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        fullName,
        name: fullName, // Keep backward compatibility
        dateOfBirth,
        phoneNumber,
        contactNumber: phoneNumber, // Keep backward compatibility
        address,
        country,
        state,
        city,
        postalCode,
        governmentId,
        profileCompleted: true,
      },
      { new: true }
    ).select("-password -emailVerificationOtp -resetPasswordOtp");

    // Generate new token for the completed profile
    const token = generateToken(updatedUser);

    return successHelper(
      res,
      { user: updatedUser, token },
      "Profile completed successfully! You can now access all features.",
      200
    );
  } catch (error) {
    console.error("Profile completion error:", error);
    return errorHelper(res, error, "Profile completion failed", 500);
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return errorHelper(res, null, "Email and password required", 400);

    const user = await User.findOne({ email }).select("+password");
    if (!user) return errorHelper(res, null, "User not found", 404);

    // Check if email is verified
    if (!user.emailVerified) {
      return errorHelper(res, null, "Please verify your email first", 400);
    }

    // Check if profile is completed
    if (!user.profileCompleted) {
      // Generate token for profile completion
      const token = generateToken(user);
      return successHelper(
        res,
        {
          user: { _id: user._id, email: user.email, emailVerified: true },
          token,
          nextStep: "complete_profile",
        },
        "Please complete your profile to continue",
        200
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return errorHelper(res, null, "Invalid credentials", 401);

    const token = generateToken(user);
    user.password = undefined;

    return successHelper(res, { user, token }, "Login successful");
  } catch (error) {
    return errorHelper(res, error, "Login failed", 500);
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const schema = Joi.object({
      email: Joi.string().email().required(),
    });

    const { error } = schema.validate({ email });
    if (error) return errorHelper(res, null, error.details[0].message, 400);

    const user = await User.findOne({ email });
    if (!user) return errorHelper(res, null, "User not found", 404);

    if (user.emailVerified) {
      return errorHelper(res, null, "Email already verified", 400);
    }

    // Generate new OTP
    const otp = generateOtp();
    const hashedOtp = hashOtp(otp);

    user.emailVerificationOtp = hashedOtp;
    user.emailVerificationExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send OTP email
    const message = `Your email verification OTP is: ${otp}\n\nIt will expire in 10 minutes.`;
    await sendEmail(email, "Email Verification - OTP (Resent)", message);

    return successHelper(res, null, "OTP resent successfully", 200);
  } catch (error) {
    console.error("Resend OTP error:", error);
    return errorHelper(res, error, "Failed to resend OTP", 500);
  }
};

const updateUser = async (req, res) => {
  const id = req.params.id;
  try {
    const updates = { ...req.body };
    if ("password" in updates) delete updates.password;
    if ("role" in updates) delete updates.role;
    if ("interestRate" in updates) delete updates.interestRate; // Prevent user from updating their own interest rate

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

const adminUpdateUser = async (req, res) => {
  const id = req.params.id;
  try {
    const updates = { ...req.body };
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

const adminChangePassword = async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorHelper(res, null, "Invalid user ID", 400);
  }
  try {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    const user = await User.findById(id).select("+password");
    console.log("User found:", user);

    if (!user) return errorHelper(res, null, "User not found", 404);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return errorHelper(res, null, "Old password incorrect", 400);

    if (newPassword !== confirmNewPassword) {
      console.log("New password and confirm new password do not match");
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

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return errorHelper(res, null, "Email is required", 400);

    const user = await User.findOne({ email });
    if (!user) return errorHelper(res, null, "User not found", 404);

    if (!user.emailVerified) {
      return errorHelper(res, null, "Please verify your email first", 400);
    }

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
  verifyOtp,
  completeProfile,
  resendOtp,
  loginUser,
  updateUser,
  forgotPassword,
  resetPassword,
  changePassword,
  deleteUser,
  getUsers,
  getUsersById,
  adminUpdateUser,
  adminChangePassword,
};
