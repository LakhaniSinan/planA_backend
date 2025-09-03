import express from "express";
import {
  getActiveLoans,
  getLoanDetails,
  getPreviousLoans,
  setGlobalInterestRate,
  updateLoanAvailableAmount,
  getLoanStatistics,
} from "../../controller/admin/adminLoanController.js";
import verifyAdmin from "../../middleware/admin/auth.js";

const router = express.Router();

// =============================================
// Loan Overview & Statistics
// =============================================

// Get loan statistics dashboard
router.get("/statistics", verifyAdmin, getLoanStatistics);

// Get all active loans with pagination and search (includes availableAmount)
router.get("/active", verifyAdmin, getActiveLoans);

// =============================================
// Individual Loan Management
// =============================================

// Get specific user's active loan details
router.get("/user/:userId/active", verifyAdmin, getLoanDetails);

// Get specific user's previous/completed loans
router.get("/user/:userId/previous", verifyAdmin, getPreviousLoans);

// Update loan's available amount (new feature)
router.put("/update-available-amount/:loanId", verifyAdmin, updateLoanAvailableAmount);

// =============================================
// Global Interest Rate Management
// =============================================

// Set global default interest rate
router.post("/set-global-interest-rate", verifyAdmin, setGlobalInterestRate);

export default router;