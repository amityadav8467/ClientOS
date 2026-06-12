const express = require("express");
const router = express.Router();
const {
  createClientPortalAccount,
  getPortalDashboard,
  getPortalProjects,
  getPortalProject,
  getPortalInvoices,
  getPortalProposals,
} = require("../controllers/portalController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Admin-only: create portal account for a client
router.post("/create-account", protect, adminOnly, createClientPortalAccount);

// Client portal routes (client role)
router.get("/dashboard",      protect, getPortalDashboard);
router.get("/projects",       protect, getPortalProjects);
router.get("/projects/:id",   protect, getPortalProject);
router.get("/invoices",       protect, getPortalInvoices);
router.get("/proposals",      protect, getPortalProposals);

module.exports = router;
