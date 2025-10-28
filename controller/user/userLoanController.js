import Loan from "../../model/loanManagement/loanModel.js";
import LoanRequest from "../../model/user/loanRequestModel.js";
import Installment from "../../model/loanManagement/repaymentSlip.js";
import Interest from "../../model/loanManagement/intrestModel.js";
import User from "../../model/user/Model.js";
import { successHelper, errorHelper } from "../../utilities/helpers.js";
import Admin from "../../model/admin/Model.js";
import sendEmail from "../../utilities/email.js";
import mongoose from "mongoose"

const getMyCurrentLoan = async (req, res) => {
  try {
    console.log("========== GET MY CURRENT LOAN START ==========");
    console.log("User ID:", req.user._id);
    console.log("Request Time:", new Date().toISOString());

    const userObjectId = new mongoose.Types.ObjectId(req.user._id);
    console.log("User ObjectId created:", userObjectId);

    console.log("Fetching loan from database...");
    const loan = await LoanRequest.findOne({
      userId: userObjectId,
    })
      .populate("userId", "name fullName email image")
      .sort({ createdAt: -1 });

    console.log("Loan query completed");
    console.log("Loan found:", loan ? "YES" : "NO");

    if (!loan) {
      console.log("No loan found for user");
      console.log("========== GET MY CURRENT LOAN END (NO LOAN) ==========");
      return successHelper(res, null, "Sorry, No loans found!", 200);
    }

    console.log("Loan Details:");
    console.log("- Loan ID:", loan._id);
    console.log("- Request ID:", loan.requestId);
    console.log("- Status:", loan.status);
    console.log("- Requested Amount:", loan.requestedAmount);
    console.log("- Total Payable Amount:", loan.totalPayableAmount);
    console.log("- Created At:", loan.createdAt);
    console.log("- Approved At:", loan.approvedAt);
    console.log("- Rejected At:", loan.rejectedAt);
    console.log("- Completed At:", loan.completedAt);

    console.log("Processing loan based on status:", loan.status);

    switch (loan.status) {
      case "pending":
        console.log("CASE: PENDING - Loan is awaiting approval");
        const pendingResponse = {
          status: "pending",
          loan: {
            _id: loan._id,
            requestId: loan.requestId,
            status: loan.status,
          },
        };
        console.log("Pending response:", JSON.stringify(pendingResponse, null, 2));
        console.log("========== GET MY CURRENT LOAN END (PENDING) ==========");
        return successHelper(
          res,
          pendingResponse,
          "Your loan application is pending approval",
          200
        );

      case "rejected":
        console.log("CASE: REJECTED - Loan application was rejected");
        console.log("Rejected At:", loan.rejectedAt);
        console.log("========== GET MY CURRENT LOAN END (REJECTED) ==========");
        return successHelper(
          res,
          null,
          "Your loan application was rejected. You have no active or pending loans",
          200
        );

      case "completed":
        console.log("CASE: COMPLETED - Loan has been fully paid");
        const completedResponse = {
          status: "completed",
          loan: {
            _id: loan._id,
            requestId: loan.requestId,
            status: loan.status,
            completedAt: loan.completedAt,
          },
        };
        console.log("Completed response:", JSON.stringify(completedResponse, null, 2));
        console.log("========== GET MY CURRENT LOAN END (COMPLETED) ==========");
        return successHelper(
          res,
          completedResponse,
          "Your loan has been completed"
        );

      case "approved":
        console.log("CASE: APPROVED - Fetching loan details and installments");
        console.log("Fetching installments for loan ID:", loan._id);
        
        const installments = await Installment.find({ loanId: loan._id }).sort({
          dueDate: 1,
        });

        console.log("Installments found:", installments.length);
        console.log("Raw installments:", JSON.stringify(installments, null, 2));

        console.log("Calculating correct due dates for installments...");
        const loanStartDate = loan.approvedAt ? new Date(loan.approvedAt) : new Date();
        console.log("Loan Start Date (approvedAt):", loanStartDate.toISOString());

        const installmentsWithCorrectDates = installments.map((inst, index) => {
          const instObj = inst.toObject();
          
          const correctDueDate = new Date(loanStartDate);
          correctDueDate.setMonth(correctDueDate.getMonth() + (index + 1));
          
          console.log(`Installment ${index + 1}:`);
          console.log(`  - Installment ID: ${instObj._id}`);
          console.log(`  - Original Due Date: ${instObj.dueDate}`);
          console.log(`  - Calculated Due Date: ${correctDueDate.toISOString()}`);
          console.log(`  - Status: ${instObj.status}`);
          console.log(`  - Amount: ${instObj.amount}`);
          
          return {
            ...instObj,
            dueDate: correctDueDate,
            calculatedDueDate: correctDueDate,
          };
        });

        console.log("Finding next pending installment...");
        const nextInstallment = installmentsWithCorrectDates.find(
          (inst) => inst.status === "pending"
        );

        if (nextInstallment) {
          console.log("Next pending installment found:");
          console.log("  - ID:", nextInstallment._id);
          console.log("  - Due Date:", nextInstallment.dueDate);
          console.log("  - Amount:", nextInstallment.amount);
        } else {
          console.log("No pending installments found");
        }

        console.log("All installments with corrected dates:", JSON.stringify(installmentsWithCorrectDates, null, 2));

        const response = {
          ...loan.toObject(),
          installments: installmentsWithCorrectDates,
          availableAmount: loan.availableAmount,
          nextInstallment: nextInstallment || null,
        };

        console.log("Final approved loan response prepared");
        console.log("Response summary:");
        console.log("  - Total installments:", installmentsWithCorrectDates.length);
        console.log("  - Available amount:", loan.availableAmount);
        console.log("  - Has next installment:", !!nextInstallment);
        console.log("========== GET MY CURRENT LOAN END (APPROVED) ==========");
        
        return successHelper(res, response, "Current loan fetched successfully");

      default:
        console.log("CASE: UNKNOWN STATUS -", loan.status);
        console.log("========== GET MY CURRENT LOAN END (INVALID STATUS) ==========");
        return errorHelper(res, null, "Invalid loan status", 400);
    }
  } catch (error) {
    console.error("========== ERROR IN GET MY CURRENT LOAN ==========");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("========== ERROR END ==========");
    return errorHelper(res, error, "Failed to fetch current loan");
  }
};

