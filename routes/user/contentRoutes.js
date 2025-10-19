// routes/user/contentRoutes.js
import express from "express";
import {
  getTerms,
  getPrivacy,
  getAbout,
} from "../../controller/user/contentController.js";

const router = express.Router();

router.get("/terms", getTerms);
router.get("/privacy", getPrivacy);
router.get("/about-us", getAbout);

export default router;