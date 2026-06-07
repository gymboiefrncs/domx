import { useSuspenseQuery } from "@tanstack/react-query";
import { useLayoutEffect, useRef } from "react";
import type { GroupRole, ThreadDetails } from "@domx/shared";
import { threadsQueryOptions } from "../queries";
import { PostCard } from "./ThreadCard";

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
  const { data: thread } = useSuspenseQuery(threadsQueryOptions(groupId));
  const scrollRef = useRef<HTMLDivElement | null>(null);
  // remembers if the user was at the bottom before the latest render,
  // so we know whether to auto-scroll when new thread arrive
  const isAtBottomRef = useRef(true);
  const prevCountRef = useRef(0); // tracks previous post count to detect new thread

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
    const currentCount = thread?.length ?? 0;
    if (!container || currentCount === 0) {
      prevCountRef.current = currentCount;
      return;
    }

    const wasEmpty = prevCountRef.current === 0;
    const lastPost = thread?.[currentCount - 1];
    const lastIsMine = !!userId && lastPost?.user_id === userId;

    if (wasEmpty || lastIsMine || isAtBottomRef.current) {
      container.scrollTop = container.scrollHeight;
      isAtBottomRef.current = true;
    }

    prevCountRef.current = currentCount;
  }, [thread, userId]);

  if (!thread?.length) {
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
      {thread.map((thread: ThreadDetails) => {
        const isMe = thread.user_id === userId;
        const isAdmin = role === "admin";
        const canModify = isMe || isAdmin;
        return (
          <PostCard
            key={thread.id}
            thread={thread}
            isMe={isMe}
            canModify={canModify}
          />
        );
      })}
    </div>
  );
};
