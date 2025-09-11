import express from "express";
import {
  getAllLoanRequest,
  getLoanInstallment,
  requestLoan,
  updateLoanRequest,
  makePayment
} from "../../controller/user/loanRequestController.js";

const router = express.Router();

router.post("/request-loan", requestLoan);
router.get("/request-loan", getAllLoanRequest);
router.put("/request-loan/status/:id", updateLoanRequest);
router.get("/request-loan/installment/:id/:userId", getLoanInstallment);
router.post("/make-payment", makePayment);

export default router;