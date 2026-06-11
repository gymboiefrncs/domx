import { useInfiniteQuery } from "@tanstack/react-query";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { GroupRole, ThreadDetails } from "@domx/shared";
import { threadsQueryOptions } from "../queries";
import { ThreadCard } from "./ThreadCard";
import { queryClient } from "@/shared/lib/queryClient";
import { socket } from "@/shared/lib/socket/socket.client";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { useChatScroll } from "../hooks/useChatScroll";

interface GroupChatMessagesProps {
  groupId: string;
  userId?: string;
  role: GroupRole;
}

export const GroupChatMessages = memo(
  ({ groupId, userId, role }: GroupChatMessagesProps) => {
    const {
      data: threads = [],
      hasNextPage,
      fetchNextPage,
      isFetchingNextPage,
    } = useInfiniteQuery({
      ...threadsQueryOptions(groupId),
      select: (rawData) =>
        rawData.pages
          .slice()
          .reverse()
          .flatMap((page) => page.items),
    });

    const [activeDeleteThread, setActiveDeleteThread] =
      useState<ThreadDetails | null>(null);
    const activeDeleteThreadref = useRef<ThreadDetails | null>(null);

    useEffect(() => {
      activeDeleteThreadref.current = activeDeleteThread;
    }, [activeDeleteThread]);

    const { scrollRef, sentinelRef, updateIsAtBottom } = useChatScroll({
      threads,
      userId,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
    });

    const handleConfirmDelete = useCallback(() => {
      const thread = activeDeleteThreadref.current;
      if (!thread) return;

      queryClient.setQueryData(
        threadsQueryOptions(thread.group_id).queryKey,
        (oldThread: any) => {
          if (!oldThread) return oldThread;
          return {
            ...oldThread,
            pages: oldThread.pages.map((page: any) => ({
              ...page,
              items: page.items.filter((t: any) => t.id !== thread.id),
            })),
          };
        },
      );
      socket.emit("chat:delete", {
        groupId: thread.group_id,
        threadId: thread.id,
      });
      setActiveDeleteThread(null);
    }, []);

    const handleInitiateDelete = useCallback((thread: ThreadDetails) => {
      setActiveDeleteThread(thread);
    }, []);

    if (!threads.length) {
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
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 will-change-scroll scroll-sm"
      >
        <div ref={sentinelRef} className="h-4">
          {isFetchingNextPage && (
            <p className="text-xs text-center text-muted-foreground py-2">
              Loading older messages...
            </p>
          )}
        </div>

        {threads.map((thread: ThreadDetails) => {
          const isMe = thread.user_id === userId;
          const isAdmin = role === "admin";
          const canModify = isMe || isAdmin;
          return (
            <ThreadCard
              key={thread.id}
              thread={thread}
              isMe={isMe}
              canModify={canModify}
              onDeleteClick={handleInitiateDelete}
            />
          );
        })}

        <ConfirmDialog
          open={!!activeDeleteThread}
          onOpenChange={(open) => {
            if (!open) setActiveDeleteThread(null);
          }}
          title="Delete message?"
          description="This can't be undone."
          onConfirm={handleConfirmDelete}
        />
      </div>
    );
  },
);

GroupChatMessages.displayName = "GroupChatMessages";
