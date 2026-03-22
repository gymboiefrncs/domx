import type { RegistrationResult } from "@api/common/types.js";
import { EMAIL_MESSAGE } from "@api/common/constants.js";

export const handleVerifiedUser = (email: string): RegistrationResult => {
  return {
    ok: true as const,
    reason: "ALREADY_VERIFIED" as const,
    email,
    message: EMAIL_MESSAGE,
  };
};
