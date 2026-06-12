import { useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, ShieldCheck, Lock, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";

export default function ChangePassword() {
  const { user } = useAuth();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const newPassword = watch("newPassword");

  const onSubmit = async (data) => {
    try {
      await api.post("/api/auth/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setSuccess(true);
      reset();
      toast.success("Password changed successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    }
  };

  const backTo = user?.role === "client" ? "/portal" : "/dashboard";

  return (
    <div className="animate-fade-in max-w-lg">
      <PageHeader
        title="Change Password"
        subtitle="Update your account password"
        backTo={backTo}
      />

      {success ? (
        <div className="glass-card p-10 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-teal-400/10 border border-teal-400/20
            flex items-center justify-center">
            <CheckCircle2 size={32} className="text-teal-400" />
          </div>
          <h3 className="font-syne text-xl font-bold text-white">Password Changed!</h3>
          <p className="font-dm text-sm text-slate-400">
            Your password has been updated successfully.
          </p>
          <button onClick={() => setSuccess(false)} className="btn-ghost text-sm mt-2">
            Change Again
          </button>
        </div>
      ) : (
        <div className="glass-card p-7">
          {/* User info */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-bg-primary border border-bg-border mb-6">
            <div className="w-10 h-10 rounded-xl bg-teal-400/10 border border-teal-400/20
              flex items-center justify-center flex-shrink-0">
              <span className="font-syne font-bold text-teal-400">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-dm text-sm font-medium text-white">{user?.name}</p>
              <p className="font-dm text-xs text-slate-500">{user?.email}</p>
            </div>
            <span className={`ml-auto badge ${user?.role === "admin" ? "badge-active" : "badge-planning"}`}>
              {user?.role}
            </span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Current password */}
            <div>
              <label className="label">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  placeholder="Your current password"
                  className={`input-field pr-12 ${errors.currentPassword ? "border-red-500" : ""}`}
                  {...register("currentPassword", { required: "Current password is required" })}
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-teal-400 transition-colors">
                  {showCurrent ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-red-400 text-xs mt-1.5">{errors.currentPassword.message}</p>
              )}
            </div>

            <div className="border-t border-bg-border pt-4">
              {/* New password */}
              <div className="mb-4">
                <label className="label">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    className={`input-field pr-12 ${errors.newPassword ? "border-red-500" : ""}`}
                    {...register("newPassword", {
                      required: "New password is required",
                      minLength: { value: 6, message: "Min. 6 characters" },
                      validate: (val) =>
                        val !== watch("currentPassword") || "New password must differ from current",
                    })}
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-teal-400 transition-colors">
                    {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-red-400 text-xs mt-1.5">{errors.newPassword.message}</p>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="label">Confirm New Password</label>
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
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-teal-400 transition-colors">
                    {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1.5">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Strength indicator */}
            {newPassword && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  { label: "6+ characters",  ok: newPassword.length >= 6 },
                  { label: "Has number",     ok: /\d/.test(newPassword) },
                  { label: "Has uppercase",  ok: /[A-Z]/.test(newPassword) },
                  { label: "Has symbol",     ok: /[^a-zA-Z0-9]/.test(newPassword) },
                ].map(({ label, ok }) => (
                  <div key={label} className={`flex items-center gap-1.5 text-xs font-dm
                    ${ok ? "text-teal-400" : "text-slate-600"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ok ? "bg-teal-400" : "bg-slate-600"}`} />
                    {label}
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2"
            >
              {isSubmitting
                ? <span className="w-4 h-4 border-2 border-bg-primary/30 border-t-bg-primary rounded-full animate-spin" />
                : <Lock size={16} />}
              Update Password
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
