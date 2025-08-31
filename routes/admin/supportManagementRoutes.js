// routes/admin/supportRoutes.js
import express from "express";
import {
  getAllSupportTickets,
  replyToTicket,
  updateTicketStatus,
} from "../../controller/admin/supportManagementController.js";
import verifyAdmin from "../../middleware/admin/auth.js";

const router = express.Router();

router.get("/fetch-all-tickets", verifyAdmin, getAllSupportTickets);
router.put("/reply-ticket/:id", verifyAdmin, replyToTicket);
router.put("/update/ticket-status/:id", verifyAdmin, updateTicketStatus);

export default router;