import { AppError } from "../../middleware/errorMiddleware.js";
import LoanRequestModel from "../../model/user/loanRequestModel.js";
import UserModel from "../../model/user/Model.js";
import InstallmentModel from "../../model/loanManagement/repaymentSlip.js";
import catchAsync from "../../utilities/catchAsync.js";
import {
  calculateDueDate,
  successHelper,
  roundNumber,
} from "../../utilities/helpers.js";
import {
  loanRequestSchema,
  updateLoanRequestSchema,
} from "../../utilities/validation.js";
import { schemaValidator } from "../../middleware/schemaMiddleware.js";
import mongoose from "mongoose";

const requestLoan = catchAsync(async (req, res, next) => {
  const [error, validatedData] = schemaValidator(req.body, loanRequestSchema);
  if (error) return next(new AppError(error, 400));

  const user = req.user;

  if (user.isEligible === false) {
    return next(
      new AppError(
        "You are not eligible for a loan. Please complete your profile verification.",
        403
      )
    );
  }

  if (user.loanLimit < validatedData.amount) {
    return next(
      new AppError(
        `Requested amount (${validatedData.amount.toLocaleString()}) exceeds your loan limit of ${user.loanLimit.toLocaleString()}`,
        400
      )
    );
  }

  const existingLoanRequest = await LoanRequestModel.findOne({
    userId: user._id,
    status: { $in: ["pending", "approved"] },
  });

  if (existingLoanRequest) {
    return next(
      new AppError("You already have a pending or approved loan request", 400)
    );
  }

  const payload = new LoanRequestModel({
    userId: user._id,
    availableAmount: user.loanLimit,
    requestedAmount: validatedData.amount,
    interestRate: user.interest,
    tenureType: validatedData.tenureType,
    tenureValue: validatedData.tenureValue,
  });

  const loanRequest = await payload.save();

  // create installments with rounded amounts. distribute any rounding remainder to last installment
  const installments = [];
  const rawInstallment =
    loanRequest.totalPayableAmount / validatedData.tenureValue;
  const roundedInstallment = roundNumber(rawInstallment);
  let totalAssigned = 0;

  for (let i = 0; i < validatedData.tenureValue; i++) {
    // last installment gets the remainder to ensure sums match
    const isLast = i === validatedData.tenureValue - 1;
    const amount = isLast
      ? roundNumber(loanRequest.totalPayableAmount - totalAssigned)
      : roundedInstallment;

    totalAssigned += amount;

    installments.push({
      loanId: loanRequest._id,
      userId: user._id,
      amount,
      dueDate: calculateDueDate(new Date(), i, validatedData.tenureType),
    });
  }

  await InstallmentModel.insertMany(installments);

  return successHelper(res, loanRequest, "Loan requested successfully");
});

const getAllLoanRequest = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, userId = "" } = req.query;

  const query = {};
  if (userId) {
    query.userId = new mongoose.Types.ObjectId(userId);
  }

  const skip = (page - 1) * limit;
  const limitNum = parseInt(limit);

  const results = await LoanRequestModel.aggregate([
    { $match: query },
    {
      $lookup: {
        from: "users", // users collection
        localField: "userId", // field in LoanRequest
        foreignField: "_id", // field in User
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        __v: 0,
        "user.password": 0,

        "user.__v": 0,
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: skip }, { $limit: limitNum }],
      },
    },
  ]);

  const loanRequests = results[0].data;
  const totalCount = results[0].metadata[0]?.total || 0;
  const totalPages = Math.ceil(totalCount / limitNum);
  const hasMore = page < totalPages;

  const finalData = {
    loanRequests,
    pagination: { page, limit, totalCount, totalPages, hasMore },
  };

  return successHelper(res, finalData, "Loan requests fetched successfully");
});

