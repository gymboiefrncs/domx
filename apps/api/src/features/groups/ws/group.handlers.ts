import type { Server, Socket } from "socket.io";
import {
  addMember,
  removeGroup,
  demoteMember,
  kickMember,
  leaveGroup,
  promoteMember,
  renameGroup,
  updateLastSeen,
} from "../group.services.js";
import { performChecks } from "@api/features/posts/index.js";
import {
  getRetryAfterSeconds,
  wsAddMemberLimiter,
  wsAdminActionLimiter,
  wsDeleteGroupLimiter,
  wsLeaveGroupLimiter,
  wsRenameGroupLimiter,
} from "@api/shared/middlewares/rateLimit.js";
import type { ClientToServerEvents, ServerToClientEvents } from "@domx/shared";

export function resolveErrorMessage(error: unknown, fallback: string): string {
  const retryAfter = getRetryAfterSeconds(error);

  if (retryAfter !== null) {
    return `Too many attempts. Please try again in ${retryAfter} seconds.`;
  }

  return error instanceof Error ? error.message : fallback;
}

export function registerGroupHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) {
  const actorId = socket.data.user.id;

  socket.on("group:join", async (groupId) => {
    try {
      await performChecks(groupId, actorId);
      socket.join(groupId);
    } catch (error) {
      socket.emit("group:join:failed", {
        message: resolveErrorMessage(error, "Unauthorized"),
      });
    }
  });

  socket.on("group:leave", async (groupId) => {
    socket.leave(groupId);
  });

  socket.on("group:member:add", async ({ groupId, targetUserDisplayId }) => {
    try {
      await wsAddMemberLimiter.consume(`${actorId}:${groupId}`);

      const {
        member: newMember,
        groupDetail,
        targetUserId,
      } = await addMember({
        groupId,
        displayId: targetUserDisplayId,
        requesterId: actorId,
      });

      io.to(groupId).emit("group:member:added", {
        data: { groupId, newMember, groupDetail },
        by: actorId,
      });

      /**
       * send the group detail where the new user was added to so we can update
       * the group list for that user
       */
      io.to(targetUserId).emit("group:summary", {
        group: groupDetail,
        type: "added",
      });
    } catch (error) {
      socket.emit("group:member:add:failed", {
        message: resolveErrorMessage(error, "Failed to add member"),
      });
    }
  });

  socket.on("group:member:kick", async ({ groupId, targetUserDisplayId }) => {
    try {
      await wsAdminActionLimiter.consume(`${actorId}:${groupId}`);

      const result = await kickMember({
        groupId,
        displayId: targetUserDisplayId,
        requesterId: actorId,
      });
      io.to(groupId).emit("group:member:kicked", {
        data: {
          groupId,
          targetUserDisplayId,
          memberCount: result.member_count,
          targetId: result.userId,
        },
        by: actorId,
      });
      io.to(result.userId).socketsLeave(groupId);
    } catch (error) {
      socket.emit("group:member:kick:failed", {
        message: resolveErrorMessage(error, "Failed to kick member"),
      });
    }
  });

  socket.on("group:member:leave", async (groupId, callback) => {
    try {
      await wsLeaveGroupLimiter.consume(actorId);

      const result = await leaveGroup({ groupId, requesterId: actorId });

      if (!result) {
        /**
         * if result is undefined it means the group was deleted because the last member left
         * just call the callback function with success true for the client to redirect
         */
        io.to(groupId).emit("group:member:left", {
          data: { groupId, memberCount: 0, wasDeleted: true },
          by: actorId,
        });

        callback({ success: true });
        socket.leave(groupId);
        return;
      }

      io.to(groupId).emit("group:member:left", {
        data: {
          groupId,
          memberCount: result.member_count,
        },
        by: actorId,
      });
      callback({ success: true });
      socket.leave(groupId);
    } catch (error) {
      callback({ success: false });

      socket.emit("group:member:leave:failed", {
        message: resolveErrorMessage(error, "Failed to leave group"),
      });
    }
  });

  socket.on(
    "group:member:promote",
    async ({ groupId, targetUserDisplayId }) => {
      try {
        await wsAdminActionLimiter.consume(`${actorId}:${groupId}`);

        await promoteMember({
          groupId,
          displayId: targetUserDisplayId,
          requesterId: actorId,
        });
        io.to(groupId).emit("group:member:promoted", {
          data: { groupId, targetUserDisplayId },
          by: actorId,
        });
      } catch (error) {
        socket.emit("group:member:promote:failed", {
          message: resolveErrorMessage(error, "Failed to promote member"),
        });
      }
    },
  );

  socket.on("group:member:demote", async ({ groupId, targetUserDisplayId }) => {
    try {
      await wsAdminActionLimiter.consume(`${actorId}:${groupId}`);

      await demoteMember({
        groupId,
        displayId: targetUserDisplayId,
        requesterId: actorId,
      });
      io.to(groupId).emit("group:member:demoted", {
        data: { groupId, targetUserDisplayId },
        by: actorId,
      });
    } catch (error) {
      socket.emit("group:member:demote:failed", {
        message: resolveErrorMessage(error, "Failed to demote member"),
      });
    }
  });

  socket.on("group:rename", async ({ groupId, newName }) => {
    try {
      await wsRenameGroupLimiter.consume(`${actorId}:${groupId}`);

      await renameGroup({ groupId, groupName: newName, requesterId: actorId });
      io.to(groupId).emit("group:renamed", {
        data: { groupId, newName },
        by: actorId,
      });
    } catch (error) {
      socket.emit("group:rename:failed", {
        message: resolveErrorMessage(error, "Failed to rename group"),
      });
    }
  });

  socket.on("group:delete", async (groupId) => {
    try {
      await wsDeleteGroupLimiter.consume(actorId);

      await removeGroup({ groupId, requesterId: actorId });
      io.to(groupId).emit("group:deleted", { data: { groupId }, by: actorId });
    } catch (error) {
      socket.emit("group:delete:failed", {
        message: resolveErrorMessage(error, "Failed to delete group"),
      });
    }
  });
  socket.on("group:seen", async (groupId) => {
    try {
      const result = await updateLastSeen({ groupId, requesterId: actorId });
      io.to(groupId).emit("group:seen:ack", {
        data: {
          groupId: groupId,
          userId: actorId,
          seenAt: result.last_seen_at,
        },
      });
    } catch (error) {
      console.log(error);
    }
  });
}
