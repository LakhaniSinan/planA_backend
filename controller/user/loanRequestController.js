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

  const user = await UserModel.findById(validatedData.userId);
  if (!user) return next(new AppError("User not found", 404));

  const existingLoanRequest = await LoanRequestModel.findOne({
    userId: user._id,
    status: { $in: ["pending", "approved"] },
  });

  if (existingLoanRequest)
    return next(
      new AppError("User already has a pending or approved loan request", 400)
    );

  // if (user.isEligible === false) return new AppError("User is not eligible for loan", 400);

  if (user.loanLimit < validatedData.amount)
    return next(
      new AppError("User loan limit is less than the requested amount", 400)
    );

  // this.totalPayableAmount = totalPayable;
  // this.remainingBalance = totalPayable;
  // this.requestId = uniqueId;

  const payload = new LoanRequestModel({
    userId: user._id,
    availableAmount: user.loanLimit,
    requestedAmount: validatedData.amount,
    interestRate: user.interestRate,
    tenureType: validatedData.tenureType,
    tenureValue: validatedData.tenureValue,
  });

  const loanRequest = await payload.save();

  // Create Installment
  const installment = [];
  for (let i = 0; i < validatedData.tenureValue; i++) {
    installment.push({
      loanId: loanRequest._id,
      userId: user._id,
      amount: loanRequest.totalPayableAmount / validatedData.tenureValue,
      dueDate: calculateDueDate(new Date(), i, validatedData.tenureType),
    });
  }
  await InstallmentModel.insertMany(installment);

  return successHelper(res, payload, "Loan requested successfully");
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

export {
  requestLoan,
  getAllLoanRequest,
  updateLoanRequest,
  getLoanInstallment,
};
