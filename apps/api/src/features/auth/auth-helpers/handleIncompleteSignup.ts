import { generateSetInfoToken } from "@api/features/verification/index.js";
import type { RegistrationResult } from "../auth.types.js";

// returns a token to allow user to continue the signup flow by setting username and password
export const handleIncompleteSignup = async (
  userId: string,
): Promise<RegistrationResult> => {
  const setInfoToken = await generateSetInfoToken(userId);
  return {
    ok: true,
    message:
      "Incomplete signup. Please set your username and password to complete the registration.",
    reason: "INCOMPLETE_SIGNUP",
    data: { setInfoToken },
  };
};
