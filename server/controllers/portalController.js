const User = require("../models/User");
const Client = require("../models/Client");
const Project = require("../models/Project");
const Invoice = require("../models/Invoice");
const Proposal = require("../models/Proposal");
const { sendEmail, welcomeClientTemplate } = require("../utils/email");

// Helper — finds client by linkedUser OR by email match as fallback
const findClientForUser = async (user) => {
  // Primary: linked by ObjectId
  let client = await Client.findOne({ linkedUser: user._id });

  // Fallback: match by email (covers cases where linkedUser was not saved)
  if (!client) {
    client = await Client.findOne({ email: user.email });
    if (client) {
      // Auto-repair the link so future calls work
      await Client.findByIdAndUpdate(client._id, { linkedUser: user._id });
      console.log(`✅ Auto-linked client ${client.name} to user ${user._id}`);
    }
  }

  return client;
};

// @desc   Create a portal login for a client
// @route  POST /api/portal/create-account
const createClientPortalAccount = async (req, res) => {
  try {
    const { clientId } = req.body;

    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ message: "Client not found" });

    // Check if account already exists
    const existing = await User.findOne({ email: client.email, role: "client" });
    if (existing) {
      // Repair broken link if needed
      if (!client.linkedUser || client.linkedUser.toString() !== existing._id.toString()) {
        await Client.findByIdAndUpdate(clientId, { linkedUser: existing._id });
      }
      return res.status(409).json({ message: "Portal account already exists for this client" });
    }

    const tempPassword = `Client@${Math.floor(1000 + Math.random() * 9000)}`;

    const user = await User.create({
      name: client.name,
      email: client.email,
      password: tempPassword,
      role: "client",
      isFirstLogin: true,
    });

    // Use findByIdAndUpdate instead of client.save() — more reliable
    await Client.findByIdAndUpdate(clientId, { linkedUser: user._id });

    sendEmail({
      to: client.email,
      subject: "Welcome to your Codexora Solutions Client Portal",
      html: welcomeClientTemplate(client.name, client.email, tempPassword),
    });

    res.status(201).json({
      success: true,
      message: "Portal account created!",
      tempPassword,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get portal dashboard data for logged-in client
// @route  GET /api/portal/dashboard
const getPortalDashboard = async (req, res) => {
  try {
    const client = await findClientForUser(req.user);

    if (!client) {
      return res.status(404).json({
        message: "Client profile not linked to your account. Please contact your agency.",
      });
    }

    const [projects, invoices, proposals] = await Promise.all([
      Project.find({ client: client._id }).sort({ updatedAt: -1 }),
      Invoice.find({ client: client._id }).sort({ createdAt: -1 }),
      Proposal.find({ client: client._id, status: { $in: ["sent", "approved"] } }).sort({ createdAt: -1 }),
    ]);

    const totalPaid    = invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.totalAmount || 0), 0);
    const totalPending = invoices.filter(i => i.status !== "paid").reduce((s, i) => s + (i.totalAmount || 0), 0);
    const activeProjects = projects.filter(p => p.status !== "completed").length;

    res.json({
      success: true,
      client,
      stats: { totalPaid, totalPending, activeProjects, totalInvoices: invoices.length },
      recentProjects: projects.slice(0, 5),
      recentInvoices: invoices.slice(0, 5),
      proposals,
    });
  } catch (error) {
    console.error("Portal dashboard error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get all projects for portal client
// @route  GET /api/portal/projects
const getPortalProjects = async (req, res) => {
  try {
    const client = await findClientForUser(req.user);
    if (!client) return res.status(404).json({ message: "Client profile not linked. Contact your agency." });

    const projects = await Project.find({ client: client._id }).sort({ updatedAt: -1 });
    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get single project for portal (read-only kanban)
// @route  GET /api/portal/projects/:id
const getPortalProject = async (req, res) => {
  try {
    const client = await findClientForUser(req.user);
    if (!client) return res.status(404).json({ message: "Client not found" });

    const project = await Project.findOne({ _id: req.params.id, client: client._id });
    if (!project) return res.status(404).json({ message: "Project not found" });

    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get all invoices for portal client
// @route  GET /api/portal/invoices
const getPortalInvoices = async (req, res) => {
  try {
    const client = await findClientForUser(req.user);
    if (!client) return res.status(404).json({ message: "Client profile not linked. Contact your agency." });

    const invoices = await Invoice.find({ client: client._id })
      .populate("project", "title")
      .sort({ createdAt: -1 });
    res.json({ success: true, invoices });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get all proposals for portal client
// @route  GET /api/portal/proposals
const getPortalProposals = async (req, res) => {
  try {
    const client = await findClientForUser(req.user);
    if (!client) return res.status(404).json({ message: "Client profile not linked. Contact your agency." });

    const proposals = await Proposal.find({
      client: client._id,
      status: { $in: ["sent", "approved", "rejected"] },
    }).sort({ createdAt: -1 });
    res.json({ success: true, proposals });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createClientPortalAccount,
  getPortalDashboard,
  getPortalProjects,
  getPortalProject,
  getPortalInvoices,
  getPortalProposals,
};
