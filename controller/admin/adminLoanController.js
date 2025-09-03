import Loan from "../../model/loanManagement/loanModel.js";
import Interest from "../../model/loanManagement/intrestModel.js";
import RepaymentSlip from "../../model/loanManagement/repaymentSlip.js";
import User from "../../model/user/Model.js";
import { successHelper, errorHelper } from "../../utilities/helpers.js";
import sendEmail from "../../utilities/email.js";

// Helper to calculate total with interest
const calculateTotalWithInterest = (amount, interestRate) => {
  return amount + (amount * interestRate) / 100;
};

// ============================
// GET ALL ACTIVE LOANS (Updated with availableAmount)
// ============================
const getActiveLoans = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;

    // Build search query
    let searchQuery = { status: "active" };
    if (search) {
      // Search for user by name or email
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ]
      }).select("_id");
      
      const userIds = users.map(user => user._id);
      searchQuery.userId = { $in: userIds };
    }

    const total = await Loan.countDocuments(searchQuery);
    const loans = await Loan.find(searchQuery)
      .populate("userId", "name fullName email image phoneNumber")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

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
        availableAmount: loan.availableAmount, // Include available amount
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

    return successHelper(res, {
      loans: summary,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: loans.length,
        totalLoans: total
      }
    }, "Active loans fetched successfully");
  } catch (error) {
    return errorHelper(res, error, "Failed to fetch active loans");
  }
};

