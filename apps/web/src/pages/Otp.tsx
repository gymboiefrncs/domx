import {
  useState,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react";

const OTP_LENGTH = 6;

export default function OtpPage() {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));

  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(value: string, index: number): void {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(
    e: KeyboardEvent<HTMLInputElement>,
    index: number,
  ): void {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>): void {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    const next = [...digits];
    pasted.split("").forEach((char, i) => {
      next[i] = char;
    });
    setDigits(next);
    inputs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  }

  const isComplete: boolean = digits.every(Boolean);

  return (
    <div className="min-h-screen bgbg flex items-center p-8 font-sans">
      <div className="card w-full">
        <p className=" uppercase tracking-widest text-text-muted mb-6 font-normal">
          Verify your email
        </p>

        <p className="text-sm text-text-secondary font-normal leading-relaxed mb-4">
          We sent a 6-digit code to your email
        </p>

        <div className="flex gap-2 justify-between mb-6">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleChange(e.target.value, i)
              }
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
                handleKeyDown(e, i)
              }
              onPaste={handlePaste}
              className="input"
            />
          ))}
        </div>

        <button
          disabled={!isComplete}
          className="btn w-full disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Verify code
        </button>

        <p className="text-text-muted text-center mt-5 leading-relaxed font-normal">
          Didn't receive anything?{" "}
          <button className="text-text-secondary border-b border-text-secondary pb-px bg-transparent cursor-pointer text-[11px]">
            Resend code
          </button>
        </p>
      </div>
    </div>
  );
}
