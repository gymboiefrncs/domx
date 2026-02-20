import type { PoolClient } from "pg";
import type { SignupSchema } from "../../schemas/auth-schema.js";
import { createUser } from "../../models/auth-model.js";
import { createSignupOtp } from "../../models/verification-model.js";
import { EMAIL_MESSAGE } from "../../services/auth-service.js";

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
