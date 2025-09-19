import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { 
      type: String, 
      required: true, 
    },
    password: { type: String, select: false },
    contactNumber: { type: String },
    image: { type: String, default: "" },
    status: { type: Boolean, default: true },
    otp: { type: String },
    otpExpire: { type: Date },
    dateOfBirth: { type: Date },
    address: { type: String },
    country: { type: String },
    state: { type: String },
    city: { type: String },
    postalCode: { type: String },
    governmentId: { type: String },
    profileCompleted: { type: Boolean, default: false },
    isEligible: { type: Boolean, default: false },
    loanLimit: { type: Number, default: 5000 },
    interest: { type: Number, default: 10 },
    history: [
      {
        message: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    
    // phoneNumber: { type: String },
    // role: { type: String, default: "user" },
    // fullName: { type: String },
    // interestRate: { type: Number },
  },
  { timestamps: true, collection: 'users' }
);

userSchema.index({ email: 1 }, { unique: true }); 
userSchema.index({ profileCompleted: 1 });

const User = mongoose.model("User", userSchema);

export default User;