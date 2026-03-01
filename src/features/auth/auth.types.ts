import type { Role } from "../../common/types.js";

/** Raw `users` table row. */
export type UserRow = {
  id: string;
  username: string | null;
  email: string;
  password: string | null;
  role: Role;
  created_at: Date;
  is_verified: boolean;
};

export type RefreshTokenRow = {
  jti: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
};

/** Returned after creating a user */
export type NewUser = Pick<UserRow, "id" | "email">;

/** Used during signup to check user state */
export type SignupUser = Pick<UserRow, "id" | "is_verified" | "email">;

/** Used for JWT payload construction */
export type AuthIdentity = Pick<UserRow, "role">;
