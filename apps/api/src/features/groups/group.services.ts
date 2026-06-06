import { withTransaction } from "@api/shared/db/transaction.js";
import {
  countMembers,
  deleteGroup,
  deleteMember,
  doesGroupExist,
  findGroupDetails,
  findGroupMembers,
  findGroupsByUserId,
  getMemberRole,
  hasExistingAdmin,
  insertGroup,
  insertMember,
  updateMemberRole,
  updateName,
} from "./group.repositories.js";
import { pool } from "@api/shared/db/db.js";
import { GROUP_ERROR } from "./group.constants.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@api/shared/error.js";
import { resolveGroupAction } from "./group-helper.js";
import type { CreateGroup, Group, Member } from "@domx/shared";
import type {
  CreateGroupParams,
  GetUserGroupDetailsParams,
  GroupActionParams,
  GroupMemberActionParams,
  GroupMemberCount,
  GroupWithMemberCount,
  RenameGroupParams,
} from "./group.types.js";
import { PROFILE_ERROR } from "../profile/profile.constants.js";

export const getMembers = async ({
  groupId,
  requesterId,
}: GroupActionParams): Promise<Member[]> => {
  await resolveGroupAction(groupId, requesterId, null);
  return findGroupMembers(groupId);
};

export const getUserGroups = (userId: string): Promise<Group[]> =>
  findGroupsByUserId(userId);

export const getUserGroupDetails = async ({
  userId,
  groupId,
}: GetUserGroupDetailsParams): Promise<Group> =>
  findGroupDetails({ userId, groupId });

export const createGroup = async ({
  groupName,
  userId,
}: CreateGroupParams): Promise<Group> => {
  /**
   * withTransaction owns BEGIN/COMMIT/ROLLBACK entirely.
   * Inside: return to commit, throw to rollback.
   *
   * The group creator is assigned as the initial admin to ensure
   * the group always has an owner with management privileges.
   */
  const result = await withTransaction(
    pool,
    async (client): Promise<CreateGroup> => {
      const group = await insertGroup(groupName, client);
      await insertMember({
        groupId: group.group_id,
        userId,
        role: "admin",
        con: client,
      });
      return group;
    },
  );

  // for optimistic update on client side
  return {
    group_id: result.group_id,
    name: groupName,
    member_count: 1,
    unread_count: 0,
    role: "admin",
    last_seen_at: new Date(),
  };
};

export const renameGroup = async ({
  groupId,
  groupName,
  requesterId,
}: RenameGroupParams): Promise<void> => {
  await resolveGroupAction(groupId, requesterId, null, "admin");
  await updateName(groupId, groupName);
};

// --- GROUP MEMBER ACTIONS ---

/**
 * Adds a member to a group by their display ID.
 * Any existing member can add others without requiring admin approval.
 * This avoids bottlenecks in situations where the admin is unavailable
 * and a member needs to be added urgently.
 */
export const addMember = async ({
  groupId,
  displayId,
  requesterId,
}: GroupMemberActionParams): Promise<{
  member: Member;
  groupDetail: Group;
  targetUserId: string;
}> => {
  const { targetUserId } = await resolveGroupAction(
    groupId,
    requesterId,
    displayId,
  );
  if (!targetUserId) throw new NotFoundError(PROFILE_ERROR.USER_NOT_FOUND);
  try {
    /**
     * insertMember may throw a unique constraint violation if the user
     * is already a member of the group. We catch it here and translate
     * it into a ConflictError so the raw database error never reaches
     * the global error handler. Any other error is re-thrown as-is.
     */

    const member = await insertMember({ groupId, userId: targetUserId });
    const groupDetail = await findGroupDetails({
      userId: targetUserId,
      groupId,
    });
    return { member, groupDetail, targetUserId };
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      "constraint" in error
    ) {
      if (error.code === "23505" && error.constraint === "group_members_pkey") {
        throw new ConflictError("User is already a member of this group.");
      }
    }
    throw error;
  }
};

/**
 * Removes a member from a group by their display ID.
 * Restricted to admin, kick is a privileged action that forcibly
 * removes another member, as opposed to leaving which is self-initiated.
 * Admins who want to leave the group should use the leave flow instead.
 */
export const kickMember = async ({
  groupId,
  displayId,
  requesterId,
}: GroupMemberActionParams): Promise<GroupMemberCount & { userId: string }> => {
  const { targetUserId } = await resolveGroupAction(
    groupId,
    requesterId,
    displayId,
    "admin",
  );
  if (!targetUserId) throw new NotFoundError(PROFILE_ERROR.USER_NOT_FOUND);

  /**
   * Prevents admins from using kick as a substitute for leaving.
   * Self-removal is handled separately by the leave flow.
   */
  if (targetUserId === requesterId)
    throw new ForbiddenError(
      "You cannot remove yourself. Use the leave option instead.",
    );

  await deleteMember({ userId: targetUserId, groupId });

  const member_count = await countMembers(groupId);
  return { member_count, userId: targetUserId };
};