const updateLoanRequest = catchAsync(async (req, res, next) => {
  const { loanId } = req.params;
  const [error, validatedData] = schemaValidator(
    req.body,
    updateLoanRequestSchema
  );
  if (error) return next(new AppError(error, 400));

  const loanRequest = await LoanRequestModel.findById(loanId);
  if (!loanRequest) return next(new AppError("Loan request not found", 404));

  loanRequest.status = validatedData.status;

  if (validatedData.status === "approved") {
    loanRequest.approvedAt = new Date();
  } else if (validatedData.status === "rejected") {
    loanRequest.rejectedAt = new Date();
  } else if (validatedData.status === "completed") {
    loanRequest.completedAt = new Date();
  }

  await loanRequest.save();

  return successHelper(res, loanRequest, "Loan request updated successfully");
});

const getLoanInstallment = catchAsync(async (req, res, next) => {
  const { id, userId } = req.params;

  const loanInstallment = await InstallmentModel.find({
    loanId: id,
    userId: userId,
  });

  console.log("LOANLOANLOAN", loanInstallment);
  return successHelper(
    res,
    loanInstallment,
    "Loan installment fetched successfully"
  );
});

const makePayment = catchAsync(async (req, res, next) => {
  const {
    loanRequestId,
    installmentId,
    paymentAmount: rawPaymentAmount,
    slipUrl
  } = req.body;

  if ((!loanRequestId || !installmentId || !slipUrl)) {
    return next(
      new AppError(
        "Loan request ID, installment ID and slipUrl are required",
        400
      )
    );
  }

  const paymentAmount =
    rawPaymentAmount === undefined ? NaN : Number(rawPaymentAmount);
  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
    return next(new AppError("paymentAmount must be a positive number", 400));
  }

  try {
    const loanRequest = await LoanRequestModel.findById(loanRequestId);
    if (!loanRequest) return next(new AppError("Loan request not found", 404));

    if (loanRequest.status !== "approved") {
      return next(
        new AppError("Loan must be approved before making payments", 400)
      );
    }

    const installment = await InstallmentModel.findById(installmentId);
    if (!installment) return next(new AppError("Installment not found", 404));

    if (
      req.user &&
      req.user._id &&
      installment.userId.toString() !== req.user._id.toString()
    ) {
      return next(
        new AppError("You are not authorized to pay this installment", 403)
      );
    }

    if (installment.status === "paid") {
      return next(new AppError("This installment is already paid", 400));
    }

    const alreadyPaid = installment.paidAmount || 0;
    const installmentRemaining = installment.amount - alreadyPaid;

    if (paymentAmount > installmentRemaining) {
      return next(
        new AppError("Payment amount exceeds remaining installment amount", 400)
      );
    }

    if (paymentAmount > loanRequest.remainingBalance) {
      return next(
        new AppError("Payment amount exceeds remaining loan balance", 400)
      );
    }

    installment.paidAmount = roundNumber(alreadyPaid + paymentAmount);
    if (installment.paidAmount >= roundNumber(installment.amount)) {
      installment.status = "paid";
      installment.paidAt = new Date();
    }
    installment.slipUrl = slipUrl;
    await installment.save();

    loanRequest.totalPaidAmount = roundNumber(
      (loanRequest.totalPaidAmount || 0) + paymentAmount
    );
    loanRequest.remainingBalance = roundNumber(
      (loanRequest.remainingBalance || loanRequest.totalPayableAmount || 0) -
        paymentAmount
    );

    if (Math.abs(loanRequest.remainingBalance) < 0.01) {
      loanRequest.remainingBalance = 0;
      loanRequest.status = "completed";
      loanRequest.completedAt = new Date();
    }

    await loanRequest.save();

    const responseData = {
      loanRequestId: loanRequest._id,
      installmentId: installment._id,
      paidAmount: paymentAmount,
      remainingBalance: loanRequest.remainingBalance,
      totalPaidAmount: loanRequest.totalPaidAmount,
      loanStatus: loanRequest.status,
      slipUrl: slipUrl
    };

    return successHelper(res, responseData, "Payment processed successfully");
  } catch (error) {
    throw error;
  }
});

export {
  requestLoan,
  getAllLoanRequest,
  updateLoanRequest,
  getLoanInstallment,
  makePayment,
};
