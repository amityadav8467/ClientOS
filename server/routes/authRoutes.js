const express = require("express");
const router = express.Router();
const {
  getCaptcha, register, sendRegistrationOtp, sendAdminInvite, login, refreshToken, logout, getMe,
  changePassword, forceChangePassword,
  forgotPassword, verifyOtp, resetPassword,
} = require("../controllers/authController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { createRateLimiter } = require("../middleware/rateLimit");

const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Please try again in a few minutes.",
});

const forgotPasswordRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: "Too many password reset attempts. Please try again later.",
});

router.get("/captcha", getCaptcha);
router.post("/register", register);
router.post("/register/send-otp", sendRegistrationOtp);
router.post("/admin-invite", protect, adminOnly, sendAdminInvite);
router.post("/login", loginRateLimiter, login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.post("/change-password", protect, changePassword);
router.post("/force-change-password", protect, forceChangePassword);

// Forgot password flow (no auth needed)
router.post("/forgot-password", forgotPasswordRateLimiter, forgotPassword);
router.post("/verify-otp", forgotPasswordRateLimiter, verifyOtp);
router.post("/reset-password", forgotPasswordRateLimiter, resetPassword);

module.exports = router;
