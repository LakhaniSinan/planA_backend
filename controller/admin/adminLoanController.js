import Loan from "../../model/loanManagement/loanModel.js";
import Interest from "../../model/loanManagement/intrestModel.js";
import RepaymentSlip from "../../model/loanManagement/repaymentSlip.js";
import { successHelper, errorHelper } from "../../utilities/helpers.js";
import sendEmail from "../../utilities/email.js";

// Helper to calculate total with interest
const calculateTotalWithInterest = (amount, interestRate) => {
  return amount + (amount * interestRate) / 100;
};

// ============================
// GET ALL ACTIVE LOANS
// ============================
const getActiveLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ status: "active" }).populate("userId", "name email image");

    if (!loans.length) return errorHelper(res, null, "No active loans found", 404);

    const summary = await Promise.all(loans.map(async (loan) => {
      const repayments = await RepaymentSlip.find({ loanId: loan._id });
      const totalPaid = repayments.reduce((sum, r) => sum + r.amount, 0);
      const totalWithInterest = calculateTotalWithInterest(loan.amount, loan.interestRate);
      const monthlyPayment = totalWithInterest / loan.totalMonths;
      const paidMonths = Math.floor(totalPaid / monthlyPayment);
      const remainingMonths = Math.max(loan.totalMonths - paidMonths, 0);

      return {
        id: loan._id,
        user: loan.userId,
        totalAmountTaken: loan.amount,
        totalAmountPaid: totalPaid,
        totalWithInterest,
        monthlyPayment,
        paidMonths,
        remainingMonths,
        interestRate: loan.interestRate,
        totalMonths: loan.totalMonths,
        startDate: loan.startDate,
        completionDate: remainingMonths === 0 ? loan.completionDate : "-",
      };
    }));

    return successHelper(res, summary, "Active loans fetched successfully");
  } catch (error) {
    return errorHelper(res, error, "Failed to fetch active loans");
  }
};

// ============================
// GET SINGLE LOAN DETAILS + REPAYMENTS
// ============================
const getLoanDetails = async (req, res) => {
  const { userId } = req.params;

  try {
    const loan = await Loan.findOne({ userId, status: "active" }).populate("userId", "name email image");

    if (!loan) return errorHelper(res, null, "Active loan not found for user", 404);

    const repayments = await RepaymentSlip.find({ loanId: loan._id });
    const totalPaid = repayments.reduce((sum, r) => sum + r.amount, 0);
    const totalWithInterest = calculateTotalWithInterest(loan.amount, loan.interestRate);
    const monthlyPayment = totalWithInterest / loan.totalMonths;
    const paidMonths = Math.floor(totalPaid / monthlyPayment);
    const remainingMonths = Math.max(loan.totalMonths - paidMonths, 0);

    const response = {
      id: loan._id,
      user: loan.userId,
      totalAmountTaken: loan.amount,
      totalAmountPaid: totalPaid,
      totalWithInterest,
      monthlyPayment,
      paidMonths,
      remainingMonths,
      interestRate: loan.interestRate,
      totalMonths: loan.totalMonths,
      startDate: loan.startDate,
      completionDate: remainingMonths === 0 ? loan.completionDate : "-",
      repayments,
    };

    return successHelper(res, response, "Loan details fetched successfully");
  } catch (error) {
    return errorHelper(res, error, "Failed to fetch loan details");
  }
};

// ============================
// GET PREVIOUS / COMPLETED LOANS
// ============================
const getPreviousLoans = async (req, res) => {
  const { userId } = req.params;

  try {
    const loans = await Loan.find({ userId, status: "completed" });

    if (!loans.length) return errorHelper(res, null, "No previous loans found", 404);

    const summary = await Promise.all(loans.map(async (loan) => {
      const repayments = await RepaymentSlip.find({ loanId: loan._id });
      const totalPaid = repayments.reduce((sum, r) => sum + r.amount, 0);
      const totalWithInterest = calculateTotalWithInterest(loan.amount, loan.interestRate);
      const monthlyPayment = totalWithInterest / loan.totalMonths;

      return {
        id: loan._id,
        user: loan.userId,
        totalAmountTaken: loan.amount,
        totalAmountPaid: totalPaid,
        totalWithInterest,
        monthlyPayment,
        paidMonths: loan.paidMonths,
        remainingMonths: 0,
        interestRate: loan.interestRate,
        totalMonths: loan.totalMonths,
        startDate: loan.startDate,
        completionDate: loan.completionDate || "-",
        repayments,
      };
    }));

    return successHelper(res, summary, "Previous loans fetched successfully");
  } catch (error) {
    return errorHelper(res, error, "Failed to fetch previous loans");
  }
};

// ============================
// SET GLOBAL INTEREST RATE
// ============================
const setGlobalInterestRate = async (req, res) => {
  const { rate } = req.body;

  if (!rate) return errorHelper(res, null, "Interest rate is required", 400);
  if (rate <= 0) return errorHelper(res, null, "The Interest Rate can't be a negative integer", 400);

  try {
    const latest = await Interest.findOne().sort({ effectiveDate: -1 });

    if (latest && latest.rate === rate) {
      return errorHelper(res, null, "Interest rate is already set to this value", 400);
    }

    const interest = await Interest.create({ rate });
    return successHelper(res, interest, "Global interest rate updated successfully");
  } catch (error) {
    return errorHelper(res, error, "Failed to update interest rate");
  }
};



export {
  getActiveLoans,
  getLoanDetails,
  getPreviousLoans,
  setGlobalInterestRate,
};
