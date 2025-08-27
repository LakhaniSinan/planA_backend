import mongoose from "mongoose";

const repaymentSlipSchema = new mongoose.Schema(
  {
    loanId: { type: mongoose.Schema.Types.ObjectId, ref: "Loan", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    slipUrl: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("RepaymentSlip", repaymentSlipSchema);
