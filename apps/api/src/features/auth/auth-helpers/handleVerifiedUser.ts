import type { RegistrationResult } from "../auth.types.js";
import { EMAIL_MESSAGE } from "@api/features/verification/index.js";

export const handleVerifiedUser = (email: string): RegistrationResult => {
  return {
    ok: true as const,
    reason: "ALREADY_VERIFIED" as const,
    email,
    message: EMAIL_MESSAGE,
  };
};
