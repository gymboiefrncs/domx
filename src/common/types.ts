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
