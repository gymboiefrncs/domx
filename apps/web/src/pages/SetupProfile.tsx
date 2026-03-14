import { useState, type ChangeEvent } from "react";

export default function SetupProfilePage() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const passwordTooShort: boolean = password.length > 0 && password.length < 8;
  const canSubmit: boolean = username.length > 0 && password.length >= 8;

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-8 font-sans">
      <div className="card w-full">
        <p className=" uppercase tracking-widest text-text-muted mb-4 font-normal">
          One last step
        </p>

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
          <p className="text-text-secondary mt-1.5 font-normal">
            This is how others will see you on the platform.
          </p>
        </div>

        <div className="field mb-4">
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
            className="input"
          />
          {passwordTooShort && (
            <p className=" text-error mt-1.5 font-light">
              Password must be at least 8 characters.
            </p>
          )}
        </div>

        <button
          disabled={!canSubmit}
          className="w-full btn disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Finish setup
        </button>
      </div>
    </div>
  );
}
