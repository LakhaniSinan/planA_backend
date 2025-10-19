import Joi from "joi";
import { Types } from "mongoose";

const validateMongoDbId = (value, helpers) => {
  if (!Types.ObjectId.isValid(value)) {
    return helpers.message("Invalid MongoDB ObjectId");
  }
  return value;
};

const loanRequestSchema = Joi.object({
  userId: Joi.string().custom(validateMongoDbId).required(),
  amount: Joi.number().required(),
  tenureType: Joi.string().valid("days", "months", "years").required(),
  tenureValue: Joi.number().required(),
}).unknown(false);

const updateLoanRequestSchema = Joi.object({
  status: Joi.string()
    .valid("pending", "approved", "rejected", "completed")
    .required(),
}).unknown(false);

const createFAQSchema = Joi.object({
  question: Joi.string().required(),
  answer: Joi.string().required(),
}).unknown(false);

const updateFAQSchema = Joi.object({
  question: Joi.string().optional(),
  answer: Joi.string().optional(),
  status: Joi.boolean().optional(),
  order: Joi.number().optional(),
}).unknown(false);

const updateSettingSchema = Joi.object({
  term: Joi.string().optional(),
  privacy: Joi.string().optional(),
  accountNumber: Joi.string().optional(),
  contact: Joi.string().optional(),
}).unknown(false);

 const registerUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
});

 const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
});

 const completeProfileSchema = Joi.object({
  name: Joi.string().required(),
  dateOfBirth: Joi.date().required(),
  contactNumber: Joi.string().required(),
  address: Joi.string().required(),
  country: Joi.string().required(),
  state: Joi.string().required(),
  city: Joi.string().required(),
  postalCode: Joi.string().required(),
  governmentId: Joi.string().required(),
});

 const loginUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

 const resendOtpSchema = Joi.object({
  email: Joi.string().email().required(),
});

 const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

 const resetPasswordSchema = Joi.object({
  otp: Joi.string().length(6).required(),
  newPassword: Joi.string().min(6).required(),
  confirmNewPassword: Joi.string().valid(Joi.ref("newPassword")).required(),
  email: Joi.string().email().required(),
});

 const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
  confirmNewPassword: Joi.string().valid(Joi.ref("newPassword")).required(),
});

 const adminResetPasswordSchema = Joi.object({
  newPassword: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required(),
});

export {
  loanRequestSchema,
  updateLoanRequestSchema,
  createFAQSchema,
  updateFAQSchema,
  updateSettingSchema,
  registerUserSchema,
  verifyOtpSchema,
  completeProfileSchema,
  loginUserSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  adminResetPasswordSchema,
  
};
