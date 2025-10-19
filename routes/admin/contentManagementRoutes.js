// routes/admin/contentRoutes.js
import express from "express";
import {
  createOrUpdateTerms,
  createOrUpdatePrivacy,
  createOrUpdateAbout
} from "../../controller/admin/ContentManagementController.js";
import verifyAdmin from "../../middleware/admin/auth.js";

const router = express.Router();

router.put("/terms", verifyAdmin, createOrUpdateTerms);
router.put("/privacy", verifyAdmin, createOrUpdatePrivacy);
router.put("/about-us", verifyAdmin, createOrUpdateAbout);


export default router;