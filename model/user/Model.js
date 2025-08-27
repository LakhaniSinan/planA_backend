import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    contactNumber: { type: String, required: true },
    image: { type: String },
    status: {type: Boolean},
    resetPasswordOtp: { type: String },
    resetPasswordExpire: { type: Date }, 
    role: { type: String, default: "user" }, 

  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
