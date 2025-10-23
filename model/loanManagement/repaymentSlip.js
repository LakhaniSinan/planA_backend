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
    amount: { type: Number, required: true }, // amount paid
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
    paidAmount: { type: Number },
    slipUrl: { type: String, default: "" },
    uploadDate: { type: Date },
  },
  { timestamps: true, collection: "installments" }
);

export default mongoose.model("RepaymentSlip", repaymentSlipSchema);
