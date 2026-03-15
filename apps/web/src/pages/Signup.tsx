import { useState } from "react";
import { useSignup } from "@/hooks/useSignup";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const { handleSignup, loading, error } = useSignup();

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-8 font-sans">
      <div className="card w-full">
        {/* Eyebrow */}
        <p className=" uppercase tracking-widest text-text-muted mb-4 font-normal">
          Create account
        </p>

        {error && <p className="text-red-500">{error}</p>}

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
              required
              className="input"
            />
          </div>

          <button type="submit" className="w-full btn" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        {/* Terms */}
        <p className=" text-text-secondary text-center mt-4 leading-relaxed font-light">
          By signing up you agree to our{" "}
          <a href="#" className="underline text-text-secondary">
            Terms
          </a>{" "}
          and{" "}
          <a href="#" className="underline text-text-secondary">
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
          <a
            href="/login"
            className="text-text-secondary border-b border-text-secondary pb-px"
          >
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
