const nodemailer = require("nodemailer");

const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️  Email not configured — skipping email send");
    return false;
  }
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Codexora Solutions" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return true;
    console.log(`📧 Email sent to ${to}`);
  } catch (err) {
    console.error("❌ Email send failed:", err.message);
  }
};

const invoiceEmailTemplate = (invoice) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#0a0d14;padding:32px 40px;">
      <span style="color:#00d4aa;font-size:24px;font-weight:800;letter-spacing:1px;">CODEXORA</span>
      <span style="color:#64748b;font-size:11px;display:block;margin-top:2px;letter-spacing:2px;">SOLUTIONS</span>
    </div>
    <div style="padding:40px;">
      <h1 style="color:#0f172a;font-size:22px;margin:0 0 8px;">New Invoice: ${invoice.invoiceNumber}</h1>
      <p style="color:#64748b;font-size:14px;margin:0 0 32px;">Hi ${invoice.client?.name || "there"}, please find your invoice details below.</p>
      <div style="background:#f8fafc;border-radius:12px;padding:24px;margin-bottom:28px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;">Invoice #</td>
            <td style="color:#0f172a;font-weight:600;font-size:14px;text-align:right;">${invoice.invoiceNumber}</td>
          </tr>
          ${invoice.dueDate ? `<tr><td style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;">Due Date</td><td style="color:#0f172a;font-weight:600;font-size:14px;text-align:right;">${new Date(invoice.dueDate).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}</td></tr>` : ""}
          <tr>
            <td style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding-top:12px;border-top:1px solid #e2e8f0;">Total Amount</td>
            <td style="color:#00d4aa;font-weight:800;font-size:20px;text-align:right;border-top:1px solid #e2e8f0;">₹${invoice.totalAmount?.toLocaleString("en-IN")}</td>
          </tr>
        </table>
      </div>
      <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0 0 32px;">Please make the payment before the due date. If you have any questions, feel free to reply to this email.</p>
      <div style="text-align:center;padding-top:28px;border-top:1px solid #e2e8f0;">
        <p style="color:#94a3b8;font-size:12px;margin:0;">© 2025 Codexora Solutions · Thank you for your business</p>
      </div>
    </div>
  </div>
</body>
</html>`;

const proposalEmailTemplate = (proposal) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#0a0d14;padding:32px 40px;">
      <span style="color:#00d4aa;font-size:24px;font-weight:800;letter-spacing:1px;">CODEXORA</span>
      <span style="color:#64748b;font-size:11px;display:block;margin-top:2px;letter-spacing:2px;">SOLUTIONS</span>
    </div>
    <div style="padding:40px;">
      <h1 style="color:#0f172a;font-size:22px;margin:0 0 8px;">Project Proposal Ready</h1>
      <p style="color:#64748b;font-size:14px;margin:0 0 24px;">Hi ${proposal.client?.name || "there"}, we've prepared a detailed proposal for your project.</p>
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:20px;margin-bottom:28px;">
        <p style="color:#166534;font-size:14px;font-weight:600;margin:0 0 6px;">${proposal.title}</p>
        ${proposal.inputData?.budget ? `<p style="color:#16a34a;font-size:13px;margin:0;">Budget: ${proposal.inputData.budget} · Timeline: ${proposal.inputData.timeline}</p>` : ""}
      </div>
      <p style="color:#64748b;font-size:13px;line-height:1.6;">Please review the proposal and let us know if you'd like to proceed or have any questions.</p>
      <div style="text-align:center;padding-top:28px;border-top:1px solid #e2e8f0;margin-top:28px;">
        <p style="color:#94a3b8;font-size:12px;margin:0;">© 2025 Codexora Solutions</p>
      </div>
    </div>
  </div>
</body>
</html>`;

const welcomeClientTemplate = (name, email, tempPassword) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#0a0d14;padding:32px 40px;">
      <span style="color:#00d4aa;font-size:24px;font-weight:800;letter-spacing:1px;">CODEXORA</span>
      <span style="color:#64748b;font-size:11px;display:block;margin-top:2px;letter-spacing:2px;">SOLUTIONS</span>
    </div>
    <div style="padding:40px;">
      <h1 style="color:#0f172a;font-size:22px;margin:0 0 8px;">Welcome to your Client Portal, ${name}!</h1>
      <p style="color:#64748b;font-size:14px;margin:0 0 28px;">Your portal account has been created. Use the credentials below to log in and track your projects, invoices, and proposals.</p>
      <div style="background:#f8fafc;border-radius:12px;padding:24px;margin-bottom:28px;border:1px solid #e2e8f0;">
        <p style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">Your Login Credentials</p>
        <p style="color:#0f172a;font-size:14px;margin:0 0 8px;"><strong>Email:</strong> ${email}</p>
        <p style="color:#0f172a;font-size:14px;margin:0;"><strong>Password:</strong> <code style="background:#e2e8f0;padding:2px 8px;border-radius:4px;">${tempPassword}</code></p>
      </div>
      <p style="color:#ef4444;font-size:12px;">⚠️ Please change your password after first login.</p>
      <div style="text-align:center;padding-top:28px;border-top:1px solid #e2e8f0;margin-top:28px;">
        <p style="color:#94a3b8;font-size:12px;margin:0;">© 2025 Codexora Solutions</p>
      </div>
    </div>
  </div>
