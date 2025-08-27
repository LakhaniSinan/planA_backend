import mongoose from "mongoose";

const interestSchema = new mongoose.Schema(
  {
    rate: { type: Number, required: true }, 
    effectiveDate: { type: Date, default: Date.now }, 
  },
  { timestamps: true }
);

export default mongoose.model("Interest", interestSchema);
