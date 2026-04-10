import { useState } from "react";
import { useLogin } from "@/hooks/useAuth";
import { EyeIcon, EyeOffIcon } from "@/assets/icons";
import { Link } from "react-router-dom";

export const LoginPage = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const { handleLogin, loading } = useLogin();
  const [showPassword, setShowPassword] = useState<boolean>(false);

  return (
    <div className="auth-shell">
      <div className="auth-card">
        {/* Eyebrow */}
        <h5 className="mb-4 text-sm font-medium uppercase tracking-wide text-text md:mb-5 md:text-base">
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
        <div className="my-6 flex items-center gap-2.5 md:my-7">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="whitespace-nowrap text-xs tracking-wide text-text-muted md:text-sm">
            or sign up
          </span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        {/* Footer */}
        <p className="text-center text-xs font-light text-text-muted md:text-sm">
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
