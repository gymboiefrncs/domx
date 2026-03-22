import { useState } from "react";
import { createPost } from "@/services/posts";
import { toast } from "sonner";
import { getErrorMessage } from "@/utils/error";
import type { Post } from "@domx/shared";
import type { CreatePostState } from "@/shared";

export const useCreatePost = (
  onSuccess: (newPost: Post) => void,
): CreatePostState => {
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
