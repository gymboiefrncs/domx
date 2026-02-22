import {
  invalidateOldOtps,
  createSignupOtp,
} from "../../verification/verification-model.js";
import { getLatestOTP } from "../auth-model.js";
import type { User } from "../../../common/types.js";
import type { PoolClient } from "pg";
import { COOLDOWN_MESSAGE, EMAIL_MESSAGE } from "../auth-service.js";

const OTP_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

export const handleUnverifiedUser = async (
  user: Pick<User, "email" | "id" | "is_verified">,
  otpData: {
    otp: string;
    hashedOTP: string;
    expiresAt: Date;
  },
  client: PoolClient,
): Promise<{ ok: true; message: string }> => {
  const latestOTP = await getLatestOTP(user.id, client);

  // Enforce a cooldown to prevent spamming OTP requests
  const isTooSoon =
    latestOTP && Date.now() - latestOTP.created_at.getTime() <= OTP_COOLDOWN_MS;

  if (isTooSoon) {
    return { ok: true as const, message: COOLDOWN_MESSAGE };
  }

  await invalidateOldOtps(user.id, client);
  await createSignupOtp(user.id, otpData.hashedOTP, otpData.expiresAt, client);

  return { ok: true as const, message: EMAIL_MESSAGE };
};
