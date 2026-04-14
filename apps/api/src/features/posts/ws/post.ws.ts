import {
  handleCreatePost,
  handleDeletePost,
  handleEditPost,
  handleJoinGroup,
} from "./post.handlers.js";
import {
  DeletePostPayloadSchema,
  EditPostPayloadSchema,
  JoinGroupPayloadSchema,
  PostSchema,
} from "../post.schemas.js";
import type { ChatSocket, WsMessageHandler } from "@api/shared/types/ws.js";
import {
  wsWritePostLimiter,
  getRetryAfterSeconds,
} from "@api/shared/middlewares/rateLimit.js";

const messageHandlers: Record<string, WsMessageHandler> = {
  joinGroup: {
    schema: JoinGroupPayloadSchema,
    handler: handleJoinGroup,
  },
  sendMessage: {
    schema: PostSchema,
    handler: handleCreatePost,
  },
  editMessage: {
    schema: EditPostPayloadSchema,
    handler: handleEditPost,
  },
  deleteMessage: {
    schema: DeletePostPayloadSchema,
    handler: handleDeletePost,
  },
};

export const handleChatMessage = async (
  type: string,
  payload: unknown,
  socket: ChatSocket,
  rooms: Map<string, Set<ChatSocket>>,
) => {
  try {
    await wsWritePostLimiter.consume(socket.userId);
  } catch (error) {
    const retryAfter = getRetryAfterSeconds(error);
    return socket.send(
      JSON.stringify({
        type: "error",
        payload: "Too many requests, slow down",
        retryAfter,
      }),
    );
  }
  const entry = messageHandlers[type];
  if (!entry)
    return socket.send(JSON.stringify({ message: "Unknown message type" }));

  const parsed = entry.schema.safeParse(payload);
  if (!parsed.success) {
    return socket.send(JSON.stringify({ message: parsed.error.flatten() }));
  }
  await entry.handler(parsed.data, socket, rooms);
};
