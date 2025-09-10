import mongoose from "mongoose";

const repaymentSlipSchema = new mongoose.Schema(
  {
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paidAt: {
      type: Date,
    },
    slipUrl: { type: String },
    uploadDate: { type: Date },
  },
  { timestamps: true, collection: "repayment_slip" }
);

export default mongoose.model("RepaymentSlip", repaymentSlipSchema);
