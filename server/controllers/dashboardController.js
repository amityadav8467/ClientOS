const Client = require("../models/Client");
const Project = require("../models/Project");
const Invoice = require("../models/Invoice");
const Proposal = require("../models/Proposal");

const getDashboardStats = async (req, res) => {
  try {
    const adminId = req.user._id;

    const [totalClients, activeProjects, invoices, proposals] = await Promise.all([
      Client.countDocuments({ assignedAdmin: adminId }),
      Project.countDocuments({ assignedAdmin: adminId, status: { $in: ["planning", "active", "review"] } }),
      Invoice.find().populate("client"),
      Proposal.countDocuments({ createdBy: adminId }),
    ]);

    const totalRevenue = invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + i.totalAmount, 0);
    const pendingInvoices = invoices.filter(i => i.status === "unpaid").length;
    const overdueInvoices = invoices.filter(i => i.status === "overdue").length;

    // Monthly revenue for chart (last 6 months)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toLocaleString("default", { month: "short" });
      const year = date.getFullYear();
      const monthStart = new Date(year, date.getMonth(), 1);
      const monthEnd = new Date(year, date.getMonth() + 1, 0);
      const revenue = invoices
        .filter(inv => inv.status === "paid" && new Date(inv.updatedAt) >= monthStart && new Date(inv.updatedAt) <= monthEnd)
        .reduce((sum, inv) => sum + inv.totalAmount, 0);
      monthlyRevenue.push({ month, revenue });
    }

    // Recent projects
    const recentProjects = await Project.find({ assignedAdmin: adminId })
      .populate("client", "name")
      .sort({ updatedAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalClients,
        activeProjects,
        totalRevenue,
        pendingInvoices,
        overdueInvoices,
        totalProposals: proposals,
      },
      monthlyRevenue,
      recentProjects,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats };
