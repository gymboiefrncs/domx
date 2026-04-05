import type { Post } from "@domx/shared";
import type { WebSocket } from "ws";
import type { ZodTypeAny } from "zod";

export type PostParams = { groupId: string; postId: string };
export type EditPost = Pick<Post, "id" | "user_id">;
export type Message = {
  id: string;
  groupId: string;
  userId: string;
  title: string;
  body: string;
  username: string;
  displayId: string;
  createdAt: string;
};

export type ChatPayload = {
  groupId: string;
  title: string;
  body: string;
};

export interface ChatSocket extends WebSocket {
  groupId: string;
  userId: string;
}

export type MessageHandler = {
  schema: ZodTypeAny;
  handler: (
    data: unknown,
    socket: ChatSocket,
    rooms: Map<string, Set<ChatSocket>>,
  ) => Promise<void>;
};
