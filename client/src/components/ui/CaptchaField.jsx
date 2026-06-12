import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import api from "../../utils/api";

export default function CaptchaField({ register, errors, onChallenge, setValue, refreshKey = 0 }) {
  const [captcha, setCaptcha] = useState(null);
  const [loading, setLoading] = useState(false);

  const refreshCaptcha = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/auth/captcha");
      setCaptcha(res.data);
      onChallenge(res.data.captchaId);
      setValue?.("captchaAnswer", "");
    } catch {
      setCaptcha(null);
      onChallenge("");
      setValue?.("captchaAnswer", "");
    } finally {
      setLoading(false);
    }
  }, [onChallenge, setValue]);

  useEffect(() => {
    refreshCaptcha();
  }, [refreshCaptcha, refreshKey]);

  return (
    <div>
      <label className="label">Security Check</label>
      <div className="flex items-end gap-3">
        <div className="h-[46px] min-w-[104px] rounded-xl border border-bg-border bg-bg-card px-4 flex items-center justify-center">
          {loading ? (
            <span className="w-4 h-4 border-2 border-slate-600 border-t-teal-400 rounded-full animate-spin" />
          ) : (
            <div className="flex items-center gap-2 text-white font-syne font-semibold">
              <ShieldCheck size={16} className="text-teal-400" />
              <span>{captcha?.question || "--"}</span>
            </div>
          )}
        </div>

        <input
          type="text"
          inputMode="numeric"
          placeholder="Answer"
          className={`input-field flex-1 ${errors.captchaAnswer ? "border-red-500" : ""}`}
          {...register("captchaAnswer", { required: "CAPTCHA answer is required" })}
        />

        <button
          type="button"
          onClick={refreshCaptcha}
          disabled={loading}
          className="h-[46px] w-[46px] rounded-xl border border-bg-border text-slate-400 hover:text-teal-400 hover:border-teal-400/40 transition-all flex items-center justify-center disabled:opacity-50"
          title="Refresh CAPTCHA"
        >
          <RefreshCw size={17} />
        </button>
      </div>
      {errors.captchaAnswer && <p className="text-red-400 text-xs mt-1.5">{errors.captchaAnswer.message}</p>}
    </div>
  );
}
