import {
  handleDemoteMember,
  handleKickMember,
  handleLeaveGroup,
  handlePromoteMember,
} from "./group.handlers.js";
import { GroupParamsSchema, ManageMemberSchema } from "../group.schemas.js";
import type { ChatSocket, WsMessageHandler } from "@api/shared/types/ws.js";
import {
  getRetryAfterSeconds,
  wsWritePostLimiter,
} from "@api/shared/middlewares/rateLimit.js";

const GROUP_WS_ACTIONS = new Set([
  "promoteMember",
  "demoteMember",
  "kickMember",
  "leaveGroup",
]);

const messageHandlers: Record<string, WsMessageHandler> = {
  promoteMember: {
    schema: ManageMemberSchema,
    handler: handlePromoteMember,
  },
  demoteMember: {
    schema: ManageMemberSchema,
    handler: handleDemoteMember,
  },
  kickMember: {
    schema: ManageMemberSchema,
    handler: handleKickMember,
  },
  leaveGroup: {
    schema: GroupParamsSchema,
    handler: handleLeaveGroup,
  },
};

export const isGroupWsAction = (type: string): boolean =>
  GROUP_WS_ACTIONS.has(type);

export const handleGroupWsMessage = async (
  type: string,
  payload: unknown,
  socket: ChatSocket,
  rooms: Map<string, Set<ChatSocket>>,
): Promise<void> => {
  try {
    await wsWritePostLimiter.consume(socket.userId);
  } catch (error) {
    const retryAfter = getRetryAfterSeconds(error);
    socket.send(
      JSON.stringify({
        type: "error",
        payload: "Too many requests, slow down",
        retryAfter,
      }),
    );
    return;
  }

  const entry = messageHandlers[type];
  if (!entry) {
    socket.send(JSON.stringify({ message: "Unknown message type" }));
    return;
  }

  const parsed = entry.schema.safeParse(payload);
  if (!parsed.success) {
    socket.send(JSON.stringify({ message: parsed.error.flatten() }));
    return;
  }

  await entry.handler(parsed.data, socket, rooms);
};
