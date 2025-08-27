import express from "express";
import {
  getActiveLoans,
  getLoanDetails,
  getPreviousLoans,
  setGlobalInterestRate,
} from "../../controller/admin/adminLoanController.js";
import verifyAdmin from "../../middleware/admin/auth.js";

const router = express.Router();

// Admin fetches all active loans
router.get("/fetch", verifyAdmin, getActiveLoans);

// Admin fetches active loan for a specific user
router.get("/fetch/:userId", verifyAdmin, getLoanDetails);

// Admin fetches previous/completed loans for a user
router.get("/fetch/:userId/history", verifyAdmin, getPreviousLoans);

// Admin sets global interest rate for new loans
router.put("/update-interest", verifyAdmin, setGlobalInterestRate);


export default router;
