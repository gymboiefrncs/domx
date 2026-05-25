import { useResendOTP, useVerifyOTP } from "@/features/auth/index";
import { useState, useRef, type ChangeEvent, type KeyboardEvent } from "react";
import { Navigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const OTP_LENGTH = 6;

export default function OtpPage() {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const { handleVerifyOTP, loading } = useVerifyOTP();
  const { handleResendOTP, loading: loadingResend } = useResendOTP();
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const email = sessionStorage.getItem("OTP_EMAIL");
  if (!email) return <Navigate to="/signup" replace={true} />;

  const handleChange = (value: string, index: number): void => {
    if (!/^[0-9a-f]$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    index: number,
  ): void => {
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

  const isComplete = otp.every(Boolean);

  return (
    <div className="auth-shell">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Verify your email
          </CardTitle>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If this email exists we'll send you an OTP.
          </p>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerifyOTP({ email, otp: otp.join("") });
            }}
            className="space-y-6"
          >
            <div className="flex justify-between gap-2">
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
                  className="otp-input"
                />
              ))}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!isComplete || loading}
            >
              {loading ? "Verifying..." : "Verify"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-xs text-muted-foreground">
            Didn't receive anything?{" "}
            <button
              type="button"
              onClick={() => void handleResendOTP(email)}
              disabled={loadingResend}
              className="
              text-foreground 
              underline 
              underline-offset-4 
              hover:text-muted-foreground 
              transition-colors 
              disabled:opacity-50 
              disabled:cursor-not-allowed"
            >
              {loadingResend ? "Resending..." : "Resend OTP"}
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
