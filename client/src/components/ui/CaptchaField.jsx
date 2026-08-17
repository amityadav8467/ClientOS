import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, RefreshCw } from "lucide-react";

function generateCaptcha() {
  const ops = ["+", "-", "×"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a, b, answer;

  if (op === "+") {
    a = Math.floor(Math.random() * 20) + 1;
    b = Math.floor(Math.random() * 20) + 1;
    answer = a + b;
  } else if (op === "-") {
    a = Math.floor(Math.random() * 20) + 10;
    b = Math.floor(Math.random() * 10) + 1;
    answer = a - b;
  } else {
    a = Math.floor(Math.random() * 9) + 2;
    b = Math.floor(Math.random() * 9) + 2;
    answer = a * b;
  }

  return { question: `${a} ${op} ${b}`, answer: String(answer) };
}

export default function CaptchaField({
  register,
  errors,
  onChallenge,
  setValue,
  refreshKey,
}) {
  const [captcha, setCaptcha] = useState(() => generateCaptcha());
  const [inputValue, setInputValue] = useState("");

  const refresh = useCallback(() => {
    const next = generateCaptcha();
    setCaptcha(next);
    setInputValue("");
    setValue("captchaAnswer", "");
    // Pass the answer as the "captchaId" so Login can validate it
    if (onChallenge) onChallenge(next.answer);
  }, [onChallenge, setValue]);

  // Initialize on mount
  useEffect(() => {
    if (onChallenge) onChallenge(captcha.answer);
  }, []);

  // Refresh when parent increments refreshKey (e.g. on failed login)
  useEffect(() => {
    if (refreshKey > 0) refresh();
  }, [refreshKey]);

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
            validate: (val) =>
              String(parseInt(val)) === captcha.answer || "Wrong answer — try again",
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
          className="w-11 h-11 rounded-xl border border-bg-border flex items-center justify-center
            text-slate-500 hover:text-teal-400 hover:border-teal-400/40 transition-all flex-shrink-0"
          title="Get new question"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {errors.captchaAnswer && (
        <p className="text-red-400 text-xs mt-1.5">{errors.captchaAnswer.message}</p>
      )}
    </div>
  );
}
