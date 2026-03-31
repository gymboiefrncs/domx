import { pool } from "@api/config/db.js";
import {
  fetchOtp,
  incrementRetries,
  markUserAsVerified,
  deleteOtp,
  getLatestOTP,
  createSignupOtp,
} from "./verification.repositories.js";
import { fetchUserForSignup } from "@api/features/auth/index.js";
import {
  OTP_MESSAGE_FAIL,
  OTP_MESSAGE_SUCCESS,
  RESEND_OTP_MESSAGE,
  COOLDOWN_MESSAGE,
  OTP_COOLDOWN_MS,
} from "./verification.constants.js";
import crypto from "crypto";
import {
  sendAlreadyRegisteredEmail,
  sendVerificationEmail,
} from "@api/utils/sendEmail.js";
import { generateOTP } from "@api/utils/generateOTP.js";
import { generateSetInfoToken } from "./verification-helpers/generateSetInfoToken.js";
import { withTransaction } from "@api/config/transaction.js";
import type {
  OtpPayload,
  ResendOtpResult,
  TransactionResult,
  ValidateOtpResult,
} from "./verification.types.js";

export const validateOtp = async ({
  email,
  otp,
}: OtpPayload): Promise<ValidateOtpResult> => {
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

  /**
   * withTransaction owns BEGIN/COMMIT/ROLLBACK entirely.
   * Inside: return to commit, throw to rollback.
   *
   * The transaction result returns `userId` as an intermediate value to generate the token outside.
   * The final function result replaces userId with the token, so the shape differ.
   *
   * We annotate explicitly so TypeScript knows the callback's return type upfront
   * rather than inferring a widened type from return statements
   */
  const result = await withTransaction<TransactionResult>(
    pool,
    async (client) => {
      const otpRecord = await fetchOtp(email, client);

      if (
        !otpRecord ||
        otpRecord.used_at ||
        otpRecord.expires_at < new Date()
      ) {
        return { ok: false as const, errMessage: OTP_MESSAGE_FAIL };
      }

      // To prevent timing attacks
      const isOtpValid = crypto.timingSafeEqual(
        Buffer.from(otpRecord.otp_hash, "hex"),
        Buffer.from(hashedOTP, "hex"),
      );

      if (!isOtpValid) {
        const newRetryCount = await incrementRetries(
          otpRecord.user_id,
          otpRecord.id,
          client,
        );

        if (!newRetryCount) {
          return { ok: false as const, errMessage: OTP_MESSAGE_FAIL };
        }

        if (newRetryCount >= 5) {
          await deleteOtp(otpRecord.user_id, client);
          return { ok: false as const, errMessage: OTP_MESSAGE_FAIL };
        }
        return { ok: false as const, errMessage: OTP_MESSAGE_FAIL };
      }

      await markUserAsVerified(otpRecord.user_id, client);
      await deleteOtp(otpRecord.user_id, client);

      return { ok: true as const, userId: otpRecord.user_id };
    },
  );

  /**
   * Generating token for setting a further information happens outside the transaction
   * because it serves no purpose inside it and it will hold the connection longer
   */
  if (result.ok) {
    const token = await generateSetInfoToken(result.userId);
    return { ok: true, message: OTP_MESSAGE_SUCCESS, data: token };
  }

  return result;
};

export const resendOtp = async (email: string): Promise<ResendOtpResult> => {
  const { otp, hashedOTP, expiresAt } = generateOTP();

  const result = await withTransaction(pool, async (client) => {
    /**
     * Intentionally returns a unified response shape for all cases to prevent user enumeration attacks.
     * Regardless of whether the user exists, is verified, OTP is on cooldown, or OTP is resent,
     * the response is with a generic message and status.
     */

    const user = await fetchUserForSignup(email, client);

    if (!user)
      return {
        ok: true as const,
        reason: "USER_NOT_FOUND" as const,
        message: RESEND_OTP_MESSAGE,
      };
    if (user.is_verified)
      return {
        ok: true as const,
        reason: "ALREADY_VERIFIED" as const,
        email: user.email,
        message: RESEND_OTP_MESSAGE,
      };

    /**
     * Enforce a cooldown to prevent spamming OTP requests
     * This also prevents double otp to be created or valid at the same time caused by a concurrent request.
     */
    const latestOTP = await getLatestOTP(user.id, client);
    const isTooSoon =
      latestOTP &&
      Date.now() - latestOTP.created_at.getTime() <= OTP_COOLDOWN_MS;
    if (isTooSoon) {
      return {
        ok: true as const,
        reason: "COOLDOWN" as const,
        message: COOLDOWN_MESSAGE,
      };
    }

    await deleteOtp(user.id, client);
    await createSignupOtp(user.id, hashedOTP, expiresAt, client);

    return {
      ok: true as const,
      reason: "RESENT_OTP" as const,
      email: user.email,
      message: RESEND_OTP_MESSAGE,
    };
  });

  /**
   * Side effects are deliberately kept OUTSIDE the transaction.
   * Firing emails inside the transaction risks notifying the user
   * before the transaction is committed, which could lead to
   * confusion if ever the transaction rolls back after the email is sent
   */
  if (result.reason === "RESENT_OTP") {
    sendVerificationEmail(result.email, otp).catch((err) => {
      console.error("Failed to send verification email:", err);
    });
  }
  if (result.reason === "ALREADY_VERIFIED") {
    sendAlreadyRegisteredEmail(result.email).catch((err) => {
      console.error("Failed to send already registered email:", err);
    });
  }

  return result;
};
