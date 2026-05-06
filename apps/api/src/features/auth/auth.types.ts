import type z from "zod";
import type { infoSchema, loginSchema, signupSchema } from "./auth.schemas.js";

/** Raw `users` table row. */
interface UserRow {
  id: string;
  username: string | null;
  email: string;
  password: string | null;
  created_at: Date;
  is_verified: boolean;
}

export type NewUser = Pick<UserRow, "id" | "email">;
export type SignupUser = Pick<
  UserRow,
  "id" | "is_verified" | "email" | "username" | "password"
>;
export type LoginUser = Pick<
  UserRow,
  "id" | "email" | "password" | "is_verified"
>;
export type UserIdentity = Pick<UserRow, "id">;

export interface UserInfo {
  userId: string;
  username: string;
  password: string;
}

/**
 * `reason` is a machine-readable discriminant used for control flow (e.g. determining which email to send).
 * `message` is a user-facing string that is intended for display and is subject to change.
 *
 * By keeping them separate, we can freely change user-facing messages
 * without risking breaking any control flow logic.
 */
export type RegistrationResult =
  | { reason: "NEW_USER"; email: string; message: string }
  | { reason: "UNIQUE_EMAIL_VIOLATION"; message: string }
  | { reason: "RESENT_OTP"; email: string; message: string }
  | { reason: "ALREADY_VERIFIED"; email: string; message: string }
  | { message: string }
  | {
      reason: "INCOMPLETE_SIGNUP";
      message: string;
      data: { setInfoToken: string };
    };
export type SetInfoResult =
  | {
      ok: true;
      reason: "INFO_SET_SUCCESS";
      message: string;
    }
  | { ok: false; reason: "INFO_SET_FAILED"; message: string };

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}
export interface AuthResponse {
  message: string;
}

export type SignupRequest = z.infer<typeof signupSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type SetInfoRequest = z.infer<typeof infoSchema>;
