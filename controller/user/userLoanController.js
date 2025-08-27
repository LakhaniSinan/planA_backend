import Loan from "../../model/loanManagement/loanModel.js";
import RepaymentSlip from "../../model/loanManagement/repaymentSlip.js";
import Interest from "../../model/loanManagement/intrestModel.js";
import { successHelper, errorHelper } from "../../utilities/helpers.js";
import Admin from "../../model/admin/Model.js";
import sendEmail from "../../utilities/email.js";

// Get current active loan
const getMyCurrentLoan = async (req, res) => {
  try {
    const loan = await Loan.findOne({
      userId: req.user._id,
      status: "active",
    }).populate("userId", "name email image");

    if (!loan) return errorHelper(res, null, "No active loan found", 404);

    const response = {
      ...loan.toObject(),
      completionDate:
        loan.paidMonths >= loan.totalMonths ? loan.completionDate : "-",
    };

    return successHelper(res, response, "Current loan fetched successfully");
  } catch (error) {
    return errorHelper(res, error, "Failed to fetch current loan");
  }
};

// Take a new loan
const takeLoan = async (req, res) => {
  try {
    const { amount, totalMonths } = req.body;

    if (!amount || isNaN(amount) || amount <= 0)
      return errorHelper(
        res,
        null,
        "Loan amount must be a positive number",
        400
      );

    if (!totalMonths || isNaN(totalMonths) || totalMonths <= 0)
      return errorHelper(
        res,
        null,
        "Total months must be a positive number",
        400
      );

    const existingLoan = await Loan.findOne({
      userId: req.user._id,
      status: "active",
    });
    if (existingLoan)
      return errorHelper(res, null, "You already have an active loan", 400);

    const latestInterest = await Interest.findOne().sort({ effectiveDate: -1 });
    const interestRate = latestInterest ? latestInterest.rate : 0;

    const startDate = new Date();

    const loan = await Loan.create({
      userId: req.user._id,
      amount,
      totalMonths,
      interestRate,
      startDate,
      completionDate: "-",
      status: "active",
      paidMonths: 0,
    });

    return successHelper(res, loan, "Loan created successfully");
  } catch (error) {
    return errorHelper(res, error, "Failed to create loan");
  }
};

// Make a repayment (actual payment)
const makeRepayment = async (req, res) => {
  try {
    const { loanId, amount } = req.body;

    if (!loanId || !amount)
      return errorHelper(res, null, "loanId and amount are required", 400);

    if (isNaN(amount) || amount <= 0)
      return errorHelper(res, null, "Invalid repayment amount", 400);

    const loan = await Loan.findById(loanId);
    if (!loan) return errorHelper(res, null, "Loan not found", 404);

    if (loan.userId.toString() !== req.user._id.toString())
      return errorHelper(res, null, "Unauthorized", 403);

    if (loan.status === "completed")
      return errorHelper(res, null, "This loan is already completed", 400);

    // Calculate total payable and monthly installment
    const totalPayable = loan.amount + loan.amount * (loan.interestRate / 100);
    const monthlyInstallment = totalPayable / loan.totalMonths;

    // Determine how many months this payment covers
    const monthsCovered = Math.floor(amount / monthlyInstallment);

    // Update fields
    loan.paidMonths += monthsCovered;
    loan.remainingBalance -= amount;
    loan.totalAmountPaid = (loan.totalAmountPaid || 0) + amount;

    // Ensure remainingBalance and paidMonths are within limits
    if (loan.remainingBalance <= 0) {
      loan.remainingBalance = 0;
      loan.paidMonths = loan.totalMonths;
      loan.status = "completed";
      loan.completionDate = new Date();
    } else if (loan.paidMonths > loan.totalMonths) {
      loan.paidMonths = loan.totalMonths;
    }

    await loan.save();

    return successHelper(res, loan, "Repayment applied successfully");
  } catch (error) {
    return errorHelper(res, error, "Failed to make repayment");
  }
};

// Upload repayment slip
const uploadRepaymentSlip = async (req, res) => {
  try {
    const { loanId, amount, slipUrl } = req.body;

    if (!loanId || !amount || !slipUrl)
      return errorHelper(
        res,
        null,
        "loanId, amount, and slipUrl are required",
        400
      );

    if (isNaN(amount) || amount <= 0)
      return errorHelper(res, null, "Invalid repayment amount", 400);

    const loan = await Loan.findById(loanId);
    if (!loan) return errorHelper(res, null, "Loan not found", 404);
    if (loan.userId.toString() !== req.user._id.toString())
      return errorHelper(
        res,
        null,
        "Unauthorized to upload slip for this loan",
        403
      );

    const repayment = await RepaymentSlip.create({
      loanId,
      userId: req.user._id,
      amount,
      slipUrl,
    });

    const admins = await Admin.find({ role: "admin" });
    for (const admin of admins) {
      await sendEmail(
        admin.email,
        "New Repayment Slip Uploaded",
        `User ${req.user.name} uploaded a repayment slip for loan ${loanId}.`
      );
    }

    return successHelper(
      res,
      repayment,
      "Repayment slip uploaded successfully"
    );
  } catch (error) {
    return errorHelper(res, error, "Failed to upload repayment slip");
  }
};

// Get repayment history
const getMyRepayments = async (req, res) => {
  try {
    const repayments = await RepaymentSlip.find({ userId: req.user._id })
      .populate("loanId", "amount totalMonths paidMonths status")
      .sort({ createdAt: -1 });

    if (!repayments.length)
      return errorHelper(res, null, "No repayment records found", 404);

    return successHelper(
      res,
      repayments,
      "Repayment history fetched successfully"
    );
  } catch (error) {
    return errorHelper(res, error, "Failed to fetch repayment history");
  }
};

const getCurrentInterestRate = async (req, res) => {
  try {
    const latest = await Interest.findOne().sort({ effectiveDate: -1 });

    if (!latest) return errorHelper(res, null, "No interest rate found", 404);

    return successHelper(res, latest, "Current interest rate fetched successfully");
  } catch (error) {
    return errorHelper(res, error, "Failed to fetch interest rate");
  }
};

export {
  getMyCurrentLoan,
  uploadRepaymentSlip,
  getMyRepayments,
  takeLoan,
  makeRepayment,
  getCurrentInterestRate,
};
