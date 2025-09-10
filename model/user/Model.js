import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Basic fields (existing)
    name: { type: String }, // Made optional since it comes after OTP
    email: { type: String, required: true, unique: true },
    password: { type: String, select: false }, // Made optional since it comes after OTP
    contactNumber: { type: String }, // Made optional since it comes after OTP
    image: { type: String, default: "" },
    status: { type: Boolean, default: true },
    resetPasswordOtp: { type: String },
    resetPasswordExpire: { type: Date },
    role: { type: String, default: "user" },

    // OTP verification fields
    emailVerified: { type: Boolean, default: false },
    emailVerificationOtp: { type: String },
    emailVerificationExpire: { type: Date },

    // Profile completion fields (added after OTP verification)
    fullName: { type: String },
    dateOfBirth: { type: Date },
    phoneNumber: { type: String },
    address: { type: String },
    country: { type: String },
    state: { type: String },
    city: { type: String },
    postalCode: { type: String },
    governmentId: { type: String }, // URL for government-issued ID image

    // Profile completion status
    profileCompleted: { type: Boolean, default: false },

    // User-specific interest rate
    interestRate: { type: Number }, // Per-user interest rate (overrides global rate)
    
    // Loan eligibility
    isEligible: { type: Boolean, default: false },
    loanLimit: { type: Number, default: 5000 },
    interest: { type: Number, default: 10 },
    history: [
      {
        message: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ emailVerified: 1 });
userSchema.index({ profileCompleted: 1 });

const User = mongoose.model("User", userSchema);

export default User;
