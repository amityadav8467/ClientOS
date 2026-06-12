const Project = require("../models/Project");

const getProjects = async (req, res) => {
  try {
    const { status, client } = req.query;
    const query = { assignedAdmin: req.user._id };
    if (status) query.status = status;
    if (client) query.client = client;
    const projects = await Project.find(query).populate("client", "name email businessType").sort({ createdAt: -1 });
    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProject = async (req, res) => {
  try {
    const project = await Project.create({ ...req.body, assignedAdmin: req.user._id });
    await project.populate("client", "name email");
    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate("client", "name email businessType phone");
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate("client", "name email");
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Project deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTasks = async (req, res) => {
  try {
    const { tasks } = req.body;
    const project = await Project.findByIdAndUpdate(req.params.id, { tasks }, { new: true });
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProjects, createProject, getProjectById, updateProject, deleteProject, updateTasks };
