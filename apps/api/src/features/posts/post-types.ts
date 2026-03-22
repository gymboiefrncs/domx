import type { Post } from "@domx/shared";

export type PostParams = { groupId: string; postId: string };
export type EditPost = Pick<Post, "id" | "user_id">;
