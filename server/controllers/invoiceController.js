const Invoice = require("../models/Invoice");
const PDFDocument = require("pdfkit");
const { createNotification } = require("../utils/notificationHelper");
const { sendEmail, invoiceEmailTemplate } = require("../utils/email");

// ─── CRUD ────────────────────────────────────────────────────────────────────

const getInvoices = async (req, res) => {
  try {
    const { status, client } = req.query;
    const query = {};
    if (status) query.status = status;
    if (client) query.client = client;
    const invoices = await Invoice.find(query)
      .populate("client", "name email phone address")
      .populate("project", "title")
      .sort({ createdAt: -1 });
    res.json({ success: true, invoices });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createInvoice = async (req, res) => {
  try {
    const { items = [], tax = 0 } = req.body;
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const totalAmount = subtotal + (subtotal * tax) / 100;
    const invoice = await Invoice.create({
      ...req.body,
      subtotal,
      totalAmount,
      items: items.map((item) => ({ ...item, amount: item.quantity * item.rate })),
    });
    await invoice.populate("client", "name email");

    if (req.user) {
      await createNotification({
        userId: req.user._id,
        message: `Invoice ${invoice.invoiceNumber} created for ${invoice.client?.name}`,
        type: "invoice",
        link: `/invoices/${invoice._id}`,
      });
    }
    if (invoice.client?.email) {
      sendEmail({
        to: invoice.client.email,
        subject: `Invoice ${invoice.invoiceNumber} from Codexora Solutions`,
        html: invoiceEmailTemplate(invoice),
      });
    }
    res.status(201).json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("client", "name email phone address businessType")
      .populate("project", "title");
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateInvoice = async (req, res) => {
  try {
    const { items = [], tax = 0 } = req.body;
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const totalAmount = subtotal + (subtotal * tax) / 100;
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        subtotal,
        totalAmount,
        items: items.map((i) => ({ ...i, amount: i.quantity * i.rate })),
      },
      { new: true, runValidators: true }
    ).populate("client", "name email");
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateInvoiceStatus = async (req, res) => {
  try {
    const update = { status: req.body.status };
    if (req.body.status === "paid") update.paidDate = new Date();
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteInvoice = async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Invoice deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── PDF RENDERER ────────────────────────────────────────────────────────────
/**
 * Generates a professional A4 invoice PDF and streams it to `res`.
 * Can also be called with a writable stream for testing.
 *
 * Design language:
 *   • Navy (#0d1b2a) base  ·  Teal (#00c9a7) accent  ·  Slate-grey body text
 *   • Card-based layout: header card, meta row, from/to cards, table, totals
 *   • Status badge (green / amber / red pill)
 *   • Full footer with branding
 */
function buildInvoicePDF(invoice, outputStream) {
  const doc = new PDFDocument({ margin: 0, size: "A4" });
  doc.pipe(outputStream);

  // ── Page dimensions ────────────────────────────────────────────────────────
  const W = 595.28;
  const H = 841.89;
  const PAD = 50;
  const CONTENT_W = W - PAD * 2;

  // ── Design tokens ──────────────────────────────────────────────────────────
  const C = {
    brand:     "#00c9a7",
    brandDark: "#00a88d",
    navy:      "#0d1b2a",
    navyLight: "#1a2d40",
    slate:     "#334155",
    muted:     "#64748b",
    faint:     "#94a3b8",
    line:      "#e2e8f0",
    bg:        "#f1f5f9",
    white:     "#ffffff",
    rowAlt:    "#f8fafc",
    green:     "#10b981",
    greenBg:   "#d1fae5",
    greenText: "#065f46",
    amberBg:   "#fef3c7",
    amberText: "#78350f",
    red:       "#ef4444",
    redBg:     "#fee2e2",
    redText:   "#7f1d1d",
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const fmt = (n) =>
    "Rs. " +
    Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "\u2014";

  function badge(label, x, y, bgColor, textColor, w = 88, h = 22) {
    doc.roundedRect(x, y, w, h, h / 2).fill(bgColor);
    doc
      .fontSize(7.5)
      .font("Helvetica-Bold")
      .fillColor(textColor)
      .text(label, x, y + 6, { width: w, align: "center" });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 1. PAGE BACKGROUND
  // ══════════════════════════════════════════════════════════════════════════
  doc.rect(0, 0, W, H).fill(C.bg);

  // ══════════════════════════════════════════════════════════════════════════
  // 2. HEADER  (navy full-width band)
  // ══════════════════════════════════════════════════════════════════════════
  const HEADER_H = 132;
  doc.rect(0, 0, W, HEADER_H).fill(C.navy);
  // Teal left strip
  doc.rect(0, 0, 5, HEADER_H).fill(C.brand);
  // Teal bottom border
  doc.rect(0, HEADER_H - 3, W, 3).fill(C.brand);

  // Brand
  doc.fontSize(27).font("Helvetica-Bold").fillColor(C.brand).text("CODEXORA", PAD, 30);
  doc
    .fontSize(7.5)
    .font("Helvetica")
    .fillColor(C.faint)
    .text("SOLUTIONS  \u00b7  PROFESSIONAL WEB DEVELOPMENT", PAD, 61);
  doc
    .fontSize(7.5)
    .font("Helvetica")
    .fillColor(C.faint)
    .text("ay990351@gmail.com  \u00b7  codexorasolutions.github.io  \u00b7  Patna, Bihar, India", PAD, 76);

  // Invoice number (right side)
  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor(C.faint)
    .text("INVOICE", W - PAD - 160, 30, { width: 160, align: "right" });
  doc
    .fontSize(22)
    .font("Helvetica-Bold")
    .fillColor(C.white)
    .text(invoice.invoiceNumber, W - PAD - 160, 48, { width: 160, align: "right" });

  // Status badge
  const statusMap = {
    paid:    { bg: C.greenBg, text: C.greenText, label: "PAID" },
    unpaid:  { bg: C.amberBg, text: C.amberText, label: "UNPAID" },
    overdue: { bg: C.redBg,   text: C.redText,   label: "OVERDUE" },
  };
  const st = statusMap[invoice.status] || statusMap.unpaid;
  badge(st.label, W - PAD - 88, 92, st.bg, st.text, 88, 24);

  // ══════════════════════════════════════════════════════════════════════════
  // 3. META ROW  (dates + project — white card)
  // ══════════════════════════════════════════════════════════════════════════
  const META_Y = HEADER_H + 18;
  const META_H = 58;
  doc.roundedRect(PAD, META_Y, CONTENT_W, META_H, 8).fill(C.white);
  doc.roundedRect(PAD, META_Y, 4, META_H, 2).fill(C.brand);

  const metaItems = [
    { label: "ISSUE DATE", value: fmtDate(invoice.createdAt), color: C.slate },
    {
      label: "DUE DATE",
      value: fmtDate(invoice.dueDate),
      color:
        invoice.status !== "paid" && invoice.dueDate && new Date(invoice.dueDate) < new Date()
          ? C.red
          : C.slate,
    },
    {
      label: "PAID ON",
      value: invoice.paidDate ? fmtDate(invoice.paidDate) : "\u2014",
      color: invoice.paidDate ? C.green : C.faint,
    },
    {
      label: "PROJECT",
      value: invoice.project?.title || "\u2014",
      color: C.slate,
    },
  ];

  const metaColW = CONTENT_W / metaItems.length;
  metaItems.forEach((item, i) => {
    const cx = PAD + 16 + i * metaColW;
    doc.fontSize(7).font("Helvetica").fillColor(C.faint).text(item.label, cx, META_Y + 12);
    doc
      .fontSize(9.5)
      .font("Helvetica-Bold")
      .fillColor(item.color)
      .text(item.value, cx, META_Y + 24, { width: metaColW - 8 });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 4. FROM / TO CARDS
  // ══════════════════════════════════════════════════════════════════════════
  const BILL_Y = META_Y + META_H + 14;
  const BILL_CARD_W = (CONTENT_W - 14) / 2;
  const BILL_H = 108;

  // FROM
  doc.roundedRect(PAD, BILL_Y, BILL_CARD_W, BILL_H, 8).fill(C.white);
  doc.roundedRect(PAD, BILL_Y, 4, BILL_H, 2).fill(C.navyLight);

  doc.fontSize(7).font("Helvetica-Bold").fillColor(C.faint).text("FROM", PAD + 16, BILL_Y + 13);
  doc
    .fontSize(13)
    .font("Helvetica-Bold")
    .fillColor(C.navy)
    .text("Codexora Solutions", PAD + 16, BILL_Y + 26);
  doc
    .fontSize(8.5)
    .font("Helvetica")
    .fillColor(C.muted)
    .text("Professional Web Development Agency", PAD + 16, BILL_Y + 44)
    .text("ay990351@gmail.com", PAD + 16, BILL_Y + 58)
    .text("codexorasolutions.github.io", PAD + 16, BILL_Y + 71)
    .text("Ballia, Uttar Pradesh, India", PAD + 16, BILL_Y + 84);

  // BILL TO
  const toCardX = PAD + BILL_CARD_W + 14;
  doc.roundedRect(toCardX, BILL_Y, BILL_CARD_W, BILL_H, 8).fill(C.white);
  doc.roundedRect(toCardX, BILL_Y, 4, BILL_H, 2).fill(C.brand);

  doc.fontSize(7).font("Helvetica-Bold").fillColor(C.faint).text("BILL TO", toCardX + 16, BILL_Y + 13);
  doc
    .fontSize(13)
    .font("Helvetica-Bold")
    .fillColor(C.navy)
    .text(invoice.client?.name || "Client", toCardX + 16, BILL_Y + 26);

  let toY = BILL_Y + 44;
  if (invoice.client?.businessType) {
    doc
      .fontSize(8.5)
      .font("Helvetica-Bold")
      .fillColor(C.brand)
      .text(invoice.client.businessType, toCardX + 16, toY);
    toY += 14;
  }
  doc.fontSize(8.5).font("Helvetica").fillColor(C.muted);
  if (invoice.client?.email) {
    doc.text(invoice.client.email, toCardX + 16, toY);
    toY += 13;
  }
  if (invoice.client?.phone) {
    doc.text(invoice.client.phone, toCardX + 16, toY);
    toY += 13;
  }
  if (invoice.client?.address) {
    doc.text(invoice.client.address, toCardX + 16, toY, { width: BILL_CARD_W - 32 });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 5. ITEMS TABLE
  // ══════════════════════════════════════════════════════════════════════════
  const TABLE_Y = BILL_Y + BILL_H + 18;

  const COL_DESC   = PAD;
  const COL_QTY    = PAD + 268;
  const COL_RATE   = PAD + 338;
  const COL_AMOUNT = PAD + 420;
  const COL_AMT_W  = W - PAD - COL_AMOUNT;

  // Table header
  const TH_H = 32;
  doc.roundedRect(PAD, TABLE_Y, CONTENT_W, TH_H, 6).fill(C.navy);
  doc.roundedRect(PAD, TABLE_Y, 4, TH_H, 2).fill(C.brand);

  doc.fontSize(7.5).font("Helvetica-Bold").fillColor(C.faint);
  doc.text("DESCRIPTION", COL_DESC + 16, TABLE_Y + 11);
  doc.text("QTY",    COL_QTY,    TABLE_Y + 11, { width: 48, align: "center" });
  doc.text("RATE",   COL_RATE,   TABLE_Y + 11, { width: 62, align: "right" });
  doc.text("AMOUNT", COL_AMOUNT, TABLE_Y + 11, { width: COL_AMT_W, align: "right" });

  // Rows
  let rowY = TABLE_Y + TH_H;
  const ROW_H = 36;

  invoice.items.forEach((item, idx) => {
    const isLast = idx === invoice.items.length - 1;
    const bg = idx % 2 === 0 ? C.white : C.rowAlt;

    // Row background
    doc.rect(PAD, rowY, CONTENT_W, ROW_H).fill(bg);

    // Teal dot indicator on even rows
    if (idx % 2 === 0) {
      doc.circle(PAD + 8, rowY + ROW_H / 2, 2.5).fill(C.brand);
    }

    // Row divider (not on last row)
    if (!isLast) {
      doc
        .moveTo(PAD + 16, rowY + ROW_H)
        .lineTo(W - PAD, rowY + ROW_H)
        .lineWidth(0.4)
        .strokeColor(C.line)
        .stroke();
    }

    const textY = rowY + (ROW_H - 10) / 2;

    doc.fontSize(9).font("Helvetica").fillColor(C.slate)
       .text(item.description, COL_DESC + 16, textY, { width: 244 });

    doc.fontSize(9).font("Helvetica").fillColor(C.muted)
       .text(String(item.quantity), COL_QTY, textY, { width: 48, align: "center" });

    doc.text(fmt(item.rate), COL_RATE, textY, { width: 62, align: "right" });

    doc.fontSize(9).font("Helvetica-Bold").fillColor(C.navy)
       .text(fmt(item.amount), COL_AMOUNT, textY, { width: COL_AMT_W, align: "right" });

    rowY += ROW_H;
  });

  // Table bottom teal accent line
  doc
    .moveTo(PAD, rowY)
    .lineTo(W - PAD, rowY)
    .lineWidth(2)
    .strokeColor(C.brand)
    .stroke();

  // ══════════════════════════════════════════════════════════════════════════
  // 6. PAYMENT INFO  (left)  +  TOTALS  (right)
  // ══════════════════════════════════════════════════════════════════════════
  const SECTION_Y = rowY + 18;
  const TOTALS_W  = 240;
  const TOTALS_X  = W - PAD - TOTALS_W;
  const PAY_W     = TOTALS_X - PAD - 16;

  // Payment info card
  const PAY_H = 84;
  doc.roundedRect(PAD, SECTION_Y, PAY_W, PAY_H, 8).fill(C.white);
  doc.roundedRect(PAD, SECTION_Y, 4, PAY_H, 2).fill(C.brand);

  doc.fontSize(7.5).font("Helvetica-Bold").fillColor(C.faint)
     .text("PAYMENT DETAILS", PAD + 16, SECTION_Y + 12);
  doc.fontSize(8.5).font("Helvetica").fillColor(C.muted)
     .text("Accepted: Bank Transfer / UPI / Online", PAD + 16, SECTION_Y + 27)
     .text("UPI ID:  ay990351@upi", PAD + 16, SECTION_Y + 41)
     .text("Please quote the invoice number as payment reference.", PAD + 16, SECTION_Y + 55);

  // Totals
  let tY = SECTION_Y;

  // Subtotal
  doc.fontSize(9).font("Helvetica").fillColor(C.muted)
     .text("Subtotal", TOTALS_X, tY, { width: 130 });
  doc.fontSize(9).font("Helvetica-Bold").fillColor(C.slate)
     .text(fmt(invoice.subtotal || 0), TOTALS_X + 130, tY, { width: TOTALS_W - 130, align: "right" });
  tY += 22;

  // Tax
  if (invoice.tax > 0) {
    const taxAmt = Math.round(((invoice.subtotal || 0) * invoice.tax) / 100);
    doc
      .moveTo(TOTALS_X, tY - 4)
      .lineTo(W - PAD, tY - 4)
      .lineWidth(0.4)
      .strokeColor(C.line)
      .stroke();

    doc.fontSize(9).font("Helvetica").fillColor(C.muted)
       .text(`GST / Tax (${invoice.tax}%)`, TOTALS_X, tY, { width: 130 });
    doc.fontSize(9).font("Helvetica-Bold").fillColor(C.slate)
       .text(fmt(taxAmt), TOTALS_X + 130, tY, { width: TOTALS_W - 130, align: "right" });
    tY += 22;
  }

  // Total due card
  // Total due card
tY += 10;
const TOTAL_CARD_H = 50;

const totalAccentColor =
  invoice.status === "paid"    ? C.green :
  invoice.status === "overdue" ? C.red   : C.brand;

const totalLabel =
  invoice.status === "paid"    ? "AMOUNT PAID"  :
  invoice.status === "overdue" ? "OVERDUE AMT"  : "TOTAL DUE";

doc.roundedRect(TOTALS_X - 12, tY, TOTALS_W + 12, TOTAL_CARD_H, 8).fill(C.navy);
doc.roundedRect(TOTALS_X - 12, tY, 4, TOTAL_CARD_H, 2).fill(totalAccentColor);

doc.fontSize(8.5).font("Helvetica-Bold").fillColor(C.faint)
   .text(totalLabel, TOTALS_X + 4, tY + 10, { width: 90 });

doc.fontSize(18).font("Helvetica-Bold").fillColor(totalAccentColor)
   .text(fmt(invoice.totalAmount || 0), TOTALS_X + 4, tY + 8, {
     width: TOTALS_W - 16,
     align: "right",
   });

  // ══════════════════════════════════════════════════════════════════════════
  // 7. NOTES
  // ══════════════════════════════════════════════════════════════════════════
  if (invoice.notes) {
    const NOTES_Y = SECTION_Y + PAY_H + 16;
    const notesText = invoice.notes;
    const NOTES_H = 56;

    doc.roundedRect(PAD, NOTES_Y, CONTENT_W, NOTES_H, 8).fill(C.white);
    doc.roundedRect(PAD, NOTES_Y, 4, NOTES_H, 2).fill(C.navyLight);

    doc.fontSize(7).font("Helvetica-Bold").fillColor(C.faint)
       .text("NOTES", PAD + 16, NOTES_Y + 12);
    doc.fontSize(8.5).font("Helvetica").fillColor(C.muted)
       .text(notesText, PAD + 16, NOTES_Y + 26, { width: CONTENT_W - 32 });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 8. FOOTER
  // ══════════════════════════════════════════════════════════════════════════
  const FOOTER_H = 54;
  doc.rect(0, H - FOOTER_H, W, FOOTER_H).fill(C.navy);
  doc.rect(0, H - FOOTER_H, W, 3).fill(C.brand);

  doc
    .fontSize(9)
    .font("Helvetica-Bold")
    .fillColor(C.brand)
    .text("Thank you for choosing Codexora Solutions!", PAD, H - FOOTER_H + 16);
  doc
    .fontSize(7.5)
    .font("Helvetica")
    .fillColor(C.faint)
    .text("Questions? Email us at ay990351@gmail.com", PAD, H - FOOTER_H + 31);

  doc
    .fontSize(7.5)
    .font("Helvetica")
    .fillColor(C.faint)
    .text(
      "Codexora Solutions  \u00b7  codexorasolutions.github.io",
      W - PAD - 240,
      H - FOOTER_H + 16,
      { width: 240, align: "right" }
    )
    .text(
      `Generated by ClientOS  \u00b7  ${invoice.invoiceNumber}`,
      W - PAD - 240,
      H - FOOTER_H + 31,
      { width: 240, align: "right" }
    );

  doc.end();
}

// ─── HTTP HANDLER ────────────────────────────────────────────────────────────
const downloadInvoicePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("client", "name email phone address businessType linkedUser")
      .populate("project", "title");

    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    // ── Access control ────────────────────────────────────────────────────────
    // Admin can always download. Client can only download their own invoice.
    const isAdmin = req.user.role === "admin";
    const isOwningClient =
      req.user.role === "client" &&
      invoice.client?.linkedUser?.toString() === req.user._id.toString();

    if (!isAdmin && !isOwningClient) {
      return res.status(403).json({ message: "Access denied" });
    }
    // ─────────────────────────────────────────────────────────────────────────

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${invoice.invoiceNumber}.pdf"`
    );

    buildInvoicePDF(invoice, res);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = {
  getInvoices,
  createInvoice,
  getInvoiceById,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  downloadInvoicePDF,
};
