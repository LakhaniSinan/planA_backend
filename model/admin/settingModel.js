import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    term: { type: String, required: true },
    privacy: { type: String, required: true },
    accountNumber: { type: String, required: true },
    contact: { type: String, required: true },
    aboutUs: { type: String, required: true },
    fbLink: { type: String, default: "" },
    instaLink: { type: String, default: "" },
    helpInstruction: { type: String, default: "" }
  },
  { timestamps: true, collection: "setting" }
);

export default mongoose.model("Setting", settingSchema);