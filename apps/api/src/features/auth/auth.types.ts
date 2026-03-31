import type { Role } from "@domx/shared";

/** Raw `users` table row. */
type UserRow = {
  id: string;
  username: string | null;
  email: string;
  password: string | null;
  role: Role;
  created_at: Date;
  is_verified: boolean;
};

/** Returned after creating a user */
export type NewUser = Pick<UserRow, "id" | "email">;

/** Used during signup to check user state */
export type SignupUser = Pick<
  UserRow,
  "id" | "is_verified" | "email" | "username" | "password"
>;

export type LoginUser = Pick<
  UserRow,
  "id" | "email" | "password" | "is_verified" | "role"
>;

/** Used for JWT payload construction */
export type UserRole = Pick<UserRow, "role">;

export type UserInfo = {
  userId: string;
  username: string;
  password: string;
};

/**
 * `reason` is a machine-readable discriminant used for control flow (e.g. determining which email to send).
 * `message` is a user-facing string that is intended for display and is subject to change.
 *
 * By keeping them separate, we can freely change user-facing messages
 * without risking breaking any control flow logic.
 */
export type RegistrationResult =
  | { ok: true; reason: "NEW_USER"; email: string; message: string }
  | { ok: true; reason: "UNIQUE_EMAIL_VIOLATION"; message: string }
  | { ok: true; reason: "RESENT_OTP"; email: string; message: string }
  | { ok: true; reason: "ALREADY_VERIFIED"; email: string; message: string }
  | { ok: true; reason: "COOLDOWN"; message: string }
  | {
      ok: true;
      reason: "INCOMPLETE_SIGNUP";
      message: string;
      data: { setInfoToken: string };
    };

export type SetInfoResult =
  | {
      ok: true;
      reason: "INFO_SET_SUCCESS";
      message: string;
      data: { role: Role };
    }
  | { ok: false; reason: "INFO_SET_FAILED"; message: string };

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};
