import type { PoolClient } from "pg";
import type { SignupSchema } from "../../features/auth/auth-schema.js";
import { createUser } from "../../features/auth/auth-model.js";
import { createSignupOtp } from "../../features/verification/verification-model.js";
import { EMAIL_MESSAGE } from "../../features/auth/auth-service.js";

export const handleNewUser = async (
  data: Omit<SignupSchema, "password">,
  otpData: { hashedOTP: string; expiresAt: Date; otp: string },
  client: PoolClient,
) => {
  const newUser = await createUser(data, client);
  await createSignupOtp(
    newUser.id,
    otpData.hashedOTP,
    otpData.expiresAt,
    client,
  );

  return { ok: true as const, message: EMAIL_MESSAGE };
};
