import type { Posts } from "@/pages/GroupChat";
import { fetchMessages } from "@/services/posts";
import { getErrorMessage } from "@/utils/error";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const usePosts = (groupId: string) => {
  const [posts, setPosts] = useState<Posts[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchMessages(groupId);
        console.log("Fetched posts:", data);
        setPosts(data);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [groupId]);

  const addPost = (post: Posts) => {
    setPosts((prevPosts) => [...prevPosts, post]);
  };

  return { posts, loading, addPost };
};
