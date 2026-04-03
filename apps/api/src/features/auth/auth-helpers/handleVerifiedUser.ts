import type { RegistrationResult } from "../auth.types.js";
import { VERIFICATION_SUCCESS } from "@api/features/verification/index.js";

export const handleVerifiedUser = (email: string): RegistrationResult => {
  return {
    ok: true as const,
    reason: "ALREADY_VERIFIED" as const,
    email,
    message: VERIFICATION_SUCCESS.EMAIL_SENT,
  };
};
