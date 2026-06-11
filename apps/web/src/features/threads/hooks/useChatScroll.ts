import type { ThreadDetails } from "@domx/shared";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

interface useChatScrollOptions {
  threads: ThreadDetails[];
  userId?: string;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

export const useChatScroll = ({
  threads,
  userId,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: useChatScrollOptions) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // remembers if the user was at the bottom before the latest render,
  // so we know whether to auto-scroll when new threads arrive
  const isAtBottomRef = useRef(true);
  const prevCountRef = useRef(0); // tracks previous post count to detect new threads
  const prevScrollHeightRef = useRef(0); // tracks previous scroll height to adjust scroll when loading more threads
  const lastPostIdRef = useRef<string | null>(null); // tracks the ID of the last post to detect new threads

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

    // check if the actual message id at the bottom has changed
    const lastPostIdChanged = lastPost && lastPost.id !== lastPostIdRef.current;
    const lastIsMine =
      !!userId && lastPost?.user_id === userId && lastPostIdChanged;

    if (wasEmpty || lastIsMine || isAtBottomRef.current) {
      container.scrollTop = container.scrollHeight;
      isAtBottomRef.current = true;
    }

    prevCountRef.current = currentCount;
    lastPostIdRef.current = lastPost?.id ?? null;
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
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const updateIsAtBottom = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const threshold = 48;
    isAtBottomRef.current =
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - threshold;
  }, []);
  return { scrollRef, sentinelRef, updateIsAtBottom };
};
