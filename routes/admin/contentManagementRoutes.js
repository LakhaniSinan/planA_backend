// routes/admin/contentRoutes.js
import express from "express";
import {
  createOrUpdateTerms,
  createOrUpdatePrivacy,
} from "../../controller/admin/ContentManagementController.js";
import verifyAdmin from "../../middleware/admin/auth.js";

const router = express.Router();

router.put("/terms", verifyAdmin, createOrUpdateTerms);
router.put("/privacy", verifyAdmin, createOrUpdatePrivacy);

export default router;