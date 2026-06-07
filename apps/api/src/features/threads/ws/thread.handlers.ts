import type { ClientToServerEvents, ServerToClientEvents } from "@domx/shared";
import type { Server, Socket } from "socket.io";
import { resolveErrorMessage } from "@api/features/groups/ws/group.handlers.js";
import {
  wsEditThreadLimiter,
  wsWriteThreadLimiter,
  wsDeleteThreadLimiter,
} from "@api/shared/middlewares/rateLimit.js";
import { createThread, editThread, removeThread } from "../thread.services.js";

export function registerThreadHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) {
  const actorId = socket.data.user.id;

  socket.on("chat:send", async ({ title, content, groupId }, callback) => {
    try {
      await wsWriteThreadLimiter.consume(actorId);
      const message = await createThread({
        title,
        content,
        requesterId: actorId,
        groupId,
      });
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
  socket.on("chat:edit", async ({ groupId, threadId, title, content }) => {
    try {
      await wsEditThreadLimiter.consume(actorId);
      const message = await editThread({
        requesterId: actorId,
        groupId,
        threadId,
        /**
         *  Conditionally spread each optional field so that when they're
         *  undefined, the property is simply absent from the object rather
         *  than present but undefined
         */
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
      });
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
  socket.on("chat:delete", async ({ groupId, threadId }) => {
    try {
      await wsDeleteThreadLimiter.consume(actorId);
      const message = await removeThread({
        threadId,
        groupId,
        requesterId: actorId,
      });
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
