import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useRef } from "react";
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
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteQuery(threadsQueryOptions(groupId));

  const threads =
    data?.pages
      .slice()
      .reverse()
      .flatMap((page) => page.items) ?? [];

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // remembers if the user was at the bottom before the latest render,
  // so we know whether to auto-scroll when new threads arrive
  const isAtBottomRef = useRef(true);
  const prevCountRef = useRef(0); // tracks previous post count to detect new threads
  const prevScrollHeightRef = useRef(0); // tracks previous scroll height to adjust scroll when loading more threadss

  // Scroll position preservation when older messages are prepended
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const newScrollHeight = container.scrollHeight;
    const diff = newScrollHeight - prevScrollHeightRef.current;
    if (diff > 0 && !isAtBottomRef.current) {
      container.scrollTop += diff; // shift down by the height of prepended messages
    }
    prevScrollHeightRef.current = newScrollHeight;
  }, [threads.length]);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    const currentCount = threads?.length ?? 0;
    if (!container || currentCount === 0) {
      prevCountRef.current = currentCount;
      return;
    }

    const wasEmpty = prevCountRef.current === 0;
    const lastPost = threads?.[currentCount - 1];
    const lastIsMine = !!userId && lastPost?.user_id === userId;

    if (wasEmpty || lastIsMine || isAtBottomRef.current) {
      container.scrollTop = container.scrollHeight;
      isAtBottomRef.current = true;
    }

    prevCountRef.current = currentCount;
  }, [threads, userId]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          prevScrollHeightRef.current = scrollRef.current?.scrollHeight ?? 0;
          fetchNextPage();
        }
      },
      { root: scrollRef.current, threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage]);

  const updateIsAtBottom = () => {
    const container = scrollRef.current;
    if (!container) return;
    const threshold = 48;
    isAtBottomRef.current =
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - threshold;
  };

  if (!threads?.length) {
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
      <div ref={sentinelRef} className="h-4">
        {isFetchingNextPage && (
          <p className="text-xs text-center text-muted-foreground py-2">
            Loading older messages...
          </p>
        )}
      </div>

      {threads.map((threads: ThreadDetails) => {
        const isMe = threads.user_id === userId;
        const isAdmin = role === "admin";
        const canModify = isMe || isAdmin;
        return (
          <PostCard
            key={threads.id}
            thread={threads}
            isMe={isMe}
            canModify={canModify}
          />
        );
      })}
    </div>
  );
};
