import {
  INFO_SET_FAILED_MESSAGE,
  INFO_SET_SUCCESS_MESSAGE,
} from "../../common/constants.js";
import type { Result, SetInfoResult } from "../../common/types.js";
import { pool } from "../../config/db.js";
import { withTransaction } from "../../config/transaction.js";
import { generateDisplayId } from "../../utils/generateDisplayId.js";
import {
  createDisplayId,
  updateUsername,
  updateUserPassword,
} from "./auth-model.js";
import bcrypt from "bcrypt";

export const setInfo = async ({
  userId,
  username,
  password,
}: {
  userId: string;
  username: string;
  password: string;
}): Promise<Result> => {
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
    const createDisplayIdResult = await createDisplayId(
      userId,
      displayId,
      client,
    );

    if (updatePasswordResult && updateUsernameReuslt && createDisplayIdResult)
      return {
        ok: true,
        reason: "INFO_SET_SUCCESS",
        message: INFO_SET_SUCCESS_MESSAGE,
      };

    return {
      ok: false,
      reason: "INFO_SET_FAILED",
      message: INFO_SET_FAILED_MESSAGE,
    };
  });

  if (result.reason === "INFO_SET_SUCCESS")
    return { ok: true, message: result.message };
  return { ok: false, message: result.message };
};
