import type { PoolClient } from "pg";
import type { SignupSchema } from "../auth-schema.js";
import { createUser } from "../auth-model.js";
import { createSignupOtp } from "../../verification/verification-model.js";
import { EMAIL_MESSAGE } from "../auth-service.js";
import type { RegistrationResult } from "../../../common/types.js";

/**
 * Handles new user registration
 * creatUser uses ON CONFLICT DO NOTHING, so if another request already created this user,
 * it will return undefined. In that case, we treat it as a success and step aside.
 */
export const handleNewUser = async (
  data: SignupSchema,
  otpData: { hashedOTP: string; expiresAt: Date; otp: string },
  client: PoolClient,
): Promise<RegistrationResult> => {
  const newUser = await createUser(data, client);

  if (!newUser) {
    /**
     * Another request won the race and created the user.
     * Intentionally return success and step aside.
     */
    return {
      ok: true as const,
      reason: "NEW_USER" as const,
      email: data.email,
      message: EMAIL_MESSAGE,
    };
  }

  await createSignupOtp(
    newUser.id,
    otpData.hashedOTP,
    otpData.expiresAt,
    client,
  );

  return {
    ok: true as const,
    reason: "NEW_USER" as const,
    email: newUser.email,
    message: EMAIL_MESSAGE,
  };
};
