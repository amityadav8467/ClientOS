const express = require("express");
const router = express.Router();
const {
  getCaptcha, register, sendRegistrationOtp, sendAdminInvite, login, refreshToken, logout, getMe,
  changePassword, forceChangePassword,
  forgotPassword, verifyOtp, resetPassword,
} = require("../controllers/authController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/captcha", getCaptcha);
router.post("/register", register);
router.post("/register/send-otp", sendRegistrationOtp);
router.post("/admin-invite", protect, adminOnly, sendAdminInvite);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.post("/change-password", protect, changePassword);
router.post("/force-change-password", protect, forceChangePassword);

// Forgot password flow (no auth needed)
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

module.exports = router;
