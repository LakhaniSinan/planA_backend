import express from "express";
import {
  getAllLoanRequest,
  getLoanInstallment,
  requestLoan,
  updateLoanRequest,
  makePayment
} from "../../controller/user/loanRequestController.js";
import { verifyUser } from "../../middleware/user/auth.js";
import verifyAdmin from "../../middleware/admin/auth.js";
const router = express.Router();

router.post("/request-loan", verifyUser,requestLoan);
router.get("/request-loans", getAllLoanRequest);
router.put("/update-loan/status/:loanId",verifyAdmin, updateLoanRequest);
router.get("/request-loan/installment/:id/:userId", getLoanInstallment);
router.post("/make-payment",verifyUser, makePayment);

export default router;