import { withTransaction } from "../../config/transaction.js";
import { insertGroup, insertMember } from "./group-model.js";
import { pool } from "../../config/db.js";
import { SUCCESSFULLY_CREATED_GROUP_MESSAGE } from "../../common/constants.js";
import type { Result } from "../../common/types.js";

export const createGroup = async (
  groupName: string,
  userId: string,
): Promise<Result> => {
  /**
   * withTransaction owns BEGIN/COMMIT/ROLLBACK entirely.
   * Inside: return to commit, throw to rollback.
   *
   * The group creator is assigned as the initial admin to ensure
   * the group always has an owner with management privileges.
   */
  await withTransaction(pool, async (client) => {
    const group = await insertGroup(groupName, client);
    await insertMember(group.group_id, userId, "admin", client);
  });

  return {
    ok: true,
    message: SUCCESSFULLY_CREATED_GROUP_MESSAGE,
  };
};
