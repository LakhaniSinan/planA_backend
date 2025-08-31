// models/user/contentModel.js
import mongoose from "mongoose";

const contentSchema = new mongoose.Schema(
  {
    type: { 
      type: String, 
      enum: ["terms", "privacy"], 
      required: true,
      unique: true 
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    version: { type: String, default: "1.0" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Content", contentSchema);