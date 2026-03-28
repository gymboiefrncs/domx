import { SpinnerIcon } from "@/assets/icons";
import { useVerifyOTP } from "@/hooks/useAuth";
import { useState, useRef, type ChangeEvent, type KeyboardEvent } from "react";
import { Navigate } from "react-router-dom";

const OTP_LENGTH = 6;

export default function OtpPage() {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const { handleVerifyOTP, loading } = useVerifyOTP();
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  /**
   * Retrieve the email from sessionStorage which was set during the signup step.
   * Navigatete back to signup if email is not found which can only happen if user directly navigates to /otp
   */
  const email = sessionStorage.getItem("OTP_EMAIL");
  if (!email) {
    return <Navigate to="/signup" replace={true} />;
  }

  const handleChange = (value: string, index: number): void => {
    // Rejects any non-hex charcaters early to prevent users from entering invalid OTP values
    if (!/^[0-9a-f]$/.test(value)) return;

    const next = [...otp];
    next[index] = value;
    setOtp(next);

    // Auto-advance focus so the user doesn't have to click each box manually
    if (value && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    index: number,
  ): void => {
    /**
     * Backspace on empty input should move focus to the previous input and clear it
     * Backspace on non-empty input should just clear the current input
     *
     * This allows users to easily correct mistakes without having to manually click each input
     */
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
      const prev = [...otp];
      prev[index - 1] = "";
      setOtp(prev);
    } else if (e.key === "Backspace" && otp[index]) {
      const prev = [...otp];
      prev[index] = "";
      setOtp(prev);
    }
  };

  /**
   * Flag to determine if the all inputs are filled
   * Returns false if any input is empty
   */
  const isComplete: boolean = otp.every(Boolean);

  return (
    <div className="min-h-screen bg-bg flex items-center p-8 font-sans">
      <div className="card w-full">
        <h5 className=" uppercase tracking-wide text-text mb-6 font-medium">
          Verify your email
        </h5>

        <p className="text-text-secondary font-normal leading-relaxed mb-4">
          If this email exist we will send you an OTP.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerifyOTP(email, otp.join(""));
          }}
        >
          <div className="flex gap-2 justify-between mb-6">
            {otp.map((char, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                type="text"
                maxLength={1}
                value={char}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleChange(e.target.value, i)
                }
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
                  handleKeyDown(e, i)
                }
                className="input"
              />
            ))}
          </div>
          <button
            type="submit"
            disabled={!isComplete}
            className="btn w-full disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <SpinnerIcon className="h-4 w-4 spinner" />
                Verifying...
              </span>
            ) : (
              "Verify"
            )}
          </button>
        </form>

        <p className="text-text-muted text-center mt-5 leading-relaxed font-normal">
          Didn't receive anything?{" "}
          <button className="text-text-link border-b border-text-link pb-px bg-transparent cursor-pointer">
            Resend OTP
          </button>
        </p>
      </div>
    </div>
  );
}
