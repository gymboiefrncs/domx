import type { Server, Socket } from "socket.io";
import {
  addMember,
  deleteGroupById,
  demoteMember,
  kickMember,
  leaveMember,
  promoteMember,
  changeGroupName,
} from "../group.services.js";
import { performChecks } from "@api/features/posts/index.js";
import {
  getRetryAfterSeconds,
  wsJoinGroupLimiter,
  wsWritePostLimiter,
} from "@api/shared/middlewares/rateLimit.js";
import type { ClientToServerEvents, ServerToClientEvents } from "@domx/shared";

function resolveErrorMessage(error: unknown, fallback: string): string {
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
      await wsJoinGroupLimiter.consume(socket.data.user.id);

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
      await wsWritePostLimiter.consume(socket.data.user.id);

      const {
        member: newMember,
        groupDetail,
        targetUserId,
      } = await addMember(groupId, targetUserDisplayId, actorId);

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
      await wsWritePostLimiter.consume(socket.data.user.id);

      await kickMember(groupId, targetUserDisplayId, actorId);
      io.to(groupId).emit("group:member:kicked", {
        data: { groupId, targetUserDisplayId },
        by: actorId,
      });
    } catch (error) {
      socket.emit("group:member:kick:failed", {
        message: resolveErrorMessage(error, "Failed to kick member"),
      });
    }
  });

  socket.on("group:member:leave", async (groupId) => {
    try {
      await wsWritePostLimiter.consume(socket.data.user.id);

      const { display_id } = await leaveMember(groupId, actorId);

      io.to(groupId).emit("group:member:left", {
        data: { groupId, displayId: display_id },
      });
    } catch (error) {
      socket.emit("group:member:leave:failed", {
        message: resolveErrorMessage(error, "Failed to leave group"),
      });
    }
  });

  socket.on(
    "group:member:promote",
    async ({ groupId, targetUserDisplayId }) => {
      try {
        await wsWritePostLimiter.consume(socket.data.user.id);

        await promoteMember(groupId, targetUserDisplayId, actorId);
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
      await wsWritePostLimiter.consume(socket.data.user.id);

      await demoteMember(groupId, targetUserDisplayId, actorId);
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
      await wsWritePostLimiter.consume(socket.data.user.id);

      await changeGroupName(groupId, newName, actorId);
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
      await wsWritePostLimiter.consume(socket.data.user.id);

      await deleteGroupById(groupId, actorId);
      io.to(groupId).emit("group:deleted", { data: { groupId }, by: actorId });
    } catch (error) {
      socket.emit("group:delete:failed", {
        message: resolveErrorMessage(error, "Failed to delete group"),
      });
    }
  });
}
