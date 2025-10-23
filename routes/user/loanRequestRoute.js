import express from "express";
import {
  getAllLoanRequest,
  getLoanInstallment,
  requestLoan,
  updateLoanRequest,
  makePayment,
  getUserHistory,
  fetchAllLoans
} from "../../controller/user/loanRequestController.js";
import { verifyUser } from "../../middleware/user/auth.js";
import verifyAdmin from "../../middleware/admin/auth.js";
const router = express.Router();

router.post("/request-loan", verifyUser,requestLoan);
router.get("/request-loan", getAllLoanRequest);
router.put("/request-loan/status/:loanId", updateLoanRequest);
router.get("/request-loan/installment/:id/:userId", getLoanInstallment);
router.post("/make-payment",verifyUser, makePayment);
router.get("/loan-history/:userId", verifyUser, getUserHistory);
router.get("/fetch-loan-history/:userId", verifyUser, fetchAllLoans);

export default router;