import express from "express";
import {
  getAllLoanRequest,
  requestLoan,
  makePayment
} from "../../controller/user/loanRequestController.js";

const router = express.Router();

router.post("/request-loan", requestLoan);
router.get("/request-loan", getAllLoanRequest);
router.post("/make-payment", makePayment);

export default router;