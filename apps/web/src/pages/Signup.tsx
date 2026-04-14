import { useState } from "react";
import { useSignup } from "@/features/auth/hooks/useAuth";
import { SpinnerIcon } from "@/shared/assets/icons";
import { Link } from "react-router-dom";

export default function SignupPage() {
  const [email, setEmail] = useState<string>("");
  const { handleSignup, loading } = useSignup();

  return (
    <div className="auth-shell">
      <div className="auth-card">
        {/* Eyebrow */}
        <h5 className="mb-4 text-sm font-medium uppercase tracking-wide text-text md:mb-5 md:text-base">
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
        <p className="mt-4 text-center text-sm font-light leading-relaxed text-text-secondary md:text-base">
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
        <div className="my-6 flex items-center gap-2.5 md:my-7">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="whitespace-nowrap text-xs tracking-wide text-text-muted md:text-sm">
            or sign in
          </span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        {/* Footer */}
        <p className="text-center text-xs font-light text-text-muted md:text-sm">
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
