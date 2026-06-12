import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Mail, ShieldCheck, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, Zap, RotateCcw } from "lucide-react";
import api from "../../utils/api";

const STEPS = ["email", "otp", "reset", "done"];

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);

  // Email form
  const emailForm = useForm();
  // Reset form
  const resetForm = useForm();
  const newPassword = resetForm.watch("newPassword");

  // Countdown for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  // Auto-focus OTP inputs
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  // ── Step 1: Send OTP ──────────────────────────────────────────────
  const handleSendOtp = async (data) => {
    try {
      await api.post("/api/auth/forgot-password", { email: data.email });
      setEmail(data.email);
      setResendTimer(60);
      toast.success("OTP sent to your email!");
      setStep("otp");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    }
  };

  // ── OTP input handling ────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setOtpError("");
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    pasted.split("").forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────
  const [verifying, setVerifying] = useState(false);
  const handleVerifyOtp = async () => {
    const otpString = otp.join("");
    if (otpString.length < 6) {
      setOtpError("Please enter all 6 digits");
      return;
    }
    setVerifying(true);
    try {
      await api.post("/api/auth/verify-otp", { email, otp: otpString });
      toast.success("OTP verified!");
      setStep("reset");
    } catch (err) {
      setOtpError(err.response?.data?.message || "Invalid OTP");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────
  const handleResend = async () => {
    try {
      await api.post("/api/auth/forgot-password", { email });
      setOtp(["", "", "", "", "", ""]);
      setOtpError("");
      setResendTimer(60);
      toast.success("New OTP sent!");
      otpRefs.current[0]?.focus();
    } catch {
      toast.error("Failed to resend OTP");
    }
  };

  // ── Step 3: Reset Password ────────────────────────────────────────
  const handleResetPassword = async (data) => {
    try {
      await api.post("/api/auth/reset-password", {
        email,
        newPassword: data.newPassword,
      });
      setStep("done");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-teal-400/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-accent-purple/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-5">
            <div className="w-10 h-10 rounded-xl bg-teal-400 flex items-center justify-center shadow-glow">
              <Zap size={20} className="text-bg-primary" strokeWidth={2.5} />
            </div>
            <span className="font-syne text-2xl font-bold text-white">ClientOS</span>
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[
              { id: "email", label: "Email" },
              { id: "otp",   label: "Verify" },
              { id: "reset", label: "Reset" },
            ].map((s, i) => {
              const stepIndex = STEPS.indexOf(step);
              const thisIndex = STEPS.indexOf(s.id);
              const isDone = stepIndex > thisIndex;
              const isActive = step === s.id;
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-syne font-bold transition-all
                      ${isDone ? "bg-teal-400 text-bg-primary" : isActive ? "bg-teal-400/20 border-2 border-teal-400 text-teal-400" : "bg-bg-card border border-bg-border text-slate-500"}`}>
                      {isDone ? <CheckCircle2 size={14} /> : i + 1}
                    </div>
                    <span className={`text-xs font-dm ${isActive ? "text-teal-400" : isDone ? "text-slate-400" : "text-slate-600"}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < 2 && <div className={`w-12 h-px mb-4 ${isDone ? "bg-teal-400" : "bg-bg-border"}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── STEP 1: Email ── */}
        {step === "email" && (
          <div className="glass-card p-8">
            <div className="flex flex-col items-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-teal-400/10 border border-teal-400/20 flex items-center justify-center mb-4">
                <Mail size={26} className="text-teal-400" />
              </div>
              <h2 className="font-syne text-2xl font-bold text-white">Forgot Password?</h2>
              <p className="font-dm text-sm text-slate-400 text-center mt-2">
                Enter your registered email and we'll send you a 6-digit OTP.
              </p>
            </div>

            <form onSubmit={emailForm.handleSubmit(handleSendOtp)} className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className={`input-field ${emailForm.formState.errors.email ? "border-red-500" : ""}`}
                  {...emailForm.register("email", { required: "Email is required" })}
                />
                {emailForm.formState.errors.email && (
                  <p className="text-red-400 text-xs mt-1.5">{emailForm.formState.errors.email.message}</p>
                )}
              </div>
              <button type="submit" disabled={emailForm.formState.isSubmitting}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                {emailForm.formState.isSubmitting
                  ? <span className="w-4 h-4 border-2 border-bg-primary/30 border-t-bg-primary rounded-full animate-spin" />
                  : <Mail size={16} />}
                Send OTP
              </button>
            </form>

            <p className="text-center text-sm font-dm text-slate-500 mt-5">
              Remember it?{" "}
              <Link to="/login" className="text-teal-400 hover:text-teal-300 transition-colors font-medium">
                Back to Login
              </Link>
            </p>
          </div>
        )}

        {/* ── STEP 2: OTP ── */}
        {step === "otp" && (
          <div className="glass-card p-8">
            <div className="flex flex-col items-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-violet-400/10 border border-violet-400/20 flex items-center justify-center mb-4">
                <ShieldCheck size={26} className="text-violet-400" />
              </div>
              <h2 className="font-syne text-2xl font-bold text-white">Enter OTP</h2>
              <p className="font-dm text-sm text-slate-400 text-center mt-2">
                We sent a 6-digit code to
              </p>
              <p className="font-dm text-sm font-semibold text-teal-400 mt-0.5">{email}</p>
            </div>

            {/* OTP boxes */}
            <div className="flex gap-2.5 justify-center mb-5" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => otpRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  className={`w-12 h-14 text-center text-xl font-syne font-bold rounded-xl border
                    bg-bg-primary transition-all outline-none
                    ${otpError ? "border-red-500 text-red-400" : digit ? "border-teal-400 text-teal-400" : "border-bg-border text-white"}
                    focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30`}
                />
              ))}
            </div>

            {otpError && (
              <p className="text-red-400 text-xs text-center mb-4">{otpError}</p>
            )}

            <button
              onClick={handleVerifyOtp}
              disabled={verifying || otp.join("").length < 6}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mb-4"
            >
              {verifying
                ? <span className="w-4 h-4 border-2 border-bg-primary/30 border-t-bg-primary rounded-full animate-spin" />
                : <ShieldCheck size={16} />}
              Verify OTP
            </button>

            {/* Resend */}
            <div className="flex items-center justify-center gap-2">
              {resendTimer > 0 ? (
                <p className="font-dm text-xs text-slate-500">
                  Resend OTP in <span className="text-teal-400 font-semibold">{resendTimer}s</span>
                </p>
              ) : (
                <button onClick={handleResend}
                  className="flex items-center gap-1.5 text-xs font-dm text-slate-400 hover:text-teal-400 transition-colors">
                  <RotateCcw size={12} /> Resend OTP
                </button>
              )}
            </div>

            <button onClick={() => setStep("email")}
              className="flex items-center gap-1.5 text-xs font-dm text-slate-500 hover:text-white transition-colors mx-auto mt-3 block">
              <ArrowLeft size={12} /> Change email
            </button>
          </div>
        )}

        {/* ── STEP 3: Reset Password ── */}
        {step === "reset" && (
          <div className="glass-card p-8">
            <div className="flex flex-col items-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-teal-400/10 border border-teal-400/20 flex items-center justify-center mb-4">
                <Lock size={26} className="text-teal-400" />
              </div>
              <h2 className="font-syne text-2xl font-bold text-white">Set New Password</h2>
              <p className="font-dm text-sm text-slate-400 text-center mt-2">
                Choose a strong password for your account.
              </p>
            </div>

            <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-4">
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    className={`input-field pr-12 ${resetForm.formState.errors.newPassword ? "border-red-500" : ""}`}
                    {...resetForm.register("newPassword", {
                      required: "Password is required",
                      minLength: { value: 6, message: "Min. 6 characters" },
                    })}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-teal-400 transition-colors">
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {resetForm.formState.errors.newPassword && (
                  <p className="text-red-400 text-xs mt-1.5">{resetForm.formState.errors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="label">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat new password"
                    className={`input-field pr-12 ${resetForm.formState.errors.confirmPassword ? "border-red-500" : ""}`}
                    {...resetForm.register("confirmPassword", {
                      required: "Please confirm password",
                      validate: v => v === newPassword || "Passwords do not match",
                    })}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-teal-400 transition-colors">
                    {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {resetForm.formState.errors.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1.5">{resetForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Strength */}
              {newPassword && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {[
                    { label: "6+ characters", ok: newPassword.length >= 6 },
                    { label: "Has number",    ok: /\d/.test(newPassword) },
                    { label: "Has uppercase", ok: /[A-Z]/.test(newPassword) },
                    { label: "Has symbol",    ok: /[^a-zA-Z0-9]/.test(newPassword) },
                  ].map(({ label, ok }) => (
                    <div key={label} className={`flex items-center gap-1.5 text-xs font-dm ${ok ? "text-teal-400" : "text-slate-600"}`}>
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ok ? "bg-teal-400" : "bg-slate-600"}`} />
                      {label}
                    </div>
                  ))}
                </div>
              )}

              <button type="submit" disabled={resetForm.formState.isSubmitting}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2">
                {resetForm.formState.isSubmitting
                  ? <span className="w-4 h-4 border-2 border-bg-primary/30 border-t-bg-primary rounded-full animate-spin" />
                  : <Lock size={16} />}
                Reset Password
              </button>
            </form>
          </div>
        )}

        {/* ── STEP 4: Done ── */}
        {step === "done" && (
          <div className="glass-card p-10 flex flex-col items-center text-center gap-5">
            <div className="w-20 h-20 rounded-full bg-teal-400/10 border-2 border-teal-400/30
              flex items-center justify-center">
              <CheckCircle2 size={40} className="text-teal-400" />
            </div>
            <div>
              <h2 className="font-syne text-2xl font-bold text-white mb-2">Password Reset!</h2>
              <p className="font-dm text-sm text-slate-400">
                Your password has been reset successfully. You can now log in with your new password.
              </p>
            </div>
            <button onClick={() => navigate("/login")} className="btn-primary flex items-center gap-2 px-8 py-3">
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
