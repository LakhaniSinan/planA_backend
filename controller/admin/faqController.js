import catchAsync from "../../utilities/catchAsync.js";
import FaqModel from "../../model/admin/faqModel.js";
import {
  createFAQSchema,
  updateFAQSchema,
} from "../../utilities/validation.js";
import { schemaValidator } from "../../middleware/schemaMiddleware.js";
import { successHelper } from "../../utilities/helpers.js";
import { AppError } from "../../middleware/errorMiddleware.js";

const createFAQ = catchAsync(async (req, res, next) => {
  const [error, validatedData] = schemaValidator(req.body, createFAQSchema);
  if (error) return next(new AppError(error, 400));
  const faq = await FaqModel.create(validatedData);
  successHelper(res, faq, "FAQ created successfully");
});

const updateFAQ = catchAsync(async (req, res, next) => {
  const [error, validatedData] = schemaValidator(req.body, updateFAQSchema);
  if (error) return next(new AppError(error, 400));
  const faq = await FaqModel.findByIdAndUpdate(req.params.id, validatedData, {
    new: true,
  });
  successHelper(res, faq, "FAQ updated successfully");
});

const getAllFAQs = catchAsync(async (req, res) => {
  const faqs = await FaqModel.find().sort({ order: 1, createdAt: -1 });
  successHelper(res, faqs, "FAQs fetched successfully");
});

const getFAQById = catchAsync(async (req, res) => {
  const faq = await FaqModel.findById(req.params.id).sort({
    order: 1,
    createdAt: -1,
  });
  successHelper(res, faq, "FAQ fetched successfully");
});

const deleteFAQ = catchAsync(async (req, res, next) => {
  const faq = await FaqModel.findByIdAndDelete(req.params.id);
  successHelper(res, faq, "FAQ deleted successfully");
});

export { createFAQ, updateFAQ, getAllFAQs, getFAQById, deleteFAQ };
