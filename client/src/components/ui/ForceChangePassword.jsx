import { useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, ShieldCheck, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

export default function ForceChangePassword() {
  const { clearFirstLogin } = useAuth();
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const newPassword = watch("newPassword");

  const onSubmit = async (data) => {
    try {
      await api.post("/api/auth/force-change-password", {
        newPassword: data.newPassword,
      });
      toast.success("Password set! Welcome to ClientOS 🎉");
      clearFirstLogin();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to set password");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px]
        bg-teal-400/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md animate-slide-up">
        {/* Card */}
        <div className="glass-card p-8">
          {/* Icon */}
          <div className="flex flex-col items-center mb-7">
            <div className="w-16 h-16 rounded-2xl bg-teal-400/10 border border-teal-400/20
              flex items-center justify-center mb-4">
              <ShieldCheck size={30} className="text-teal-400" />
            </div>
            <h2 className="font-syne text-2xl font-bold text-white text-center">
              Set Your Password
            </h2>
            <p className="font-dm text-sm text-slate-400 text-center mt-2 max-w-xs">
              Your account was created with a temporary password. Please set a new secure password to continue.
            </p>
          </div>

          {/* Warning badge */}
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-400/8
            border border-amber-400/20 mb-6">
            <KeyRound size={15} className="text-amber-400 flex-shrink-0" />
            <p className="font-dm text-xs text-amber-300">
              You must change your password before accessing the portal.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* New password */}
            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  className={`input-field pr-12 ${errors.newPassword ? "border-red-500" : ""}`}
                  {...register("newPassword", {
                    required: "New password is required",
                    minLength: { value: 6, message: "Min. 6 characters" },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-teal-400 transition-colors"
                >
                  {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-red-400 text-xs mt-1.5">{errors.newPassword.message}</p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat new password"
                  className={`input-field pr-12 ${errors.confirmPassword ? "border-red-500" : ""}`}
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (val) => val === newPassword || "Passwords do not match",
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-teal-400 transition-colors"
                >
                  {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-xs mt-1.5">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Password strength hints */}
            {newPassword && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "6+ characters", ok: newPassword.length >= 6 },
                  { label: "Has number", ok: /\d/.test(newPassword) },
                  { label: "Has uppercase", ok: /[A-Z]/.test(newPassword) },
                  { label: "Has symbol", ok: /[^a-zA-Z0-9]/.test(newPassword) },
                ].map(({ label, ok }) => (
                  <div key={label} className={`flex items-center gap-1.5 text-xs font-dm
                    ${ok ? "text-teal-400" : "text-slate-600"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-teal-400" : "bg-slate-600"}`} />
                    {label}
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2 py-3"
            >
              {isSubmitting && (
                <span className="w-4 h-4 border-2 border-bg-primary/30 border-t-bg-primary rounded-full animate-spin" />
              )}
              Set Password & Continue
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
