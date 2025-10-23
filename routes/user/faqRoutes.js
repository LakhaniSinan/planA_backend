import express from "express";
import {
  getAllFAQs,
  getFAQById,
  getAllUserFAQs
} from "../../controller/admin/faqController.js";

const router = express.Router();

router.get("/faq/fetch-all", getAllUserFAQs);
router.get("/faq/:id", getFAQById);

export default router;
