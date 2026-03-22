import {
  INFO_SET_FAILED_MESSAGE,
  INFO_SET_SUCCESS_MESSAGE,
} from "@api/common/constants.js";
import type { Result, SetInfoResult } from "@api/common/types.js";
import { pool } from "@api/config/db.js";
import { withTransaction } from "@api/config/transaction.js";
import { generateDisplayId } from "@api/utils/generateDisplayId.js";
import {
  createDisplayId,
  updateUsername,
  updateUserPassword,
} from "./auth-model.js";
import bcrypt from "bcrypt";
import type { UserInfo } from "./auth.types.js";

export const setInfo = async ({
  userId,
  username,
  password,
}: UserInfo): Promise<Result> => {
  const hashedPassword = await bcrypt.hash(
    password,
    process.env.NODE_ENV === "production" ? 12 : 10,
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
        message: INFO_SET_SUCCESS_MESSAGE,
        data: { role },
      };

    return {
      ok: false,
      reason: "INFO_SET_FAILED",
      message: INFO_SET_FAILED_MESSAGE,
    };
  });

  if (result.reason === "INFO_SET_SUCCESS")
    return { ok: true, message: result.message, data: result.data.role };
  return { ok: false, message: result.message };
};
