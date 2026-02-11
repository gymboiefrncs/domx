export type User = {
  id: string;
  username: string;
  email: string;
  password: string;
  is_admin: boolean;
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
  | { ok: true; message: string }
  | { ok: false; reason: string };

export type tokens = { accessToken: string; refreshToken: string };
