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
    <div className="min-h-screen bg-[#FAFAF8] flex items-center px-5 py-8 font-sans">
      <div className="w-full max-w-sm mx-auto bg-white border border-[#E2E0D8] rounded-2xl px-7 py-9">
        <p className="text-[11px] uppercase tracking-widest text-[#a9a5a0] mb-2 font-normal">
          Verify your email
        </p>

        <p className="text-sm text-[#7f7e7c] font-light leading-relaxed mb-8">
          We sent a 6-digit code to your email. It expires in 2 minutes.
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
              className="w-full aspect-square text-center text-lg font-normal text-[#1C1B18] bg-[#FAFAF8] border border-[#D8D4CC] rounded-lg focus:outline-none focus:border-[#7C6F5B] focus:bg-white transition-colors"
            />
          ))}
        </div>

        <button
          disabled={!isComplete}
          className="w-full h-11.5 bg-[#1C1B18] text-[#FAF9F6] rounded-lg text-[13.5px] tracking-wide font-normal transition-all cursor-pointer hover:bg-[#2E2D29] active:scale-[0.985] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Verify code
        </button>

        <p className="text-[11px] text-[#838280] text-center mt-5 leading-relaxed font-light">
          Didn't receive anything?{" "}
          <button className="text-[#7C6F5B] border-b border-[#7C6F5B] pb-px bg-transparent cursor-pointer text-[11px]">
            Resend code
          </button>
        </p>
      </div>
    </div>
  );
}
