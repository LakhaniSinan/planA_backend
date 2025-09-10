import express from "express";
import {
  getAllLoanRequest,
  requestLoan,
} from "../../controller/user/loanRequestController.js";

const router = express.Router();

router.post("/request-loan", requestLoan);
router.get("/request-loan", getAllLoanRequest);

export default router;
