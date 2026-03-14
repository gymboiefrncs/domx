import { useState, type ChangeEvent } from "react";

export default function SetupProfilePage() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const passwordTooShort: boolean = password.length > 0 && password.length < 8;
  const canSubmit: boolean = username.length > 0 && password.length >= 8;

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center px-5 py-8 font-sans">
      <div className="w-full max-w-sm mx-auto bg-white border border-[#E2E0D8] rounded-2xl px-7 py-9">
        <p className="text-[11px] uppercase tracking-widest text-[#B0A89A] mb-2 font-normal">
          One last step
        </p>

        <div className="mb-5">
          <label
            htmlFor="username"
            className="block text-[11.5px] uppercase tracking-wider text-[#8C8580] font-medium mb-1.5"
          >
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
            className="w-full h-11 bg-[#FAFAF8] border border-[#D8D4CC] rounded-lg px-3.5 text-sm font-light text-[#1C1B18] placeholder:text-[#C0BAB2] focus:outline-none focus:border-[#7C6F5B] focus:bg-white transition-colors"
          />
          <p className="text-[11px] text-[#9f9e9b] mt-1.5 font-light">
            This is how others will see you on the platform.
          </p>
        </div>

        <div className="mb-5">
          <label
            htmlFor="password"
            className="block text-[11.5px] uppercase tracking-wider text-[#8C8580] font-medium mb-1.5"
          >
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
            className="w-full h-11 bg-[#FAFAF8] border border-[#D8D4CC] rounded-lg px-3.5 text-sm font-light text-[#1C1B18] placeholder:text-[#C0BAB2] focus:outline-none focus:border-[#7C6F5B] focus:bg-white transition-colors"
          />
          {passwordTooShort && (
            <p className="text-[11px] text-red-400 mt-1.5 font-light">
              Password must be at least 8 characters.
            </p>
          )}
        </div>

        <button
          disabled={!canSubmit}
          className="w-full h-11.5 bg-[#1C1B18] text-[#FAF9F6] rounded-lg text-[13.5px] tracking-wide font-normal transition-all cursor-pointer hover:bg-[#2E2D29] active:scale-[0.985] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Finish setup
        </button>
      </div>
    </div>
  );
}
