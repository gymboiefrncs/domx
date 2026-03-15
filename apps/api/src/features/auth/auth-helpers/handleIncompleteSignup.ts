import { generateSetInfoToken } from "@api/features/verification/verification-helpers/generateSetInfoToken.js";
import type { RegistrationResult } from "@api/common/types.js";

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
