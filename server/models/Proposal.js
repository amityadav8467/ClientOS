const mongoose = require("mongoose");

const proposalSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    title: { type: String, required: true },
    inputData: {
      clientName: String,
      businessType: String,
      scope: String,
      budget: String,
      timeline: String,
    },
    generatedContent: { type: String },
    status: {
      type: String,
      enum: ["draft", "sent", "approved", "rejected"],
      default: "draft",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Proposal", proposalSchema);
