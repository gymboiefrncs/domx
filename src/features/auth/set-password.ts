import type { Result } from "../../common/types.js";
import { updateUserPassword } from "./auth-model.js";
import bcrypt from "bcrypt";

export const setPassword = async ({
  userId,
  password,
}: {
  userId: string;
  password: string;
}): Promise<Result> => {
  const hashedPassword = await bcrypt.hash(password, 12);

  const result = await updateUserPassword(userId, hashedPassword);

  if (result.rowCount === 0) {
    return {
      ok: false,
      reason: "Something went wrong. Please try again later",
    };
  }

  return { ok: true, message: "Password set successfully" };
};
