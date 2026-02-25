import { pool } from "../../config/db.js";
import {
  createSignupOtp,
  fetchOtp,
  incrementRetries,
  invalidateOldOtps,
  markTokenAsUsed,
  markUserAsVerified,
} from "./verification-model.js";
import crypto from "crypto";
import {
  sendAlreadyRegisteredEmail,
  sendVerificationEmail,
} from "../../utils/sendEmail.js";
import { fetchUserForSignup, getLatestOTP } from "../auth/auth-model.js";
import { generateOTP } from "../../utils/generateOTP.js";
import type { Result } from "../../common/types.js";
import { generateSetPasswordToken } from "./verification-helpers/generateSetPasswordToken.js";
import { COOLDOWN_MESSAGE } from "../auth/auth-service.js";
import { OTP_COOLDOWN_MS } from "../auth/auth-helpers/handleUnverifiedUser.js";

export const OTP_MESSAGE_FAIL = "OTP is invalid or expired";
export const OTP_MESSAGE_SUCCESS = "Email verified successfully";
export const RESEND_OTP_MESSAGE =
  "If an account exists, a new code has been sent.";

export const validateOtp = async ({
  email,
  otp,
}: {
  email: string;
  otp: string;
}): Promise<Result> => {
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const otpRecord = await fetchOtp(email, client);

    if (!otpRecord || otpRecord.used_at || otpRecord.expires_at < new Date()) {
      await client.query("ROLLBACK");
      return { ok: false, reason: OTP_MESSAGE_FAIL };
    }

    // to prevent timing attacks
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
        await client.query("ROLLBACK");
        return {
          ok: false,
          reason: OTP_MESSAGE_FAIL,
        };
      }

      if (newRetryCount >= 5) {
        await invalidateOldOtps(otpRecord.user_id, client);
        await client.query("COMMIT");
        return {
          ok: false,
          reason: OTP_MESSAGE_FAIL,
        };
      }

      await client.query("COMMIT");
      return { ok: false, reason: OTP_MESSAGE_FAIL };
    }

    await markUserAsVerified(otpRecord.user_id, client);
    await markTokenAsUsed(otpRecord.id, hashedOTP, client);

    await client.query("COMMIT");

    // Short-lived token for setting password
    const token = await generateSetPasswordToken(otpRecord.user_id);

    return { ok: true, message: OTP_MESSAGE_SUCCESS, data: token };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const resendOtp = async (
  email: string,
): Promise<{ ok: true; message: string }> => {
  const { otp, hashedOTP, expiresAt } = generateOTP();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const user = await fetchUserForSignup(email, client);

    if (!user) {
      await client.query("ROLLBACK");
      return {
        ok: true,
        message: RESEND_OTP_MESSAGE,
      };
    }

    if (user.is_verified) {
      await client.query("ROLLBACK");
      sendAlreadyRegisteredEmail(email).catch((err) => {
        console.error("Failed to send already registered email:", err);
      });
      return {
        ok: true,
        message: RESEND_OTP_MESSAGE,
      };
    }

    const latestOTP = await getLatestOTP(user.id, client);

    // Enforce a cooldown to prevent spamming OTP requests
    const isTooSoon =
      latestOTP &&
      Date.now() - latestOTP.created_at.getTime() <= OTP_COOLDOWN_MS;

    if (isTooSoon) {
      await client.query("ROLLBACK");
      return { ok: true as const, message: COOLDOWN_MESSAGE };
    }

    await invalidateOldOtps(user.id, client);
    await createSignupOtp(user.id, hashedOTP, expiresAt, client);

    await client.query("COMMIT");

    sendVerificationEmail(user.email, otp).catch((err) => {
      console.error("Failed to send verification email:", err);
    });

    return {
      ok: true,
      message: RESEND_OTP_MESSAGE,
    };
  } catch (error) {
    await client.query("ROLLBACK");

    throw error;
  } finally {
    client.release();
  }
};
