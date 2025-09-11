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

export {
  loanRequestSchema,
  updateLoanRequestSchema,
  createFAQSchema,
  updateFAQSchema,
  updateSettingSchema,
};
