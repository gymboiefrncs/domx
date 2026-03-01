import type { Role } from "../../common/types.js";

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
export type SignupUser = Pick<UserRow, "id" | "is_verified" | "email">;

export type LoginUser = Pick<
  UserRow,
  "id" | "email" | "password" | "is_verified" | "role"
>;

/** Used for JWT payload construction */
export type UserRole = Pick<UserRow, "role">;
