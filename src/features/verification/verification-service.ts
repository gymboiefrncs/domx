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
import { fetchUserForSignup } from "../auth/auth-model.js";
import { generateOTP } from "../../utils/generateOTP.js";
import type { Result } from "../../common/types.js";
import { generateSetPasswordToken } from "./verification-helpers/generateSetPasswordToken.js";

const OTP_MESSAGE_FAIL = "OTP is invalid or expired";
const OTP_MESSAGE_SUCCESS = "Email verified successfully";

export const validateOtp = async ({
  email,
  otp,
}: {
  email: string;
  otp: string;
}): Promise<Result> => {
  // hash the incoming OTP to compare against the stored hash
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // get the user associated with the OTP
    const otpRecord = await fetchOtp(email, client);

    // ensure a verification request actually exists
    if (!otpRecord) {
      await client.query("ROLLBACK");
      return {
        ok: false,
        reason: OTP_MESSAGE_FAIL,
      };
    }

    // verify lifecycle status: used and expired tokens are invalid
    if (otpRecord.used_at || otpRecord.expires_at < new Date()) {
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

      // invalidate otps after 5 failed attempts to prevent brute force attacks
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

// re-issues a verification code for unverified users.
export const resendOtp = async (email: string): Promise<Result> => {
  const { otp, hashedOTP, expiresAt } = generateOTP();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const user = await fetchUserForSignup(email, client);

    // if user not found, return generic message to prevent enumeration attacks
    if (!user) {
      await client.query("ROLLBACK");
      return {
        ok: true,
        message: "If an account exists, a new code has been sent.",
      };
    }

    // handles already verified users
    if (user.is_verified) {
      await client.query("ROLLBACK");
      await sendAlreadyRegisteredEmail(email);
      return {
        ok: true,
        message: "If an account exists, a new code has been sent.",
      };
    }

    // invalidate all previous tokens for the user before creating a new one
    await invalidateOldOtps(user.id, client);
    await createSignupOtp(user.id, hashedOTP, expiresAt, client);

    await client.query("COMMIT");

    await sendVerificationEmail(user.email, otp);

    return {
      ok: true,
      message: "If an account exists, a new code has been sent.",
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
