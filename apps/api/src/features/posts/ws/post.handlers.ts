import type { ClientToServerEvents, ServerToClientEvents } from "@domx/shared";
import type { Server, Socket } from "socket.io";
import { resolveErrorMessage } from "@api/features/groups/ws/group.handlers.js";
import {
  wsDeletePostLimiter,
  wsEditPostLimiter,
  wsWritePostLimiter,
} from "@api/shared/middlewares/rateLimit.js";
import { createPost, editPost, removePost } from "../post.services.js";

export function registerPostHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) {
  const actorId = socket.data.user.id;

  socket.on("chat:send", async ({ title, body, groupId }, callback) => {
    try {
      await wsWritePostLimiter.consume(actorId);
      const message = await createPost(title, body, actorId, groupId);
      io.to(groupId).emit("chat:received", {
        data: { message },
        by: actorId,
        type: "added",
      });
      callback({ success: true });
    } catch (error) {
      socket.emit("chat:send:failed", {
        message: resolveErrorMessage(error, "Failed to send message"),
      });
      callback({ success: false });
    }
  });
  socket.on("chat:edit", async ({ groupId, postId, title, body }) => {
    try {
      await wsEditPostLimiter.consume(actorId);
      const message = await editPost(actorId, groupId, postId, title, body);
      io.to(groupId).emit("chat:received", {
        data: { message },
        by: actorId,
        type: "edited",
      });
    } catch (error) {
      socket.emit("chat:send:failed", {
        message: resolveErrorMessage(error, "Failed to edit message"),
      });
    }
  });
  socket.on("chat:delete", async ({ groupId, postId }) => {
    try {
      await wsDeletePostLimiter.consume(actorId);
      const message = await removePost(postId, groupId, actorId);
      io.to(groupId).emit("chat:received", {
        data: { message },
        by: actorId,
        type: "deleted",
      });
    } catch (error) {
      socket.emit("chat:send:failed", {
        message: resolveErrorMessage(error, "Failed to delete message"),
      });
    }
  });
}
