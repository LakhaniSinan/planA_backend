// routes/user/contentRoutes.js
import express from "express";
import {
  getTerms,
  getPrivacy,
} from "../../controller/user/contentController.js";

const router = express.Router();

// Public routes (no auth needed)
router.get("/terms", getTerms);
router.get("/privacy", getPrivacy);

export default router;