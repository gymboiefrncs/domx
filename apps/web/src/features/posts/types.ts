import type { PostDetails } from "@domx/shared";

type HookState = {
  loading: boolean;
};

export type GetPostsState = HookState & {
  posts: PostDetails[];
  handleCreatePost: (
    groupId: string,
    body: string,
    title: string,
  ) => Promise<void>;
  handleEditPost: (
    postId: string,
    body: string,
    title: string,
  ) => Promise<void>;
  handleDeletePost: (postId: string) => Promise<void>;
};
