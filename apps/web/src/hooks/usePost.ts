import { useAuthContext } from "@/context/AuthContext";
import { createPost, fetchMessages } from "@/services/posts";
import type { GetPostsState } from "@/shared";
import { getErrorMessage } from "@/utils/error";
import type { PostDetails } from "@domx/shared";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const usePosts = (groupId: string): GetPostsState => {
  const { user } = useAuthContext();
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

  const handleCreatePost = async (
    groupId: string,
    post: string,
    title: string,
  ) => {
    {
      setLoading(true);
      try {
        const newPost = await createPost(groupId, post, title);
        setPosts((prevPosts) => [
          ...prevPosts,
          {
            ...newPost,
            username: user?.username,
            display_id: user?.display_id,
          } as PostDetails,
        ]);
        toast.success("Message sent!", { duration: 2000 });
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    }
  };

  return { posts, loading, handleCreatePost };
};