// Take a new loan (Updated to use user-specific interest rate)
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

    // Check if user has completed profile
    const user = await User.findById(req.user._id);
    if (!user.profileCompleted) {
      return errorHelper(
        res,
        null,
        "Please complete your profile before applying for a loan",
        400
      );
    }

    const existingLoan = await Loan.findOne({
      userId: req.user._id,
      status: "active",
    });
    if (existingLoan)
      return errorHelper(res, null, "You already have an active loan", 400);

    // Get user's specific interest rate or global default
    let interestRate = user.interestRate;
    if (!interestRate) {
      const latestInterest = await Interest.findOne().sort({
        effectiveDate: -1,
      });
      interestRate = latestInterest ? latestInterest.rate : 5; // 5% fallback
    }

    const startDate = new Date();

    const loan = await Loan.create({
      userId: req.user._id,
      amount,
      availableAmount: amount, // Set available amount same as loan amount initially
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

// Make a repayment (Updated to handle availableAmount)
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

    // Update available amount (this could represent remaining principal or available credit)
    // For this implementation, let's assume availableAmount decreases as payments are made
    const principalPayment = (amount / totalPayable) * loan.amount;
    loan.availableAmount = Math.max(0, loan.availableAmount - principalPayment);

    // Ensure remainingBalance and paidMonths are within limits
    if (loan.remainingBalance <= 0) {
      loan.remainingBalance = 0;
      loan.availableAmount = 0;
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

    const repayment = await Installment.create({
      loanId,
      userId: req.user._id,
      amount,
      slipUrl,
    });

    // Send notification to admins
    try {
      const admins = await Admin.find({ role: "admin" });
      const user = await User.findById(req.user._id);
      const userName = user.fullName || user.name || "User";

      for (const admin of admins) {
        await sendEmail(
          admin.email,
          "New Repayment Slip Uploaded",
          `User ${userName} (${user.email}) uploaded a repayment slip for loan ${loanId}.\n\nAmount: $${amount}\nLoan Amount: $${loan.amount}\nAvailable Amount: $${loan.availableAmount}\n\nPlease review and process the payment.`
        );
      }
    } catch (emailError) {
      console.error("Failed to send admin notification:", emailError.message);
      // Don't fail the request if email fails
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
    const repayments = await Installment.find({ userId: req.user._id })
      .populate(
        "loanId",
        "amount totalMonths paidMonths status availableAmount"
      )
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

// Get current interest rate (updated to show user-specific vs global)
const getCurrentInterestRate = async (req, res) => {
  try {
    // Get global default interest rate
    const globalInterest = await Interest.findOne().sort({ effectiveDate: -1 });
    const globalRate = globalInterest ? globalInterest.rate : 5;

    let response = {
      globalInterestRate: globalRate,
      effectiveDate: globalInterest?.effectiveDate,
    };

    // If user is authenticated, also show their specific rate
    if (req.user) {
      const user = await User.findById(req.user._id).select("interestRate");
      response.userSpecificRate = user?.interestRate;
      response.effectiveUserRate = user?.interestRate || globalRate;
      response.isCustomRate = !!user?.interestRate;
    }

    return successHelper(
      res,
      response,
      "Interest rate information fetched successfully"
    );
  } catch (error) {
    return errorHelper(res, error, "Failed to fetch interest rate");
  }
};

// Get loan eligibility info
const getLoanEligibility = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Check if user has completed profile
    //  if (!user.profileCompleted || !user.emailVerified) {
    //     return successHelper(res, {
    //       eligible: false,
    //       reasons: [
    //         !user.emailVerified && "Email not verified",
    //         !user.profileCompleted && "Profile not completed"
    //       ].filter(Boolean),
    //       nextSteps: [
    //         !user.emailVerified && "Verify your email address",
    //         !user.profileCompleted && "Complete your profile information"
    //       ].filter(Boolean)
    //     }, "Loan eligibility check completed");
    //   }

    // Check for existing active loan
    const existingLoan = await Loan.findOne({
      userId: req.user._id,
      status: "active",
    });

    if (existingLoan) {
      return successHelper(
        res,
        {
          eligible: false,
          reasons: ["You already have an active loan"],
          currentLoan: {
            amount: existingLoan.amount,
            availableAmount: existingLoan.availableAmount,
            remainingBalance: existingLoan.remainingBalance,
          },
        },
        "Loan eligibility check completed"
      );
    }

    // User is eligible
    const globalInterest = await Interest.findOne().sort({ effectiveDate: -1 });
    const effectiveRate = user.interest || globalInterest?.rate || 5;

    user.isEligible = true;
    await user.save();

    return successHelper(
      res,
      {
        eligible: true,
        interestRate: effectiveRate,
        isCustomRate: !!user.interest,
        maxLoanAmount: user.loanLimit,
        minLoanAmount: 10,
        maxMonths: 60,
        minMonths: 6,
      },
      "You are eligible for a loan"
    );
  } catch (error) {
    return errorHelper(res, error, "Failed to check loan eligibility");
  }
};

export {
  getMyCurrentLoan,
  uploadRepaymentSlip,
  getMyRepayments,
  takeLoan,
  makeRepayment,
  getCurrentInterestRate,
  getLoanEligibility,
};
