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
  user_id: string;
  expires_at: Date;
  otp_hash: string;
  used_at: Date | null;
  is_verified: boolean;
  retries: number;
};