/**
 * Handles a user voluntarily leaving a group.
 *
 * Uses a transaction with FOR UPDATE to prevent race conditions
 * (e.g. two admins both checking "other admins exist" and both leaving).
 *
 * If there is only one member left, that member can leave regardless of role
 * and the group is deleted to prevent orphaned groups.
 * An admin cannot leave if they are the only admin and other members remain.
 * To leave, they must promote another member first.
 *
 * Regular members can leave without restriction.
 */
export const leaveGroup = async ({
  groupId,
  requesterId,
}: GroupActionParams): Promise<GroupWithMemberCount | undefined> => {
  if (!doesGroupExist(groupId)) throw new NotFoundError(GROUP_ERROR.NOT_FOUND);

  return withTransaction(pool, async (client) => {
    /**
     * Lock the requester's row to prevent concurrent modifications
     * like other admins demoting and kicking them
     */
    const requesterRole = await getMemberRole({
      groupId,
      userId: requesterId,
      con: client,
      forUpdate: true,
    });
    if (!requesterRole) throw new ForbiddenError(GROUP_ERROR.NOT_A_MEMBER);

    /**
     * Lock the entire group_members set for this group to get an accurate member count.
     * This prevents race conditions where multiple members leave at the same time
     * and the count becomes inaccurate,
     */
    const memberCount = await countMembers(groupId, client, true);

    // Last member: remove them regardless of their role and delete the group
    if (memberCount === 1) {
      await deleteGroup(groupId, client);
      return;
    }

    // Admin with other members: ensure at least one other admin remains
    if (requesterRole === "admin") {
      /**
       * Prevents two admins from both seeing each other as "other admins"
       * and both leaving, which would leave the group without any admins.
       */
      if (
        !(await hasExistingAdmin({ groupId, userId: requesterId, con: client }))
      ) {
        throw new ConflictError(
          "Promote a member to admin before leaving this group.",
        );
      }
    }

    // Regular members (or admins with co-admins) can leave freely
    await deleteMember({ userId: requesterId, groupId, con: client });

    // for everyone else in the group
    const newMemberCount = await countMembers(groupId, client, true);

    return {
      group_id: groupId,
      member_count: newMemberCount,
    };
  });
};

export const promoteMember = async ({
  groupId,
  displayId,
  requesterId,
}: GroupMemberActionParams): Promise<void> => {
  const { targetUserId } = await resolveGroupAction(
    groupId,
    requesterId,
    displayId,
    "admin",
  );
  if (!targetUserId) throw new NotFoundError(PROFILE_ERROR.USER_NOT_FOUND);

  const targetRole = await getMemberRole({
    groupId,
    userId: targetUserId,
  });
  if (!targetRole) throw new NotFoundError(GROUP_ERROR.NOT_A_MEMBER);
  if (targetRole === "admin")
    throw new ConflictError("User is already an admin.");

  await updateMemberRole({
    role: "admin",
    userId: targetUserId,
    groupId,
  });
};

/**
 * Allows an admin to demote aother admin or themeselves
 *
 * Self demotion is allowed because an admin might
 * want to step back from their responsibilities.
 *
 * Admin demoting another admin is also allowed because some admins
 * might become inactive
 */
export const demoteMember = async ({
  groupId,
  displayId,
  requesterId,
}: GroupMemberActionParams): Promise<void> => {
  const { targetUserId } = await resolveGroupAction(
    groupId,
    requesterId,
    displayId,
    "admin",
  );
  if (!targetUserId) throw new NotFoundError(PROFILE_ERROR.USER_NOT_FOUND);

  const targetRole = await getMemberRole({ groupId, userId: targetUserId });
  if (!targetRole) throw new NotFoundError(GROUP_ERROR.NOT_A_MEMBER);
  if (targetRole === "member")
    throw new ConflictError("User is already a regular member.");

  if (!(await hasExistingAdmin({ groupId, userId: requesterId }))) {
    throw new ConflictError(
      "Cannot demote. This would leave the group with no admins.",
    );
  }

  await updateMemberRole({ role: "member", userId: targetUserId, groupId });
};

export const removeGroup = async ({
  groupId,
  requesterId,
}: GroupActionParams): Promise<void> => {
  await resolveGroupAction(groupId, requesterId, null, "admin");
  await deleteGroup(groupId);
};

export const updateLastSeen = async ({
  groupId,
  requesterId,
}: GroupActionParams): Promise<{ last_seen_at: Date }> => {
  await resolveGroupAction(groupId, requesterId);
  return updateLastSeen({ requesterId, groupId });
};
