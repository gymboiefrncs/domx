import express, { type Router } from "express";
import rateLimit from "express-rate-limit";
import { jwtHandler } from "@api/shared/middlewares/authenticate.js";
import { validateParams } from "@api/shared/middlewares/validate.js";
import {
  handleCreatePost,
  handleEditPost,
  handleGetPosts,
  handleDeletePost,
  handleJoinGroup,
} from "./post.controllers.js";
import { config } from "@api/shared/config.js";
import {
  DeletePostPayloadSchema,
  EditPostPayloadSchema,
  JoinGroupPayloadSchema,
  PostParamsSchema,
  PostSchema,
} from "./post.schemas.js";
import type { ChatSocket, MessageHandler } from "./post.types.js";

const postParamsValidator = validateParams(PostParamsSchema);

export const postRouter: Router = express.Router();

const postLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: config.server.nodeEnv === "production" ? 120 : 1000,
  message: "Too many requests, please try again in a minute",
  standardHeaders: true,
  legacyHeaders: false,
});

postRouter.use(postLimiter);

postRouter.get(
  "/groups/:groupId/posts",
  jwtHandler,
  postParamsValidator,
  handleGetPosts,
);

const messageHandlers: Record<string, MessageHandler> = {
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
  const entry = messageHandlers[type];
  if (!entry)
    return socket.send(JSON.stringify({ message: "Unknown message type" }));

  const parsed = entry.schema.safeParse(payload);
  if (!parsed.success) {
    return socket.send(JSON.stringify({ message: parsed.error.flatten() }));
  }
  await entry.handler(parsed.data, socket, rooms);
};
