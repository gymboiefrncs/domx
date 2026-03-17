import type { Posts } from "@/pages/GroupChat";
import { fetchMessages } from "@/services/posts";
import { useEffect, useState } from "react";

export const usePosts = (groupId: string) => {
  const [posts, setPosts] = useState<Posts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchMessages(groupId);
        console.log("Fetched posts:", data);
        setPosts(data);
      } catch (error) {
        // use any for now since we don't have a defined error type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setError((error as any).message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [groupId]);

  const addPost = (post: Posts) => {
    setPosts((prevPosts) => [...prevPosts, post]);
  };

  return { posts, loading, error, addPost };
};
