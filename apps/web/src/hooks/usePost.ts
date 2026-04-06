import { useAuthContext } from "@/context/AuthContext";
import {
  connectPostSocket,
  fetchMessages,
  joinPostGroup,
  sendEditPostMessage,
  sendPostMessage,
  type ChatIncomingMessage,
} from "@/services/posts";
import type { GetPostsState } from "@/shared";
import { getErrorMessage } from "@/utils/error";
import type { PostDetails } from "@domx/shared";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const usePosts = (groupId: string): GetPostsState => {
  const { user } = useAuthContext();
  const [posts, setPosts] = useState<PostDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<WebSocket | null>(null);
  const optimisticQueueRef = useRef<string[]>([]);

  useEffect(() => {
    let isDisposed = false;

    const normalizePost = (post: Partial<PostDetails>): PostDetails => {
      const fallbackUsername = user?.username ?? "Unknown user";
      const fallbackDisplayId = user?.display_id ?? "unknown";

      return {
        id: post.id ?? crypto.randomUUID(),
        body: post.body ?? "",
        title: post.title ?? "Untitled",
        user_id: post.user_id ?? "unknown",
        group_id: post.group_id ?? groupId,
        username: post.username ?? fallbackUsername,
        display_id: post.display_id ?? fallbackDisplayId,
        created_at: new Date(post.created_at ?? new Date()),
        updated_at: new Date(post.updated_at ?? new Date()),
      };
    };

    const handleIncomingChatMessage = (message: ChatIncomingMessage) => {
      if ("message" in message && typeof message.message === "string") {
        toast.error(message.message);
        return;
      }

      if (!("type" in message)) return;

      if (message.type === "error") {
        const nextOptimisticId = optimisticQueueRef.current.shift();
        if (nextOptimisticId) {
          setPosts((prev) =>
            prev.filter((post) => post.id !== nextOptimisticId),
          );
        }

        toast.error(
          message.message ?? message.payload ?? "Failed to send message",
        );
        return;
      }

      if (message.type === "newMessage") {
        const incomingPost = normalizePost(message.data);

        setPosts((prev) => {
          const existingIndex = prev.findIndex(
            (post) => post.id === incomingPost.id,
          );
          if (existingIndex >= 0) {
            const copy = [...prev];
            copy[existingIndex] = incomingPost;
            return copy;
          }

          const nextOptimisticId = optimisticQueueRef.current[0];
          const optimisticIndex = nextOptimisticId
            ? prev.findIndex((post) => post.id === nextOptimisticId)
            : -1;

          const fallbackOptimisticIndex =
            optimisticIndex >= 0
              ? optimisticIndex
              : prev.findIndex((post) => {
                  const isOptimistic = post.user_id.startsWith("optimistic-");
                  if (!isOptimistic) return false;

                  return (
                    post.group_id === incomingPost.group_id &&
                    post.title === incomingPost.title &&
                    post.body === incomingPost.body
                  );
                });

          if (fallbackOptimisticIndex < 0) {
            return [...prev, incomingPost];
          }

          const copy = [...prev];
          const replacedOptimisticId = copy[fallbackOptimisticIndex]?.id;
          copy[fallbackOptimisticIndex] = incomingPost;
          if (replacedOptimisticId) {
            optimisticQueueRef.current = optimisticQueueRef.current.filter(
              (id) => id !== replacedOptimisticId,
            );
          }
          toast.success("Message sent!", { duration: 2000 });
          return copy;
        });
        return;
      }

      if (message.type === "postEdited") {
        setPosts((prev) =>
          prev.map((post) =>
            post.id === message.data.id
              ? {
                  ...post,
                  ...message.data,
                  updated_at: new Date(),
                }
              : post,
          ),
        );
        return;
      }

      if (message.type === "postDeleted") {
        setPosts((prev) =>
          prev.filter((post) => post.id !== message.data.postId),
        );
      }
    };

    async function load() {
      setLoading(true);
      try {
        const data = await fetchMessages(groupId);
        if (isDisposed) return false;
        setPosts(data.map((post) => normalizePost(post)));
        return true;
      } catch (error) {
        if (isDisposed) return false;
        toast.error(getErrorMessage(error));
        return false;
      } finally {
        if (!isDisposed) {
          setLoading(false);
        }
      }
    }
    optimisticQueueRef.current = [];

    void (async () => {
      const loaded = await load();
      if (!loaded || isDisposed) return;

      let opened = false;
      const socket = connectPostSocket({
        onOpen: () => {
          opened = true;
          joinPostGroup(socket, groupId);
        },
        onMessage: (message) => {
          handleIncomingChatMessage(message);
        },
        onError: () => {
          if (!isDisposed && !opened) {
            toast.error("Chat connection failed");
          }
        },
      });

      socketRef.current = socket;
    })();

    return () => {
      isDisposed = true;
      optimisticQueueRef.current = [];
      const socket = socketRef.current;
      socketRef.current = null;
      socket?.close();
    };
  }, [groupId, user?.display_id, user?.username]);

  const handleCreatePost = async (
    groupId: string,
    post: string,
    title: string,
  ) => {
    const optimisticPost: PostDetails = {
      id: crypto.randomUUID(),
      body: post,
      title: title,
      user_id: `optimistic-${crypto.randomUUID()}`,
      group_id: groupId,
      username: user?.username ?? "",
      display_id: user?.display_id ?? "",
      created_at: new Date(),
      updated_at: new Date(),
    };

    // add the optimistic post to the ui immediately. this gives user instant feeback
    setPosts((prev) => [...prev, optimisticPost]);
    optimisticQueueRef.current.push(optimisticPost.id);

    try {
      const socket = socketRef.current;

      if (!socket || socket.readyState !== WebSocket.OPEN) {
        throw new Error("Chat connection is not ready");
      }

      sendPostMessage(socket, {
        body: post,
        title,
      });
    } catch (error) {
      optimisticQueueRef.current = optimisticQueueRef.current.filter(
        (id) => id !== optimisticPost.id,
      );
      setPosts((prev) => prev.filter((p) => p.id !== optimisticPost.id));
      toast.error(getErrorMessage(error));
    }
  };

  const handleEditPost = async (
    postId: string,
    body: string,
    title: string,
  ) => {
    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      toast.error("Chat connection is not ready");
      return;
    }

    sendEditPostMessage(socket, {
      postId,
      body,
      title,
    });
  };

  return { posts, loading, handleCreatePost, handleEditPost };
};
