import {
  invalidateOldOtps,
  createSignupOtp,
} from "../../verification/verification-model.js";
import { getLatestOTP } from "../auth-model.js";
import type { RegistrationResult, User } from "../../../common/types.js";
import type { PoolClient } from "pg";
import { COOLDOWN_MESSAGE, EMAIL_MESSAGE } from "../auth-service.js";

export const OTP_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Handles signup attempts for an existing but unverified user.
 *
 * By the time this function executes, `fetchUserForSignup` has
 * already locked the user row via `FOR UPDATE`. This guarantees
 * that concurrent signup attempts for the same email are serialized,
 * preventing race conditions during OTP generation.
 *
 * We enforce an OTP cooldown to:
 * - Prevent email spamming
 * - Reduce abuse and brute-force attempts
 *
 * Before issuing a new OTP, all previous OTPs are invalidated
 * to ensure only the most recent code remains valid.
 */
export const handleUnverifiedUser = async (
  user: Pick<User, "email" | "id" | "is_verified">,
  otpData: {
    otp: string;
    hashedOTP: string;
    expiresAt: Date;
  },
  client: PoolClient,
): Promise<RegistrationResult> => {
  const latestOTP = await getLatestOTP(user.id, client);

  /**
   * Enforce a cooldown to prevent spamming OTP request
   * This also prevents double otp to be created or valid at the same time caused by a concurrent request.
   */
  const isTooSoon =
    latestOTP && Date.now() - latestOTP.created_at.getTime() <= OTP_COOLDOWN_MS;

  if (isTooSoon) {
    return {
      ok: true as const,
      reason: "COOLDOWN" as const,
      message: COOLDOWN_MESSAGE,
    };
  }

  // Ensures only one vlaid OTP is active at a time
  await invalidateOldOtps(user.id, client);
  await createSignupOtp(user.id, otpData.hashedOTP, otpData.expiresAt, client);

  return {
    ok: true as const,
    reason: "RESENT_OTP" as const,
    email: user.email,
    message: EMAIL_MESSAGE,
  };
};
