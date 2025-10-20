import { AppError } from "../../middleware/errorMiddleware.js";
import LoanRequestModel from "../../model/user/loanRequestModel.js";
import UserModel from "../../model/user/Model.js";
import InstallmentModel from "../../model/loanManagement/repaymentSlip.js";
import catchAsync from "../../utilities/catchAsync.js";
import { calculateDueDate, successHelper } from "../../utilities/helpers.js";
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

  const installments = [];
  const installmentAmount = loanRequest.totalPayableAmount / validatedData.tenureValue;

  for (let i = 0; i < validatedData.tenureValue; i++) {
    installments.push({
      loanId: loanRequest._id,
      userId: user._id,
      amount: installmentAmount,
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
  const { id } = req.params;
  const [error, validatedData] = schemaValidator(
    req.body,
    updateLoanRequestSchema
  );
  if (error) return next(new AppError(error, 400));

  const loanRequest = await LoanRequestModel.findById(id);
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
  return successHelper(
    res,
    loanInstallment,
    "Loan installment fetched successfully"
  );
});


const makePayment = catchAsync(async (req, res, next) => {
  const { loanRequestId, installmentId} = req.body;

  if (!loanRequestId || !installmentId ) {
    return next(
      new AppError(
        "Loan request ID, installment ID, and payment amount are required",
        400
      )
    );
  }
  
  //approval

  try {
    const loanRequest = await LoanRequestModel.findById(loanRequestId).session(
      session
    );
    if (!loanRequest) {
      return next(new AppError("Loan request not found", 404));
    }

    if (loanRequest.status !== "approved") {
      return next(
        new AppError("Loan must be approved before making payments", 400)
      );
    }

    const installment = await InstallmentModel.findById(installmentId).session(
      session
    );
    if (!installment) {
      return next(new AppError("Installment not found", 404));
    }

    // if (installment.loanId.toString() !== loanRequestId) {
    //   return next(
    //     new AppError("Installment does not belong to this loan", 400)
    //   );
    // }

    if (installment.status === "paid") {
      return next(new AppError("This installment is already paid", 400));
    }

    // const installmentAmount = installment.amount;
    // if (paymentAmount !== installmentAmount) {
    //   return next(
    //     new AppError(`Payment amount must be exactly ${installmentAmount}`, 400)
    //   );
    // }

    // if (paymentAmount > loanRequest.remainingBalance) {
    //   return next(
    //     new AppError("Payment amount exceeds remaining balance", 400)
    //   );
    // }

    installment.status = "paid";
    installment.paidAt = new Date();
    installment.paidAmount = paymentAmount;
    await installment.save({ session });

    loanRequest.totalPaidAmount += paymentAmount;
    loanRequest.remainingBalance -= paymentAmount;

    if (loanRequest.remainingBalance <= 0.01) {
      loanRequest.status = "completed";
      loanRequest.completedAt = new Date();
    }

    await loanRequest.save({ session });

    await session.commitTransaction();
    session.endSession();

    const responseData = {
      loanRequestId: loanRequest._id,
      installmentId: installment._id,
      paidAmount: paymentAmount,
      remainingBalance: loanRequest.remainingBalance,
      totalPaidAmount: loanRequest.totalPaidAmount,
      loanStatus: loanRequest.status,
    };

    return successHelper(res, responseData, "Payment processed successfully");
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
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





