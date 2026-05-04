import type { Post } from "@domx/shared";

export type PostParams = { groupId: string };
export type EditPost = Pick<Post, "id" | "user_id">;
export interface Message {
  id: string;
  groupId: string;
  userId: string;
  title: string;
  body: string;
  username: string;
  displayId: string;
  createdAt: string;
}

export interface ChatPayload {
  groupId: string;
  title: string;
  body: string;
}

export interface PostResponse<T> {
  data: T;
}
