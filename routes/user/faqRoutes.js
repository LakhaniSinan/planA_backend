// routes/user/faqRoutes.js
import express from "express";
import {
  getFAQs,
  getFAQCategories,
} from "../../controller/user/faqController.js";

const router = express.Router();

// Public routes (no auth needed for FAQs)
router.get("/", getFAQs);
router.get("/categories", getFAQCategories);

export default router;