// ============================
// GET SINGLE LOAN DETAILS + REPAYMENTS (Updated)
// ============================
const getLoanDetails = async (req, res) => {
  const { userId } = req.params;

  try {
    const loan = await Loan.findOne({ userId, status: "active" })
      .populate("userId", "name fullName email image phoneNumber address");

    if (!loan) return errorHelper(res, null, "Active loan not found for user", 404);

    const repayments = await RepaymentSlip.find({ loanId: loan._id }).sort({ createdAt: -1 });
    const totalPaid = repayments.reduce((sum, r) => sum + r.amount, 0);
    const totalWithInterest = calculateTotalWithInterest(loan.amount, loan.interestRate);
    const monthlyPayment = totalWithInterest / loan.totalMonths;
    const paidMonths = Math.floor(totalPaid / monthlyPayment);
    const remainingMonths = Math.max(loan.totalMonths - paidMonths, 0);

    const response = {
      id: loan._id,
      user: loan.userId,
      totalAmountTaken: loan.amount,
      availableAmount: loan.availableAmount, // Include available amount
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
// GET PREVIOUS / COMPLETED LOANS (Updated)
// ============================
const getPreviousLoans = async (req, res) => {
  const { userId } = req.params;

  try {
    const loans = await Loan.find({ userId, status: "completed" })
      .populate("userId", "name fullName email");

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
        availableAmount: loan.availableAmount, // Available amount for completed loans (should be 0)
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
// UPDATE LOAN AVAILABLE AMOUNT (New functionality)
// ============================
const updateLoanAvailableAmount = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { availableAmount, reason } = req.body;

    if (availableAmount === undefined || isNaN(availableAmount) || availableAmount < 0) {
      return errorHelper(res, null, "Valid available amount is required", 400);
    }

    const loan = await Loan.findById(loanId).populate("userId", "name fullName email");
    if (!loan) return errorHelper(res, null, "Loan not found", 404);

    if (availableAmount > loan.amount) {
      return errorHelper(res, null, "Available amount cannot exceed loan amount", 400);
    }

    const previousAmount = loan.availableAmount;
    loan.availableAmount = parseFloat(availableAmount);
    await loan.save();

    // Send notification to user about the change
    try {
      const user = loan.userId;
      const userName = user.fullName || user.name || 'User';
      const changeType = availableAmount > previousAmount ? 'increased' : 'decreased';
      
      const emailSubject = `Loan Available Amount Updated`;
      const emailContent = `
Dear ${userName},

Your loan available amount has been ${changeType} by an administrator.

LOAN DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Loan ID: ${loan._id}
Original Loan Amount: $${loan.amount}
Previous Available Amount: $${previousAmount}
New Available Amount: $${availableAmount}
Change: ${availableAmount > previousAmount ? '+' : ''}$${(availableAmount - previousAmount).toFixed(2)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${reason ? `Reason: ${reason}` : ''}

If you have any questions about this change, please contact our support team.

Best regards,
Loan Management Team
      `;

      await sendEmail(user.email, emailSubject, emailContent);
    } catch (emailError) {
      console.error("Failed to send user notification:", emailError.message);
      // Don't fail the request if email fails
    }

    return successHelper(
      res, 
      {
        loanId: loan._id,
        previousAmount,
        newAmount: availableAmount,
        change: availableAmount - previousAmount,
        user: {
          _id: loan.userId._id,
          name: loan.userId.fullName || loan.userId.name,
          email: loan.userId.email
        }
      }, 
      `Loan available amount updated successfully`
    );
  } catch (error) {
    return errorHelper(res, error, "Failed to update loan available amount");
  }
};

// ============================
// SET GLOBAL INTEREST RATE
// ============================
const setGlobalInterestRate = async (req, res) => {
  const { rate } = req.body;

  if (!rate) return errorHelper(res, null, "Interest rate is required", 400);
  if (rate <= 0) return errorHelper(res, null, "The Interest Rate can't be a negative integer", 400);
  if (rate > 100) return errorHelper(res, null, "Interest rate cannot exceed 100%", 400);

  try {
    const latest = await Interest.findOne().sort({ effectiveDate: -1 });

    if (latest && latest.rate === parseFloat(rate)) {
      return errorHelper(res, null, "Interest rate is already set to this value", 400);
    }

    const interest = await Interest.create({ rate: parseFloat(rate) });
    return successHelper(res, interest, "Global interest rate updated successfully");
  } catch (error) {
    return errorHelper(res, error, "Failed to update interest rate");
  }
};

// ============================
// GET LOAN STATISTICS (New functionality)
// ============================
const getLoanStatistics = async (req, res) => {
  try {
    // Get basic counts
    const activeLoansCount = await Loan.countDocuments({ status: "active" });
    const completedLoansCount = await Loan.countDocuments({ status: "completed" });
    
    // Get total amounts
    const activeLoans = await Loan.find({ status: "active" });
    const completedLoans = await Loan.find({ status: "completed" });
    
    const totalActiveLoanAmount = activeLoans.reduce((sum, loan) => sum + loan.amount, 0);
    const totalActiveAvailableAmount = activeLoans.reduce((sum, loan) => sum + loan.availableAmount, 0);
    const totalCompletedLoanAmount = completedLoans.reduce((sum, loan) => sum + loan.amount, 0);
    
    // Get repayment statistics
    const allRepayments = await RepaymentSlip.find();
    const totalRepaymentAmount = allRepayments.reduce((sum, repayment) => sum + repayment.amount, 0);
    
    // Get global interest rate
    const globalInterest = await Interest.findOne().sort({ effectiveDate: -1 });
    
    const statistics = {
      loans: {
        active: activeLoansCount,
        completed: completedLoansCount,
        total: activeLoansCount + completedLoansCount
      },
      amounts: {
        totalActiveLoanAmount,
        totalActiveAvailableAmount,
        totalCompletedLoanAmount,
        totalRepaymentAmount,
        totalLoanAmount: totalActiveLoanAmount + totalCompletedLoanAmount
      },
      globalInterestRate: globalInterest?.rate || 0,
      repayments: {
        totalSlips: allRepayments.length,
        totalAmount: totalRepaymentAmount
      }
    };

    return successHelper(res, statistics, "Loan statistics fetched successfully");
  } catch (error) {
    return errorHelper(res, error, "Failed to fetch loan statistics");
  }
};

export {
  getActiveLoans,
  getLoanDetails,
  getPreviousLoans,
  setGlobalInterestRate,
  updateLoanAvailableAmount,
  getLoanStatistics,
};