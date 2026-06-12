const mongoose = require("mongoose");

const adminInviteSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    used: { type: Boolean, default: false },
    usedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    registrationOtp: { type: String },
    registrationOtpExpiry: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminInvite", adminInviteSchema);
