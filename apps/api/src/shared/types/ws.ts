import type { WebSocket } from "ws";
import type { ZodTypeAny } from "zod";

export interface ChatSocket extends WebSocket {
  groupId: string;
  userId: string;
}

export type WsMessageHandler = {
  schema: ZodTypeAny;
  handler: (
    data: unknown,
    socket: ChatSocket,
    rooms: Map<string, Set<ChatSocket>>,
  ) => Promise<void>;
};
