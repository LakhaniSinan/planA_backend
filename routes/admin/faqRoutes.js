import express from "express";
import {
  createFAQ,
  deleteFAQ,
  getAllFAQs,
  getFAQById,
  updateFAQ,
} from "../../controller/admin/faqController.js";

const router = express.Router();

router.post("/faq/create", createFAQ);
router.get("/faq/fetch", getAllFAQs);
router.get("/faq/fetch/:id", getFAQById);
router.put("/faq/update/:id", updateFAQ);
router.delete("/faq/delete/:id", deleteFAQ);

export default router;
