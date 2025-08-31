// controller/user/contentController.js
import Content from "../../model/user/contentModel.js";
import { successHelper, errorHelper } from "../../utilities/helpers.js";

// Get terms and conditions
const getTerms = async (req, res) => {
  try {
    const terms = await Content.findOne({ 
      type: "terms", 
      isActive: true 
    });

    if (!terms) {
      return errorHelper(res, null, "Terms and conditions not found", 404);
    }

    return successHelper(res, terms, "Terms fetched successfully");
  } catch (error) {
    return errorHelper(res, error, "Failed to fetch terms");
  }
};

// Get privacy policy
const getPrivacy = async (req, res) => {
  try {
    const privacy = await Content.findOne({ 
      type: "privacy", 
      isActive: true 
    });

    if (!privacy) {
      return errorHelper(res, null, "Privacy policy not found", 404);
    }

    return successHelper(res, privacy, "Privacy policy fetched successfully");
  } catch (error) {
    return errorHelper(res, error, "Failed to fetch privacy policy");
  }
};

export {
  getTerms,
  getPrivacy,
};