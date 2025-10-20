import express from "express";
import {
  getAllFAQs,
  getFAQById,
} from "../../controller/admin/faqController.js";

const router = express.Router();

router.get("/faq/fetch-all", getAllFAQs);
router.get("/faq/:id", getFAQById);

export default router;
