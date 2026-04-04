import type { Post } from "@domx/shared";
import type { WebSocket } from "ws";

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
  grouppId: string;
  userId: string;
}
