import type { PostSchema } from "../features/post/post-schema.js";

export type User = {
  id: string;
  username: string;
  email: string;
  password: string;
  role: Role;
  created_at: Date;
  is_verified: boolean;
};

export type Post = PostSchema & {
  id: number;
  author_id: string;
  created_at: Date;
  updated_at: Date;
};

export type Profile = Pick<User, "username"> & { posts: Post[] | string };

export type UserVerificationStatus = {
  id: string;
  user_id: string;
  expires_at: Date;
  otp_hash: string;
  used_at: Date | null;
  is_verified: boolean;
  retries: number;
};

export type Result =
  | { ok: true; message: string; data?: unknown }
  | { ok: false; reason: string };

/**
 * `reason` is a machine-readable discriminant used for control flow (e.g. determining which email to send).
 * `message is a user facing string that is intended for display and is subject to change
 *
 * By keeping them separate, we can freely change user-facing messages
 * without risking bbreaking any control flow logic
 */
export type RegistrationResult =
  | { ok: true; reason: "NEW_USER"; email: string; message: string }
  | { ok: true; reason: "RESENT_OTP"; email: string; message: string }
  | { ok: true; reason: "ALREADY_VERIFIED"; email: string; message: string }
  | { ok: true; reason: "COOLDOWN"; message: string };

export type Tokens = { accessToken: string; refreshToken: string };

export type Role = "user" | "moderator" | "admin";

export type CustomErrorContent = {
  message: string;
  context?: Record<string, unknown>;
};

export type EmailVerification = {
  id: string;
  user_id: string;
  expires_at: Date;
  otp_hash: string;
  used_at: Date | null;
  created_at: Date;
  retries: number;
};

export type RefreshTokenRecord = {
  jti: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
};
