// routes/user/supportRoutes.js
import express from "express";
import {
  createSupportTicket,
  getMySupportTickets,
  getSupportTicketById,
} from "../../controller/user/supportController.js";
import { verifyUser } from "../../middleware/user/auth.js";

const router = express.Router();

router.post("/contact-support", verifyUser, createSupportTicket);
router.get("/fetch-support-tickets", verifyUser, getMySupportTickets);
router.get("/fetch-support-ticket/:id", verifyUser, getSupportTicketById);

export default router;