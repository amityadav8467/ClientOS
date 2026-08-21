const crypto = require("crypto");
const User = require("../models/User");
const AdminInvite = require("../models/AdminInvite");
const CaptchaChallenge = require("../models/CaptchaChallenge");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");
const { sendEmail, getEmailConfigError, otpEmailTemplate, adminInviteEmailTemplate, adminRegistrationOtpEmailTemplate } = require("../utils/email");

const hashCaptchaAnswer = (answer) => {
  return crypto
    .createHash("sha256")
    .update(String(answer).trim().toLowerCase())
    .digest("hex");
};

const verifyCaptcha = async (captchaId, captchaAnswer) => {
  if (!captchaId || !captchaAnswer) return false;

  const challenge = await CaptchaChallenge.findOne({
    challengeId: String(captchaId),
    used: false,
    expiresAt: { $gt: new Date() },
  });

  if (!challenge) return false;

  const isValid = challenge.answerHash === hashCaptchaAnswer(captchaAnswer);
  challenge.used = true;
  await challenge.save();

  return isValid;
};

// @desc    Create CAPTCHA challenge
// @route   GET /api/auth/captcha
const getCaptcha = async (req, res) => {
  try {
    let left = crypto.randomInt(2, 13);
    let right = crypto.randomInt(2, 13);
    const operator = crypto.randomInt(0, 2) === 0 ? "+" : "-";
    if (operator === "-" && right > left) {
      [left, right] = [right, left];
    }
    const answer = operator === "+" ? left + right : left - right;
    const challengeId = crypto.randomUUID();

    await CaptchaChallenge.deleteMany({ expiresAt: { $lte: new Date() } });
    await CaptchaChallenge.create({
      challengeId,
      answerHash: hashCaptchaAnswer(answer),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    res.json({
      success: true,
      captchaId: challengeId,
      question: `${left} ${operator} ${right}`,
      expiresInSeconds: 300,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register new admin user
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, inviteCode, emailOtp, captchaId, captchaAnswer } = req.body;

    if (!name || !email || !password || !inviteCode || !emailOtp || !captchaId || !captchaAnswer) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const captchaValid = await verifyCaptcha(captchaId, captchaAnswer);
    if (!captchaValid) {
      return res.status(400).json({ message: "Invalid or expired CAPTCHA" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const normalizedInviteCode = String(inviteCode).trim();
    const invite = await AdminInvite.findOne({
      email: normalizedEmail,
      code: normalizedInviteCode,
      registrationOtp: String(emailOtp).trim(),
      registrationOtpExpiry: { $gt: new Date() },
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!invite) {
      return res.status(403).json({ message: "Invalid invite code or email OTP" });
    }

    const user = await User.create({ name, email: normalizedEmail, password, role: "admin" });

    invite.used = true;
    invite.usedAt = new Date();
    invite.registrationOtp = undefined;
    invite.registrationOtpExpiry = undefined;
    await invite.save();

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isFirstLogin: user.isFirstLogin,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send email OTP before admin registration
// @route   POST /api/auth/register/send-otp
const sendRegistrationOtp = async (req, res) => {
  try {
    const { email, inviteCode } = req.body;

    if (!email || !inviteCode) {
      return res.status(400).json({ message: "Email and invite code are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const invite = await AdminInvite.findOne({
      email: normalizedEmail,
      code: String(inviteCode).trim(),
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!invite) {
      return res.status(403).json({ message: "Invalid or expired admin invite code" });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    invite.registrationOtp = otp;
    invite.registrationOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await invite.save();

    const emailSent = await sendEmail({
      to: normalizedEmail,
      subject: "Verify Your ClientOS Admin Registration",
      html: adminRegistrationOtpEmailTemplate(normalizedEmail, otp),
    });

    res.json({
      success: true,
      message: emailSent
        ? "Verification OTP sent to your email."
        : "Verification OTP generated, but email is not configured.",
      ...(process.env.NODE_ENV !== "production" && !emailSent ? { emailOtp: otp } : {}),
      expiresAt: invite.registrationOtpExpiry,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send admin registration invite code
// @route   POST /api/auth/admin-invite
const sendAdminInvite = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await AdminInvite.findOneAndUpdate(
      { email: normalizedEmail, used: false },
      {
        email: normalizedEmail,
        code,
        expiresAt,
        used: false,
        usedAt: undefined,
        registrationOtp: null,
        registrationOtpExpiry: null,
        createdBy: req.user._id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const emailSent = await sendEmail({
      to: normalizedEmail,
      subject: "Your ClientOS Admin Invite Code",
      html: adminInviteEmailTemplate(normalizedEmail, code, req.user.name || req.user.email),
    });

    res.status(201).json({
      success: true,
      message: emailSent
        ? "Admin invite code sent successfully."
        : "Admin invite code generated, but email is not configured.",
      ...(process.env.NODE_ENV !== "production" && !emailSent ? { inviteCode: code } : {}),
      expiresAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password, captchaId, captchaAnswer } = req.body;

    if (!email || !password || !captchaId || !captchaAnswer) {
      return res.status(400).json({ message: "Email, password, and CAPTCHA required" });
    }

    const captchaValid = await verifyCaptcha(captchaId, captchaAnswer);
    if (!captchaValid) {
      return res.status(400).json({ message: "Invalid or expired CAPTCHA" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isFirstLogin: user.isFirstLogin,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "No refresh token" });
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      const user = await User.findOne({ refreshToken: token }).select("+refreshToken");
      if (user) {
        user.refreshToken = null;
        await user.save({ validateBeforeSave: false });
      }
    }
    res.clearCookie("refreshToken");
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// @desc    Change password
// @route   POST /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    user.isFirstLogin = false;
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Force change password (first login — skips current password check)
// @route   POST /api/auth/force-change-password
const forceChangePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = newPassword;
    user.isFirstLogin = false;
    await user.save();

    res.json({ success: true, message: "Password set successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send OTP to email for password reset
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const emailConfigError = getEmailConfigError();
    if (emailConfigError) {
      return res.status(503).json({ message: emailConfigError });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: "If that email exists, an OTP has been sent." });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await User.findByIdAndUpdate(user._id, {
      resetOtp: otp,
      resetOtpExpiry: expiry,
      resetOtpVerified: false,
    });

    await sendEmail({
      to: user.email,
      subject: "Your Password Reset OTP - Codexora Solutions",
      html: otpEmailTemplate(user.name, otp),
    }, { strict: true });

    res.json({ success: true, message: "OTP sent to your email address." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select("+resetOtp +resetOtpExpiry +resetOtpVerified");

    if (!user || !user.resetOtp) {
      return res.status(400).json({ message: "Invalid or expired OTP. Request a new one." });
    }

    if (new Date() > user.resetOtpExpiry) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    if (user.resetOtp !== otp.trim()) {
      return res.status(400).json({ message: "Incorrect OTP. Please try again." });
    }

    // Mark OTP as verified
    await User.findByIdAndUpdate(user._id, { resetOtpVerified: true });

    res.json({ success: true, message: "OTP verified successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password after OTP verification
// @route   POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ message: "All fields required" });
    if (newPassword.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select("+resetOtp +resetOtpExpiry +resetOtpVerified");

    if (!user || !user.resetOtpVerified) {
      return res.status(400).json({ message: "Please verify OTP first before resetting password." });
    }

    if (new Date() > new Date(user.resetOtpExpiry.getTime() + 5 * 60 * 1000)) {
      return res.status(400).json({ message: "Session expired. Please start over." });
    }

    user.password = newPassword;
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    user.resetOtpVerified = false;
    user.isFirstLogin = false;
    await user.save();

    res.json({ success: true, message: "Password reset successfully! You can now log in." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCaptcha, register, sendRegistrationOtp, sendAdminInvite, login, refreshToken, logout, getMe, changePassword, forceChangePassword, forgotPassword, verifyOtp, resetPassword };
