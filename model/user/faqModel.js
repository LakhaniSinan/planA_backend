// models/user/faqModel.js
import mongoose from "mongoose";

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { 
      type: String, 
      enum: ["loans", "repayment", "account", "general"], 
      default: "general" 
    },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }, // for sorting
  },
  { timestamps: true }
);

export default mongoose.model("FAQ", faqSchema);