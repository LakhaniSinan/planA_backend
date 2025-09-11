import express from "express";
import {
  createFAQ,
  deleteFAQ,
  getAllFAQs,
  getFAQById,
  updateFAQ,
} from "../../controller/admin/faqController.js";

const router = express.Router();

router.post("/faq", createFAQ);
router.get("/faq", getAllFAQs);
router.put("/faq/:id", updateFAQ);
router.get("/faq/:id", getFAQById);
router.delete("/faq/:id", deleteFAQ);

export default router;
