import type { PoolClient } from "pg";
import type { NewUser, SignupRequest } from "../auth.types.js";
import { createUser } from "../auth.repositories.js";
import {
  createSignupOtp,
  VERIFICATION_SUCCESS,
} from "@api/features/verification/index.js";
import type { RegistrationResult } from "../auth.types.js";

/**
 * Handles new user registration
 * creatUser uses ON CONFLICT DO NOTHING, so if another request already created this user,
 * it will return undefined. In that case, we treat it as a success and step aside.
 */
export const handleNewUser = async (
  data: SignupRequest,
  otpData: { hashedOTP: string; expiresAt: Date; otp: string },
  client: PoolClient,
): Promise<RegistrationResult> => {
  const { hashedOTP, expiresAt } = otpData;

  const newUser: NewUser | null = await createUser(data, client);

  if (!newUser) {
    /**
     * Another request won the race and created the user.
     * Intentionally return success and step aside.
     */
    return {
      reason: "UNIQUE_EMAIL_VIOLATION" as const,
      message: VERIFICATION_SUCCESS.EMAIL_SENT,
    };
  }

  await createSignupOtp(newUser.id, hashedOTP, expiresAt, client);

  return {
    reason: "NEW_USER" as const,
    email: newUser.email,
    message: VERIFICATION_SUCCESS.EMAIL_SENT,
  };
};
