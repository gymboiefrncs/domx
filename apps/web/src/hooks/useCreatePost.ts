import { useState } from "react";
import { createPost } from "@/services/posts";
import type { Posts } from "@/pages/GroupChat";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/error";

export const useCreatePost = (onSuccess: (newPost: Posts) => void) => {
  const [loadingPost, setLoadingPost] = useState(false);

  async function handleCreatePost(
    groupId: string,
    body: string,
    title: string,
  ) {
    setLoadingPost(true);
    try {
      const newPost = await createPost(groupId, body, title);
      onSuccess(newPost);
      toast.success("Message sent!", { duration: 2000 });
    } catch (err) {
      toast.error(getErrorMessage(err), { duration: 2000 });
    } finally {
      setLoadingPost(false);
    }
  }

  return { handleCreatePost, loadingPost };
};
