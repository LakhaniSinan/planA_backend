// controller/admin/faqController.js
import FAQ from "../../model/user/faqModel.js";
import { successHelper, errorHelper } from "../../utilities/helpers.js";

// Create new FAQ
const createFAQ = async (req, res) => {
  try {
    const { question, answer, category, order } = req.body;

    if (!question || !answer) {
      return errorHelper(res, null, "Question and answer are required", 400);
    }

    const faq = await FAQ.create({
      question,
      answer,
      category: category || "general",
      order: order || 0
    });

    return successHelper(res, faq, "FAQ created successfully", 201);
  } catch (error) {
    return errorHelper(res, error, "Failed to create FAQ");
  }
};

// Update FAQ
const updateFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const faq = await FAQ.findByIdAndUpdate(id, updates, { new: true });

    if (!faq) {
      return errorHelper(res, null, "FAQ not found", 404);
    }

    return successHelper(res, faq, "FAQ updated successfully");
  } catch (error) {
    return errorHelper(res, error, "Failed to update FAQ");
  }
};

// Delete FAQ
const deleteFAQ = async (req, res) => {
  try {
    const { id } = req.params;

    const faq = await FAQ.findByIdAndDelete(id);

    if (!faq) {
      return errorHelper(res, null, "FAQ not found", 404);
    }

    return successHelper(res, faq, "FAQ deleted successfully");
  } catch (error) {
    return errorHelper(res, error, "Failed to delete FAQ");
  }
};

// Get all FAQs (for admin management)
const getAllFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find().sort({ order: 1, createdAt: -1 });

    return successHelper(res, faqs, "FAQs fetched successfully");
  } catch (error) {
    return errorHelper(res, error, "Failed to fetch FAQs");
  }
};

export {
  createFAQ,
  updateFAQ,
  deleteFAQ,
  getAllFAQs,
};