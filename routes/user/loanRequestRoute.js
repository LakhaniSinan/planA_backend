import express from "express";
import {
  getAllLoanRequest,
  getLoanInstallment,
  requestLoan,
  updateLoanRequest,
  makePayment
} from "../../controller/user/loanRequestController.js";
import { verifyUser } from "../../middleware/user/auth.js";
const router = express.Router();

router.post("/request-loan", verifyUser,requestLoan);
router.get("/request-loan", getAllLoanRequest);
router.put("/request-loan/status/:id", updateLoanRequest);
router.get("/request-loan/installment/:id/:userId", getLoanInstallment);
router.post("/make-payment", makePayment);

export default router;