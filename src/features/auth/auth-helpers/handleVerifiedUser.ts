import type { RegistrationResult } from "../../../common/types.js";
import { EMAIL_MESSAGE } from "../auth-service.js";

export const handleVerifiedUser = (email: string): RegistrationResult => {
  return {
    ok: true as const,
    reason: "ALREADY_VERIFIED" as const,
    email,
    message: EMAIL_MESSAGE,
  };
};
