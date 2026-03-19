import { EyeOffIcon, SpinnerIcon, EyeIcon } from "@/assets/icons";
import { useSetInfo } from "@/hooks/useSignup";
import { useState, type ChangeEvent } from "react";

export default function SetupProfilePage() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const { handleSetInfo, loading } = useSetInfo();

  const passwordTouched = password.length > 0;

  const tooShort = passwordTouched && password.length < 12;
  const missingUppercase = passwordTouched && !/[A-Z]/.test(password);
  const missingLowercase = passwordTouched && !/[a-z]/.test(password);
  const missingNumber = passwordTouched && !/[0-9]/.test(password);
  const missingSpecial = passwordTouched && !/[^A-Za-z0-9]/.test(password);

  const passwordErrors: string[] = [
    tooShort && "at least 12 characters",
    missingUppercase && "an uppercase letter",
    missingLowercase && "a lowercase letter",
    missingNumber && "a number",
    missingSpecial && "a special character",
  ].filter(Boolean) as string[];

  const canSubmit: boolean =
    username.length > 0 && password.length > 0 && passwordErrors.length === 0;

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-8 font-sans">
      <div className="card w-full">
        <h5 className=" uppercase tracking-wide text-text mb-4 font-medium">
          One last step
        </h5>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSetInfo(username, password);
          }}
        >
          <div className="field mb-4">
            <label htmlFor="username" className="field-label">
              Username
            </label>
            <input
              id="username"
              type="text"
              placeholder="mara_reyes"
              value={username}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setUsername(e.target.value)
              }
              className="input"
            />
            <p className="text-text-secondary mt-1.5 font-normal leading-relaxed">
              This is how others will see you on the platform.
            </p>
          </div>

          <div className="field mb-4">
            <label htmlFor="password" className="field-label">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                className="input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <EyeOffIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            {passwordErrors.length > 0 && (
              <p className="text-error mt-1.5 font-normal">
                Password must contain {passwordErrors.join(", ")}.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full btn disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <SpinnerIcon className="h-4 w-4 animate-spin" />
                Saving...
              </span>
            ) : (
              "Save"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
