const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  status: {
    type: String,
    enum: ["planning", "active", "review", "completed"],
    default: "planning",
  },
  assignedTo: { type: String },
  dueDate: { type: Date },
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
});

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    status: {
      type: String,
      enum: ["planning", "active", "review", "completed"],
      default: "planning",
    },
    deadline: { type: Date },
    budget: { type: Number, default: 0 },
    paid: { type: Number, default: 0 },
    tasks: [taskSchema],
    techStack: [{ type: String }],
    assignedAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
