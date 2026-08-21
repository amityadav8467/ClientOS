import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, RefreshCw } from "lucide-react";
import api from "../../utils/api";

export default function CaptchaField({
  register,
  errors,
  onChallenge,
  setValue,
  refreshKey,
}) {
  const [captcha, setCaptcha] = useState({ captchaId: "", question: "" });
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    const fetchCaptcha = async () => {
      setLoading(true);
      setInputValue("");
      setValue("captchaAnswer", "");
      if (onChallenge) onChallenge("");
      try {
        const res = await api.get("/api/auth/captcha");
        const next = {
          captchaId: res.data?.captchaId || "",
          question: res.data?.question || "",
        };
        setCaptcha(next);
        if (onChallenge) onChallenge(next.captchaId);
      } catch {
        setCaptcha({ captchaId: "", question: "Unable to load CAPTCHA" });
      } finally {
        setLoading(false);
      }
    };

    fetchCaptcha();
  }, [onChallenge, setValue]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Refresh when parent increments refreshKey (e.g. on failed login)
  useEffect(() => {
    if (refreshKey > 0) {
      refresh();
    }
  }, [refreshKey, refresh]);

  return (
    <div>
      <label className="label">Security Check</label>
      <div className="flex items-center gap-2">
        {/* Question box */}
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-bg-primary
          border border-teal-400/30 flex-shrink-0">
          <ShieldCheck size={15} className="text-teal-400 flex-shrink-0" />
          <span className="font-syne font-bold text-teal-400 text-base tracking-wider whitespace-nowrap">
            {captcha.question} = ?
          </span>
        </div>

        {/* Answer input */}
        <input
          type="number"
          placeholder="Answer"
          value={inputValue}
          className={`input-field flex-1 text-center font-syne font-bold text-lg
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
            [&::-webkit-inner-spin-button]:appearance-none
           ${errors.captchaAnswer ? "border-red-500" : ""}`}
          {...register("captchaAnswer", {
            required: "Please answer the security check",
          })}
          onChange={(e) => {
            setInputValue(e.target.value);
            setValue("captchaAnswer", e.target.value);
          }}
        />

        {/* Refresh button */}
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="w-11 h-11 rounded-xl border border-bg-border flex items-center justify-center
            text-slate-500 hover:text-teal-400 hover:border-teal-400/40 transition-all flex-shrink-0"
          title="Get new question"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {errors.captchaAnswer && (
        <p className="text-red-400 text-xs mt-1.5">{errors.captchaAnswer.message}</p>
      )}
    </div>
  );
}
