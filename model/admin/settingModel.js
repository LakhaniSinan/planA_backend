import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    term: { type: String, required: true },
    privacy: { type: String, required: true },
    accountNumber: { type: String, required: true },
    contact: { type: String, required: true },
  },
  { timestamps: true, collection: "setting" }
);

export default mongoose.model("Setting", settingSchema);
