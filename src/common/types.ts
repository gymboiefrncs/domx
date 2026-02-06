export type User = {
  id: string;
  username: string;
  email: string;
  password: string;
  is_admin: boolean;
  created_at: Date;
};

export type UserVerificationStatus = {
  user_id: string;
  expires_at: Date;
  token: string;
  used_at: Date | null;
  is_verified: boolean;
};
