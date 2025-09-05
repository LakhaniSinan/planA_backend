import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["user", "admin"], default: "admin" },
    resetPasswordOtp: { type: String },
    resetPasswordExpire: { type: Date },
  },
  { timestamps: true }
);
export default mongoose.model("admin", adminSchema);
