import { fetchMessages } from "@/services/posts";
import type { GetPostsState } from "@/shared";
import { getErrorMessage } from "@/utils/error";
import type { PostDetails } from "@domx/shared";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const usePosts = (groupId: string): GetPostsState => {
  const [posts, setPosts] = useState<PostDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchMessages(groupId);
        setPosts(data);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [groupId]);

  const addPost = (post: PostDetails) => {
    setPosts((prevPosts) => [...prevPosts, post]);
  };

  return { posts, loading, addPost };
};
