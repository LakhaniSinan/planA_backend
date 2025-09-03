// routes/admin/faqRoutes.js
import express from "express";
import {
  createFAQ,
  updateFAQ,
  deleteFAQ,
  getAllFAQs,
} from "../../controller/admin/faqManagementController.js";
import verifyAdmin from "../../middleware/admin/auth.js";

const router = express.Router();

router.post("/create", verifyAdmin, createFAQ);
router.put("/update/:id", verifyAdmin, updateFAQ);
router.delete("/delete/:id", verifyAdmin, deleteFAQ);
router.get("/fetch-all", getAllFAQs);

export default router;