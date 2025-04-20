import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    userName: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: true,
    },

    TotalEarnings: { type: Number, default: 0 },
    earnings: { type: Number, default: 0 },
    referralCode: { type: String, unique: true, default: null },
    referralLink: { type: String, unique: true, default: null },
    referredBy: { type: String, default: null },
    totelreffered: { type: Number, default: 0 },

    accountStatus: {
      type: String,
      enum: ["active", "suspended", "banned"],
      default: "active",
    },

    verificationToken: { type: String },
    verificationCode: { type: String },
    verificationTokenExpires: { type: Date },
    isVerified: { type: Boolean, default: false },

    role: { type: String, enum: ["admin", "user"], default: "user" },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("users", userSchema);
