import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Eye, EyeOff, Zap } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import CaptchaField from "../../components/ui/CaptchaField";

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [captchaId, setCaptchaId] = useState("");
  const [captchaRefreshKey, setCaptchaRefreshKey] = useState(0);

  const { register, handleSubmit, formState: { errors }, watch, getValues, trigger, setValue } = useForm();
  const password = watch("password");

  const sendOtp = async () => {
    const valid = await trigger(["email", "inviteCode"]);
    if (!valid) return;

    const { email, inviteCode } = getValues();
    setOtpLoading(true);

    try {
      const res = await api.post("/api/auth/register/send-otp", { email, inviteCode });
      setOtpSent(true);
      toast.success(res.data.message || "OTP sent to your email");
      if (res.data.emailOtp) {
        toast.success(`Local test OTP: ${res.data.emailOtp}`);
      }
    } catch (err) {
      setOtpSent(false);
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await registerUser(
        data.name,
        data.email,
        data.password,
        data.inviteCode,
        data.emailOtp,
        captchaId,
        data.captchaAnswer
      );
      toast.success("Account created! Welcome to ClientOS 🎉");
      navigate("/dashboard");
    } catch (err) {
      setCaptchaRefreshKey((key) => key + 1);
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-teal-400/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent-purple/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-slide-up relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-teal-400 flex items-center justify-center shadow-glow">
              <Zap size={20} className="text-bg-primary" strokeWidth={2.5} />
            </div>
            <span className="font-syne text-2xl font-bold text-white">ClientOS</span>
          </div>
          <h1 className="font-syne text-3xl font-bold text-white mb-2">Create account</h1>
          <p className="font-dm text-slate-400 text-sm">Verify your invite and email to continue</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                placeholder="Amit Yadav"
                className={`input-field ${errors.name ? "border-red-500" : ""}`}
                {...register("name", { required: "Name is required", minLength: { value: 2, message: "Min 2 characters" } })}
              />
              {errors.name && <p className="text-red-400 text-xs mt-1.5">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                placeholder="amit@codexora.com"
                className={`input-field ${errors.email ? "border-red-500" : ""}`}
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address",
                  },
                })}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Admin Invite Code</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="6-digit code"
                className={`input-field ${errors.inviteCode ? "border-red-500" : ""}`}
                {...register("inviteCode", {
                  required: "Invite code is required",
                  minLength: { value: 6, message: "Enter the 6-digit code" },
                  maxLength: { value: 6, message: "Enter the 6-digit code" },
                })}
              />
              {errors.inviteCode && <p className="text-red-400 text-xs mt-1.5">{errors.inviteCode.message}</p>}
            </div>

            <div>
              <div className="flex items-end justify-between gap-3">
                <div className="flex-1">
                  <label className="label">Email OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="6-digit OTP"
                    className={`input-field ${errors.emailOtp ? "border-red-500" : ""}`}
                    {...register("emailOtp", {
                      required: "Email OTP is required",
                      minLength: { value: 6, message: "Enter the 6-digit OTP" },
                      maxLength: { value: 6, message: "Enter the 6-digit OTP" },
                    })}
                  />
                </div>
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={otpLoading}
                  className="btn-ghost h-[46px] flex-shrink-0 px-4 text-sm"
                >
                  {otpLoading ? "Sending..." : otpSent ? "Resend" : "Send OTP"}
                </button>
              </div>
              {errors.emailOtp && <p className="text-red-400 text-xs mt-1.5">{errors.emailOtp.message}</p>}
              {otpSent && <p className="text-teal-400 text-xs mt-1.5">OTP sent. It expires in 10 minutes.</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  className={`input-field pr-12 ${errors.password ? "border-red-500" : ""}`}
                  {...register("password", { required: "Password is required", minLength: { value: 6, message: "Min 6 characters" } })}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-teal-400 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1.5">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <input
                type="password"
                placeholder="Repeat password"
                className={`input-field ${errors.confirmPassword ? "border-red-500" : ""}`}
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (val) => val === password || "Passwords do not match",
                })}
              />
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1.5">{errors.confirmPassword.message}</p>}
            </div>

            <CaptchaField
              register={register}
              errors={errors}
              onChallenge={setCaptchaId}
              setValue={setValue}
              refreshKey={captchaRefreshKey}
            />

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-bg-primary/30 border-t-bg-primary rounded-full animate-spin" />
                  Creating account...
                </>
              ) : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm font-dm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-teal-400 hover:text-teal-300 transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
