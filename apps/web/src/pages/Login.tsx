import { useState } from "react";
import { useLogin } from "@/hooks/useLogin";
import { EyeIcon, EyeOffIcon } from "@/assets/icons";
import { Link } from "react-router-dom";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { handleLogin, loading } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-8 font-sans">
      <div className="card w-full">
        {/* Eyebrow */}
        <h5 className=" uppercase tracking-wide text-text mb-4 font-weight">
          Log in
        </h5>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin(email, password);
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

          <div className="relative">
            <div className="field mb-4">
              <label htmlFor="password" className="field-label">
                Password
              </label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-text-muted hover:text-text transition-colors cursor-pointer"
            >
              {showPassword ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </div>

          <button type="submit" className="w-full btn" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-2.5 my-6">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-[11px] text-text-muted tracking-wide whitespace-nowrap">
            or sign up
          </span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-text-muted font-light">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-text-link border-b border-text-link pb-px"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};
