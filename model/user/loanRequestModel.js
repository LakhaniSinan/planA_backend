import mongoose from "mongoose";

const loanRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requestId: {
      type: String,
      // required: true,
      unique: true,
    },
    requestedAmount: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    tenureType: {
      type: String,
      enum: ["days", "months", "years"],
      required: true,
    },
    tenureValue: { type: Number, required: true },
    totalPayableAmount: { type: Number },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
    },
    totalPaidAmount: { type: Number, default: 0 },
    remainingBalance: { type: Number, default: 0 },
    availableAmount: { type: Number, default: 0 },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    completedAt: { type: Date },

    // adminId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Admin",
    // }, 
  },
  {
    timestamps: true,
    collection: "loan_request",
  }
);

// Before saving, initialize balances
loanRequestSchema.pre("save", function (next) {
  if (this.isNew) {
    const uniqueId = (Date.now().toString().slice(-3) + Math.floor(100 + Math.random() * 900)).slice(-6);
    const totalPayable =
      this.requestedAmount + this.requestedAmount * (this.interestRate / 100);

    this.totalPayableAmount = totalPayable;
    this.remainingBalance = totalPayable;
    this.requestId = uniqueId;

  }
  next();
});

// Index for better query performance
loanRequestSchema.index({ userId: 1, });
loanRequestSchema.index({ requestId: 1 });
loanRequestSchema.index({ status: 1 });

export default mongoose.model("LoanRequest", loanRequestSchema);
