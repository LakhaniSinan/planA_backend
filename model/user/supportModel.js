// models/user/supportModel.js
import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    category: { type: String, required: true}, 
    status: { 
      type: String, 
      enum: ["open", "in_progress", "resolved", "closed"], 
      default: "open" 
    },
    adminReply: { type: String },
    repliedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("SupportTicket", supportTicketSchema);