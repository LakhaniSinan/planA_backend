import User from "../../model/user/Model.js";
import Interest from "../../model/loanManagement/intrestModel.js";
import sendEmail from "../../utilities/email.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import catchAsync from "../../utilities/catchAsync.js";
import {
  registerUserSchema,
  verifyOtpSchema,
  completeProfileSchema,
  loginUserSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  adminResetPasswordSchema,
} from "../../utilities/validation.js";
import {
  successHelper,
  errorHelper,
  hashPassword,
  generateToken,
} from "../../utilities/helpers.js";
import { generateOtp, hashOtp } from "../../utilities/otp.js";

const registerUser = catchAsync(async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  const { error } = registerUserSchema.validate({
    email,
    password,
    confirmPassword,
  });
  if (error) {
    return errorHelper(res, null, error.details[0].message, 400);
  }

  const existingUser = await User.findOne({ email });
  if (existingUser && existingUser.profileCompleted) {
    return errorHelper(res, null, "Email already registered and verified", 400);
  }

  const hashedPassword = await hashPassword(password);

  const otp = generateOtp();
  const hashedOtp = hashOtp(otp);

  if (existingUser) {
    existingUser.password = hashedPassword;
    existingUser.otp = hashedOtp;
    existingUser.otpExpire = Date.now() + 10 * 60 * 1000;
    await existingUser.save();
  } else {
    const latestInterest = await Interest.findOne().sort({
      effectiveDate: -1,
    });
    const defaultInterest = latestInterest ? latestInterest.rate : 10;

    await User.create({
      email,
      password: hashedPassword,
      otp: hashedOtp,
      otpExpire: Date.now() + 10 * 60 * 1000,
      profileCompleted: false,
      interest: defaultInterest,
    });
  }

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
});

const verifyOtp = catchAsync(async (req, res) => {
  const { email, otp } = req.body;

  const { error } = verifyOtpSchema.validate({ email, otp });
  if (error) return errorHelper(res, null, error.details[0].message, 400);

  const user = await User.findOne({ email });
  if (!user) {
    return errorHelper(res, null, "User not found", 404);
  }

  if (user.profileCompleted) {
    return errorHelper(res, null, "Email already verified", 400);
  }

  const hashedOtp = hashOtp(otp);
  if (
    user.otp !== hashedOtp ||
    !user.otpExpire ||
    user.otpExpire < Date.now()
  ) {
    return errorHelper(res, null, "Invalid or expired OTP", 400);
  }

  user.otp = undefined;
  user.otpExpire = undefined;
  await user.save();

  const token = generateToken(user);

  return successHelper(
    res,
    {
      user: { _id: user._id, email: user.email },
      token,
      nextStep: "complete_profile",
    },
    "Email verified successfully. Please complete your profile.",
    200
  );
});

const completeProfile = catchAsync(async (req, res) => {
  const {
    name,
    dateOfBirth,
    contactNumber,
    address,
    country,
    state,
    city,
    postalCode,
    governmentId,
  } = req.body;

  const { error } = completeProfileSchema.validate(req.body);
  if (error) return errorHelper(res, null, error.details[0].message, 400);

  const user = await User.findById(req.user._id);
  if (!user) return errorHelper(res, null, "User not found", 404);

  if (user.profileCompleted) {
    return errorHelper(res, null, "Profile already completed", 400);
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      name,
      dateOfBirth,
      contactNumber,
      address,
      country,
      state,
      city,
      postalCode,
      governmentId,
      profileCompleted: true,
    },
    { new: true }
  ).select("-password -otp");

  const token = generateToken(updatedUser);

  return successHelper(
    res,
    { user: updatedUser, token },
    "Profile completed successfully! You can now access all features.",
    200
  );
});

const loginUser = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const { error } = loginUserSchema.validate({ email, password });
  if (error) return errorHelper(res, null, error.details[0].message, 400);

  const user = await User.findOne({ email }).select("+password");
  if (!user) return errorHelper(res, null, "User not found", 404);

  if (!user.profileCompleted) {
    const token = generateToken(user);
    return successHelper(
      res,
      {
        user: { _id: user._id, email: user.email },
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
});

const resendOtp = catchAsync(async (req, res) => {
  const { email } = req.body;

  const { error } = resendOtpSchema.validate({ email });
  if (error) return errorHelper(res, null, error.details[0].message, 400);

  const user = await User.findOne({ email });
  if (!user) return errorHelper(res, null, "User not found", 404);

  if (user.profileCompleted) {
    return errorHelper(res, null, "Email already verified", 400);
  }

  const otp = generateOtp();
  const hashedOtp = hashOtp(otp);

  user.otp = hashedOtp;
  user.otpExpire = Date.now() + 10 * 60 * 1000;
  await user.save();

  const message = `Your email verification OTP is: ${otp}\n\nIt will expire in 10 minutes.`;
  await sendEmail(email, "Email Verification - OTP (Resent)", message);

  return successHelper(res, null, "OTP resent successfully", 200);
});

const updateUser = catchAsync(async (req, res) => {
  const id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorHelper(res, null, "Invalid user ID", 400);
  }

  const updates = { ...req.body };
  if ("password" in updates) delete updates.password;
  if ("interest" in updates) delete updates.interest;

  const updatedUser = await User.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!updatedUser) return errorHelper(res, null, "User not found", 404);

  return successHelper(res, updatedUser, "User updated successfully");
});