</body>
</html>`;




const otpEmailTemplate = (name, otp) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.10);">
    <div style="background:linear-gradient(135deg,#0a0d14 0%,#141928 100%);padding:36px 40px 28px;">
      <span style="color:#00d4aa;font-size:22px;font-weight:800;letter-spacing:1.5px;">CODEXORA</span>
      <span style="color:#475569;font-size:10px;display:block;margin-top:3px;letter-spacing:3px;">SOLUTIONS</span>
    </div>
    <div style="padding:40px;">
      <h1 style="color:#0f172a;font-size:20px;font-weight:700;margin:0 0 6px;">Password Reset Request</h1>
      <p style="color:#64748b;font-size:14px;margin:0 0 28px;">Hi ${name}, use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.</p>
      <div style="text-align:center;margin:0 0 28px;">
        <div style="display:inline-block;background:#0a0d14;border-radius:16px;padding:24px 40px;border:1px solid #1e2740;">
          <p style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px;">One-Time Password</p>
          <p style="color:#00d4aa;font-size:42px;font-weight:800;letter-spacing:10px;margin:0;font-family:monospace;">${otp}</p>
        </div>
      </div>
      <div style="background:#fef9ec;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
        <p style="color:#92400e;font-size:12px;margin:0;">Never share this OTP. Codexora will never ask for it. Expires in 10 minutes.</p>
      </div>
      <p style="color:#94a3b8;font-size:12px;margin:0;">If you did not request this, ignore this email. Your password will remain unchanged.</p>
      <div style="text-align:center;padding-top:28px;border-top:1px solid #e2e8f0;margin-top:28px;">
        <p style="color:#cbd5e1;font-size:11px;margin:0;">2025 Codexora Solutions</p>
      </div>
    </div>
  </div>
</body>
</html>`;

const adminInviteEmailTemplate = (email, code, invitedBy) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.10);">
    <div style="background:linear-gradient(135deg,#0a0d14 0%,#141928 100%);padding:36px 40px 28px;">
      <span style="color:#00d4aa;font-size:22px;font-weight:800;letter-spacing:1.5px;">CODEXORA</span>
      <span style="color:#475569;font-size:10px;display:block;margin-top:3px;letter-spacing:3px;">SOLUTIONS</span>
    </div>
    <div style="padding:40px;">
      <h1 style="color:#0f172a;font-size:20px;font-weight:700;margin:0 0 6px;">Admin Registration Invite</h1>
      <p style="color:#64748b;font-size:14px;margin:0 0 28px;">${invitedBy} invited ${email} to create a ClientOS admin account. Use this code during registration. It expires in <strong>30 minutes</strong>.</p>
      <div style="text-align:center;margin:0 0 28px;">
        <div style="display:inline-block;background:#0a0d14;border-radius:16px;padding:24px 40px;border:1px solid #1e2740;">
          <p style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px;">Invite Code</p>
          <p style="color:#00d4aa;font-size:42px;font-weight:800;letter-spacing:10px;margin:0;font-family:monospace;">${code}</p>
        </div>
      </div>
      <p style="color:#94a3b8;font-size:12px;margin:0;">If you were not expecting this invite, ignore this email.</p>
    </div>
  </div>
</body>
</html>`;

const adminRegistrationOtpEmailTemplate = (email, otp) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.10);">
    <div style="background:linear-gradient(135deg,#0a0d14 0%,#141928 100%);padding:36px 40px 28px;">
      <span style="color:#00d4aa;font-size:22px;font-weight:800;letter-spacing:1.5px;">CODEXORA</span>
      <span style="color:#475569;font-size:10px;display:block;margin-top:3px;letter-spacing:3px;">SOLUTIONS</span>
    </div>
    <div style="padding:40px;">
      <h1 style="color:#0f172a;font-size:20px;font-weight:700;margin:0 0 6px;">Verify Admin Registration</h1>
      <p style="color:#64748b;font-size:14px;margin:0 0 28px;">Use this OTP to verify ${email} during ClientOS admin registration. It expires in <strong>10 minutes</strong>.</p>
      <div style="text-align:center;margin:0 0 28px;">
        <div style="display:inline-block;background:#0a0d14;border-radius:16px;padding:24px 40px;border:1px solid #1e2740;">
          <p style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px;">Email OTP</p>
          <p style="color:#00d4aa;font-size:42px;font-weight:800;letter-spacing:10px;margin:0;font-family:monospace;">${otp}</p>
        </div>
      </div>
      <p style="color:#94a3b8;font-size:12px;margin:0;">If you did not request this, ignore this email.</p>
    </div>
  </div>
</body>
</html>`;

module.exports = { sendEmail, invoiceEmailTemplate, proposalEmailTemplate, welcomeClientTemplate, otpEmailTemplate, adminInviteEmailTemplate, adminRegistrationOtpEmailTemplate };
