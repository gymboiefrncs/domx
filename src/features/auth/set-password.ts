import type { Result } from "../../common/types.js";
import { pool } from "../../config/db.js";
import { fetchUserForPasswordSet, updateUserPassword } from "./auth-model.js";
import bcrypt from "bcrypt";

export const setPassword = async ({
  userId,
  password,
}: {
  userId: string;
  password: string;
}): Promise<Result> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const user = await fetchUserForPasswordSet(userId, client);

    if (!user || !user.is_verified || user.password) {
      await client.query("ROLLBACK");
      return {
        ok: false,
        reason: "Something went wrong. Please try again later.",
      };
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await updateUserPassword(userId, hashedPassword, client);

    await client.query("COMMIT");
    return { ok: true, message: "Password set successfully" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
