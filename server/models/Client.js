const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, trim: true },
    businessType: { type: String, trim: true },
    address: { type: String, trim: true },
    website: { type: String, trim: true },
    notes: { type: String },
    assignedAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    linkedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Client", clientSchema);
