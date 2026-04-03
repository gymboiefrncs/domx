import type { SetInfoResult } from "./auth.types.js";
import type { Result } from "@api/shared/types/types.js";
import { pool } from "@api/shared/db/db.js";
import { withTransaction } from "@api/shared/db/transaction.js";
import { generateDisplayId } from "./auth-helpers/generateDisplayId.js";
import {
  createDisplayId,
  updateUsername,
  updateUserPassword,
} from "./auth.repositories.js";
import bcrypt from "bcrypt";
import type { UserInfo } from "./auth.types.js";
import type { Role } from "@domx/shared";
import { config } from "@api/shared/config.js";

export const setInfo = async ({
  userId,
  username,
  password,
}: UserInfo): Promise<Result<Role>> => {
  const hashedPassword = await bcrypt.hash(
    password,
    config.server.nodeEnv === "production" ? 12 : 10,
  );

  /**
   * Generate display ID for user.
   * This will be used to add user in a group and for other features in the future.
   */
  const displayId = generateDisplayId();

  const result = await withTransaction<SetInfoResult>(pool, async (client) => {
    const updatePasswordResult = await updateUserPassword(
      userId,
      hashedPassword,
      client,
    );
    const updateUsernameReuslt = await updateUsername(userId, username, client);
    const role = await createDisplayId(userId, displayId, client);

    if (updatePasswordResult && updateUsernameReuslt && role)
      return {
        ok: true,
        reason: "INFO_SET_SUCCESS",
        message: "Information set successfully",
        data: { role },
      };

    return {
      ok: false,
      reason: "INFO_SET_FAILED",
      message: "Failed to set information",
    };
  });

  if (result.reason === "INFO_SET_SUCCESS")
    return { ok: true, message: result.message, data: result.data.role };
  return { ok: false, message: result.message };
};