const adminChangePassword = catchAsync(async (req, res) => {
  const id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorHelper(res, null, "Invalid user ID", 400);
  }

  const { oldPassword, newPassword, confirmNewPassword } = req.body;

  const { error } = changePasswordSchema.validate({
    oldPassword,
    newPassword,
    confirmNewPassword,
  });
  if (error) return errorHelper(res, null, error.details[0].message, 400);

  const user = await User.findById(id).select("+password");
  if (!user) return errorHelper(res, null, "User not found", 404);

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) return errorHelper(res, null, "Old password incorrect", 400);

  user.password = await hashPassword(newPassword);
  await user.save();

  return successHelper(res, null, "Password changed successfully");
});

const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  const { error } = forgotPasswordSchema.validate({ email });
  if (error) return errorHelper(res, null, error.details[0].message, 400);

  const user = await User.findOne({ email });
  if (!user) return errorHelper(res, null, "User not found", 404);

  if (!user.profileCompleted) {
    return errorHelper(res, null, "Please complete your profile first", 400);
  }

  const otp = generateOtp();
  const hashed = hashOtp(otp);

  user.otp = hashed;
  user.otpExpire = Date.now() + 30 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  const message = `Your password reset OTP is: ${otp}\n\nIt will expire in 30 minutes.`;
  await sendEmail(user.email, "Password Reset OTP", message);

  return successHelper(res, null, "OTP sent to email", 200);
});

const resetPassword = catchAsync(async (req, res) => {
  const { otp, newPassword, confirmNewPassword, email } = req.body;

  const { error } = resetPasswordSchema.validate({
    otp,
    newPassword,
    confirmNewPassword,
    email,
  });
  if (error) return errorHelper(res, null, error.details[0].message, 400);

  const user = await User.findOne({ email });
  if (!user) return errorHelper(res, null, "User not found", 404);

  const hashed = hashOtp(otp);
  if (user.otp !== hashed || !user.otpExpire || user.otpExpire < Date.now()) {
    return errorHelper(res, null, "Invalid or expired OTP", 400);
  }

  user.password = await hashPassword(newPassword);

  user.otp = undefined;
  user.otpExpire = undefined;

  await user.save();

  return successHelper(res, null, "Password reset successfully", 200);
});

const getUsers = catchAsync(async (req, res) => {
  const users = await User.find().select("-password");

  if (!users.length) return errorHelper(res, null, "No users found", 404);

  return successHelper(res, users, "Users fetched successfully");
});

const getUsersById = catchAsync(async (req, res) => {
  const id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorHelper(res, null, "Invalid user ID", 400);
  }

  const user = await User.findById(id).select("-password");
  if (!user) return errorHelper(res, null, "User not found", 404);

  return successHelper(res, user, "User fetched successfully", 200);
});

const changePassword = catchAsync(async (req, res) => {
  const id = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorHelper(res, null, "Invalid user ID", 400);
  }

  const { oldPassword, newPassword, confirmNewPassword } = req.body;

  const { error } = changePasswordSchema.validate({
    oldPassword,
    newPassword,
    confirmNewPassword,
  });
  if (error) return errorHelper(res, null, error.details[0].message, 400);

  const user = await User.findById(id).select("+password");
  if (!user) return errorHelper(res, null, "User not found", 404);

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) return errorHelper(res, null, "Old password incorrect", 400);

  user.password = await hashPassword(newPassword);
  await user.save();

  return successHelper(res, null, "Password changed successfully");
});

const deleteUser = catchAsync(async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorHelper(res, null, "Invalid user ID", 400);
  }

  let user = await User.findById(id);
  if (!user) {
    return errorHelper(res, null, "User not found", 404);
  }

  if (user.role === "admin")
    return errorHelper(res, null, "Cannot delete admin user", 403);

  await User.findByIdAndDelete(id);

  return successHelper(res, user, "User deleted successfully");
});

const updateUserByAdmin = catchAsync(async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorHelper(res, null, "Invalid user ID", 400);
  }

  const user = await User.findById(id);
  if (!user) return errorHelper(res, null, "User not found", 404);

  if (req.body.loanLimit && user.loanLimit !== req.body.loanLimit) {
    user.history.push({
      message: `Loan limit updated to ${req.body.loanLimit}`,
      createdAt: Date.now(),
    });
  }

  if (req.body.interest && user.interest !== req.body.interest) {
    user.history.push({
      message: `Interest rate limit updated to ${req.body.interest}`,
      createdAt: Date.now(),
    });
  }

  const updates = { ...req.body, history: user.history };
  const updatedUser = await User.findByIdAndUpdate(id, updates, {
    new: true,
  }).select("-password");

  return successHelper(res, updatedUser, "User updated successfully");
});

const adminResetPassword = catchAsync(async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return errorHelper(res, null, "Invalid user ID", 400);
  }
  const { newPassword, confirmPassword } = req.body;

  const { error } = adminResetPasswordSchema.validate({
    newPassword,
    confirmPassword,
  });
  if (error) return errorHelper(res, null, error.details[0].message, 400);

  const user = await User.findById(id);
  if (!user) return errorHelper(res, null, "User not found", 404);

  user.password = await hashPassword(newPassword);
  await user.save();

  return successHelper(res, null, "Password reset successfully", 200);
});

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
  updateUserByAdmin,
  adminChangePassword,
  adminResetPassword,
};
