import type { ClientToServerEvents, ServerToClientEvents } from "@domx/shared";
import type { Server, Socket } from "socket.io";
import { resolveErrorMessage } from "@api/features/groups/ws/group.handlers.js";
import { wsWritePostLimiter } from "@api/shared/middlewares/rateLimit.js";
import { createPost } from "../post.services.js";

export function registerPostHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) {
  const actorId = socket.data.user.id;

  socket.on("chat:send", async ({ title, body, groupId }, callback) => {
    console.log("[chat:send] received payload:", { title, body, groupId });
    try {
      await wsWritePostLimiter.consume(actorId);
      const newMessage = await createPost(title, body, actorId, groupId);
      io.to(groupId).emit("chat:received", {
        data: { newMessage },
        by: actorId,
      });
      callback({ success: true });
    } catch (error) {
      socket.emit("chat:send:failed", {
        message: resolveErrorMessage(error, "Failed to send message"),
      });
      console.log(groupId);
      console.log("[post.handlers] chat:send error:", error);
      callback({ success: false });
    }
  });
}
