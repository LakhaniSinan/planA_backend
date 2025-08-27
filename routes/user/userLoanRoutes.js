import express from "express";
import {
  getMyCurrentLoan,
  uploadRepaymentSlip,
  getMyRepayments,
  takeLoan,
  makeRepayment,
  getCurrentInterestRate
} from "../../controller/user/userLoanController.js";
import { verifyUser } from "../../middleware/user/auth.js";

const router = express.Router();

router.get("/fetch/current-loan", verifyUser, getMyCurrentLoan);

router.post("/take", verifyUser, takeLoan);

router.post("/repayments/upload-slip", verifyUser, uploadRepaymentSlip);

router.get("/fetch/user-repayments", verifyUser, getMyRepayments);

router.post("/repayments/pay", verifyUser, makeRepayment);

router.get("/current-interest", getCurrentInterestRate);

export default router;
