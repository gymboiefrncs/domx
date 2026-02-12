export type User = {
  id: string;
  username: string;
  email: string;
  password: string;
  role: Role;
  created_at: Date;
  is_verified: boolean;
};

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

export type tokens = { accessToken: string; refreshToken: string };

export type Role = "user" | "moderator" | "admin";
