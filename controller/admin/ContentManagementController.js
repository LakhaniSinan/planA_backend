// controller/admin/contentController.js
import Content from "../../model/user/contentModel.js";
import { successHelper, errorHelper } from "../../utilities/helpers.js";

// Create or update terms
const createOrUpdateTerms = async (req, res) => {
  try {
    const { title, content, version } = req.body;

    if (!title || !content) {
      return errorHelper(res, null, "Title and content are required", 400);
    }

    const terms = await Content.findOneAndUpdate(
      { type: "terms" },
      { 
        title, 
        content, 
        version: version || "1.0",
        isActive: true 
      },
      { 
        new: true, 
        upsert: true // Create if doesn't exist
      }
    );

    return successHelper(res, terms, "Terms updated successfully");
  } catch (error) {
    return errorHelper(res, error, "Failed to update terms");
  }
};

// Create or update privacy policy
const createOrUpdatePrivacy = async (req, res) => {
  try {
    const { title, content, version } = req.body;

    if (!title || !content) {
      return errorHelper(res, null, "Title and content are required", 400);
    }

    const privacy = await Content.findOneAndUpdate(
      { type: "privacy" },
      { 
        title, 
        content, 
        version: version || "1.0",
        isActive: true 
      },
      { 
        new: true, 
        upsert: true
      }
    );

    return successHelper(res, privacy, "Privacy policy updated successfully");
  } catch (error) {
    return errorHelper(res, error, "Failed to update privacy policy");
  }
};

export {
  createOrUpdateTerms,
  createOrUpdatePrivacy,
};