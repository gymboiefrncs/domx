import { useState } from "react";
import { useSignup } from "@/hooks/useSignup";
import { SpinnerIcon } from "@/assets/icons";
import { Link } from "react-router-dom";

export default function SignupPage() {
  const [email, setEmail] = useState<string>("");
  const { handleSignup, loading } = useSignup();

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-8 font-sans">
      <div className="card w-full">
        {/* Eyebrow */}
        <h5 className=" uppercase tracking-wide text-text mb-4 font-medium">
          Create account
        </h5>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSignup(email);
          }}
        >
          <div className="field mb-4">
            <label htmlFor="email" className="field-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className="input"
            />
          </div>

          <button type="submit" className="w-full btn" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <SpinnerIcon className="h-4 w-4 animate-spin" />
                Creating account...
              </span>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        {/* Terms */}
        <p className=" text-text-secondary text-center mt-4 leading-relaxed font-light">
          By signing up you agree to our{" "}
          <a href="#" className="underline text-text-link">
            Terms
          </a>{" "}
          and{" "}
          <a href="#" className="underline text-text-link">
            Privacy Policy
          </a>
          .
        </p>

        {/* Divider */}
        <div className="flex items-center gap-2.5 my-6">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-[11px] text-text-muted tracking-wide whitespace-nowrap">
            or sign in
          </span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-text-muted font-light">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-text-link border-b border-text-link pb-px"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
