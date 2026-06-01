import { useQuery } from "@tanstack/react-query";
import { useLayoutEffect, useRef } from "react";
import type { GroupRole, PostDetails } from "@domx/shared";
import { postsQueryOptions } from "../hooks/usePosts";
import { PostCard } from "./PostCard";

interface GroupChatMessagesProps {
  groupId: string;
  userId?: string;
  role: GroupRole;
}

export const GroupChatMessages = ({
  groupId,
  userId,
  role,
}: GroupChatMessagesProps) => {
  const { data: posts } = useQuery(postsQueryOptions(groupId));
  const scrollRef = useRef<HTMLDivElement | null>(null);
  // remembers if the user was at the bottom before the latest render,
  // so we know whether to auto-scroll when new posts arrive
  const isAtBottomRef = useRef(true);
  const prevCountRef = useRef(0); // tracks previous post count to detect new posts

  const updateIsAtBottom = () => {
    const container = scrollRef.current;
    if (!container) return;
    const threshold = 48;
    isAtBottomRef.current =
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - threshold;
  };

  useLayoutEffect(() => {
    const container = scrollRef.current;
    const currentCount = posts?.length ?? 0;
    if (!container || currentCount === 0) {
      prevCountRef.current = currentCount;
      return;
    }

    const wasEmpty = prevCountRef.current === 0;
    const lastPost = posts?.[currentCount - 1];
    const lastIsMine = !!userId && lastPost?.user_id === userId;

    if (wasEmpty || lastIsMine || isAtBottomRef.current) {
      container.scrollTop = container.scrollHeight;
      isAtBottomRef.current = true;
    }

    prevCountRef.current = currentCount;
  }, [posts, userId]);

  if (!posts?.length) {
    return (
      <div
        ref={scrollRef}
        onScroll={updateIsAtBottom}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        <p className="text-sm text-center text-muted-foreground">
          No messages yet.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={updateIsAtBottom}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
    >
      {posts.map((post: PostDetails) => {
        const isMe = post.user_id === userId;
        const isAdmin = role === "admin";
        const canModify = isMe || isAdmin;
        return (
          <PostCard
            key={post.id}
            post={post}
            isMe={isMe}
            canModify={canModify}
          />
        );
      })}
    </div>
  );
};
