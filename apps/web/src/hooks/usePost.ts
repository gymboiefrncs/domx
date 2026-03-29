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
    const optimisticPost: PostDetails = {
      id: crypto.randomUUID(),
      body: post,
      title: title,
      user_id: crypto.randomUUID(),
      group_id: groupId,
      username: user?.username ?? "",
      display_id: user?.display_id ?? "",
      created_at: new Date(),
      updated_at: new Date(),
    };

    // add the optimistic post to the ui immediately. this gives user instant feeback
    setPosts((prev) => [...prev, optimisticPost]);

    try {
      const newPost = await createPost(groupId, post, title);
      setPosts((prevPosts) =>
        // replace the optimistic post with the actual post from the server
        prevPosts.map((p) =>
          p.id === optimisticPost.id
            ? {
                ...newPost,
                username: user?.username ?? "",
                display_id: user?.display_id ?? "",
              }
            : p,
        ),
      );
      toast.success("Message sent!", { duration: 2000 });
    } catch (error) {
      // remove the optimistic post if the API call fails
      setPosts((prev) => prev.filter((p) => p.id !== optimisticPost.id));
      toast.error(getErrorMessage(error));
    }
  };

  return { posts, loading, handleCreatePost };
};
