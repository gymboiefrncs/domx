import express, { type Router } from "express";
import { jwtHandler } from "@api/shared/middlewares/authenticate.js";
import { validateParams } from "@api/shared/middlewares/validate.js";
import {
  handleCreatePost,
  handleEditPost,
  handleGetPosts,
  handleDeletePost,
  handleJoinGroup,
} from "./post.controllers.js";
import {
  DeletePostPayloadSchema,
  EditPostPayloadSchema,
  JoinGroupPayloadSchema,
  PostParamsSchema,
  PostSchema,
} from "./post.schemas.js";
import {
  GroupParamsSchema as GroupActionParamsSchema,
  ManageMemberSchema,
} from "@api/features/groups/group.schemas.js";
import {
  demoteMember,
  kickMember,
  leaveMember,
  promoteMember,
} from "@api/features/groups/group.services.js";
import type { ChatSocket, MessageHandler } from "./post.types.js";
import {
  postLimiter,
  wsWritePostLimiter,
  getRetryAfterSeconds,
} from "@api/shared/middlewares/rateLimit.js";

const postParamsValidator = validateParams(PostParamsSchema);

const broadcastToGroup = (
  rooms: Map<string, Set<ChatSocket>>,
  groupId: string,
  payload: string,
): void => {
  const room = rooms.get(groupId);
  room?.forEach((client) => {
    client.send(payload);
  });
};

export const postRouter: Router = express.Router();

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
  promoteMember: {
    schema: ManageMemberSchema,
    handler: async (data, socket, rooms) => {
      const { groupId, displayId } = data as {
        groupId: string;
        displayId: string;
      };
      const result = await promoteMember(groupId, displayId, socket.userId);
      const payload = JSON.stringify({
        type: "memberPromoted",
        message: result.message,
        data: { groupId, displayId },
      });
      socket.send(payload);
      broadcastToGroup(rooms, groupId, payload);
    },
  },
  demoteMember: {
    schema: ManageMemberSchema,
    handler: async (data, socket, rooms) => {
      const { groupId, displayId } = data as {
        groupId: string;
        displayId: string;
      };
      const result = await demoteMember(groupId, displayId, socket.userId);
      const payload = JSON.stringify({
        type: "memberDemoted",
        message: result.message,
        data: { groupId, displayId },
      });
      socket.send(payload);
      broadcastToGroup(rooms, groupId, payload);
    },
  },
  kickMember: {
    schema: ManageMemberSchema,
    handler: async (data, socket, rooms) => {
      const { groupId, displayId } = data as {
        groupId: string;
        displayId: string;
      };
      const result = await kickMember(groupId, displayId, socket.userId);
      const payload = JSON.stringify({
        type: "memberKicked",
        message: result.message,
        data: { groupId, displayId },
      });
      socket.send(payload);
      broadcastToGroup(rooms, groupId, payload);
    },
  },
  leaveGroup: {
    schema: GroupActionParamsSchema,
    handler: async (data, socket, rooms) => {
      const { groupId } = data as { groupId: string };
      const result = await leaveMember(groupId, socket.userId);
      const payload = JSON.stringify({
        type: "groupLeft",
        message: result.message,
        data: { groupId },
      });
      socket.send(payload);
      broadcastToGroup(rooms, groupId, payload);
    },
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
