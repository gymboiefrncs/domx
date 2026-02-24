import type { PoolClient } from "pg";
import type { SignupSchema } from "../auth-schema.js";
import { createUser } from "../auth-model.js";
import { createSignupOtp } from "../../verification/verification-model.js";
import { EMAIL_MESSAGE } from "../auth-service.js";

export const handleNewUser = async (
  data: SignupSchema,
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
