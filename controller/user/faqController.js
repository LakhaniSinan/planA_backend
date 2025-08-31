// controller/user/faqController.js
import FAQ from "../../model/user/faqModel.js";
import { successHelper, errorHelper } from "../../utilities/helpers.js";

// Get all active FAQs
const getFAQs = async (req, res) => {
  try {
    const { category } = req.query;
    
    let query = { isActive: true };
    if (category) {
      query.category = category;
    }

    const faqs = await FAQ.find(query).sort({ order: 1, createdAt: -1 });

    return successHelper(res, faqs, "FAQs fetched successfully");
  } catch (error) {
    return errorHelper(res, error, "Failed to fetch FAQs");
  }
};

// Get FAQ categories
const getFAQCategories = async (req, res) => {
  try {
    const categories = await FAQ.distinct("category", { isActive: true });
    
    return successHelper(res, categories, "FAQ categories fetched successfully");
  } catch (error) {
    return errorHelper(res, error, "Failed to fetch FAQ categories");
  }
};

export {
  getFAQs,
  getFAQCategories,
};