import mongoose from "mongoose";

const loanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true }, // principal
    totalMonths: { type: Number, required: true },
    paidMonths: { type: Number, default: 0 },
    interestRate: { type: Number, required: true },
    startDate: { type: Date, default: Date.now },
    completionDate: {
      type: String,
      default: "-", 
    },
    status: { type: String, enum: ["active", "completed"], default: "active" },
    totalAmountPaid: { type: Number, default: 0 },
    remainingBalance: {
      type: Number,
      required: true,
      default: function () {
        return this.amount; // initial remaining = loan amount
      },
    },
  },
  { timestamps: true }
);

// Before saving, if new loan, initialize remainingBalance
loanSchema.pre("save", function (next) {
  if (this.isNew) {
    const totalPayable = this.amount + this.amount * (this.interestRate / 100);
    this.remainingBalance = totalPayable;
  }
  next();
});

export default mongoose.model("Loan", loanSchema);
