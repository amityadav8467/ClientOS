const express = require("express");
const router = express.Router();
const {
  getInvoices, createInvoice, getInvoiceById,
  updateInvoice, updateInvoiceStatus, deleteInvoice, downloadInvoicePDF
} = require("../controllers/invoiceController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// PDF download — admin OR client portal (role check handled inside controller)
router.get("/:id/pdf", protect, downloadInvoicePDF);

// Admin-only routes
router.get("/",           protect, adminOnly, getInvoices);
router.post("/",          protect, adminOnly, createInvoice);
router.get("/:id",        protect, adminOnly, getInvoiceById);
router.put("/:id",        protect, adminOnly, updateInvoice);
router.delete("/:id",     protect, adminOnly, deleteInvoice);
router.put("/:id/status", protect, adminOnly, updateInvoiceStatus);

module.exports = router;