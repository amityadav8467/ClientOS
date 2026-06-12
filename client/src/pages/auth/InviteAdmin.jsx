import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Mail, Send, ShieldCheck, Clock } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import api from "../../utils/api";

export default function InviteAdmin() {
  const [loading, setLoading] = useState(false);
  const [lastInvite, setLastInvite] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = async ({ email }) => {
    setLoading(true);
    setLastInvite(null);

    try {
      const res = await api.post("/api/auth/admin-invite", { email });
      setLastInvite({
        email,
        inviteCode: res.data.inviteCode,
        expiresAt: res.data.expiresAt,
        message: res.data.message,
      });
      toast.success(res.data.message || "Admin invite sent");
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send invite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl">
      <PageHeader
        title="Invite Admin"
        subtitle="Send a time-limited registration code to a new admin"
        backTo="/dashboard"
      />

      <div className="glass-card p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-11 h-11 rounded-xl bg-teal-400/10 text-teal-400 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h2 className="section-title mb-1">Admin invitation</h2>
            <p className="font-dm text-sm text-slate-400">
              The invite code can only be used by this email address and expires after 30 minutes.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="label">New Admin Email</label>
            <div className="relative">
              <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                placeholder="newadmin@example.com"
                className={`input-field pl-11 ${errors.email ? "border-red-500" : ""}`}
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address",
                  },
                })}
              />
            </div>
            {errors.email && <p className="text-red-400 text-xs mt-1.5">{errors.email.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-bg-primary/30 border-t-bg-primary rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send size={16} />
                Send Invite
              </>
            )}
          </button>
        </form>

        {lastInvite && (
          <div className="mt-6 rounded-xl border border-teal-400/20 bg-teal-400/5 p-4">
            <div className="flex items-start gap-3">
              <Clock size={18} className="text-teal-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-dm text-sm text-white">{lastInvite.message}</p>
                <p className="font-dm text-xs text-slate-400 mt-1">
                  Sent to {lastInvite.email}
                  {lastInvite.expiresAt ? ` - Expires ${new Date(lastInvite.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
                </p>
                {lastInvite.inviteCode && (
                  <p className="font-dm text-xs text-amber-400 mt-3">
                    Local test code: <span className="font-mono text-sm">{lastInvite.inviteCode}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
