import { useState } from "react";
import { createPost } from "@/services/posts";
import type { Posts } from "@/pages/GroupChat";

export const useCreatePost = (onSuccess: (newPost: Posts) => void) => {
  const [loadingPost, setLoadingPost] = useState(false);
  const [errorPost, setErrorPost] = useState<string | null>(null);

  async function handleCreatePost(
    groupId: string,
    body: string,
    title: string,
  ) {
    setLoadingPost(true);
    setErrorPost(null);
    try {
      const newPost = await createPost(groupId, body, title);
      onSuccess(newPost);
    } catch (err) {
      // use any for now since we don't have a defined error type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setErrorPost((err as any).message);
    } finally {
      setLoadingPost(false);
    }
  }

  return { handleCreatePost, loadingPost, errorPost };
};
