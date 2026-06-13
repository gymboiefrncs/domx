import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { queryClient } from "@/shared/lib/queryClient";
import { socket } from "@/shared/lib/socket/socket.client";
import type { ThreadDetails } from "@domx/shared";
import { Check, Clock, Pencil, Trash2, X } from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";
import { threadsQueryOptions } from "../../queries";

import "highlight.js/styles/github-dark.css";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { cn } from "@/lib/utils";

interface ThreadCardProps {
  thread: ThreadDetails;
  isMe: boolean;
  canModify: boolean;
  onDeleteClick: (thread: ThreadDetails) => void;
}

const ThreadEditForm = memo(
  ({
    initialTitle,
    initialContent,
    onSave,
    onCancel,
  }: {
    initialTitle: string;
    initialContent: string;
    onSave: (title: string, content: string) => void;
    onCancel: () => void;
  }) => {
    const [editTitle, setEditTitle] = useState(initialTitle);
    const [editBody, setEditBody] = useState(initialContent);

    const handleSave = useCallback(() => {
      if (!editTitle.trim() && !editBody.trim()) return;
      if (editTitle === initialTitle && editBody === initialContent) {
        onCancel();
        return;
      }
      onSave(editTitle, editBody);
    }, [editTitle, editBody, onSave, onCancel, initialTitle, initialContent]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSave();
        }
      },
      [handleSave],
    );

    return (
      <div className="flex flex-col gap-3 mt-1">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider pl-0.5">
            Post Title
          </label>
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-sm font-medium h-9"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider pl-0.5">
            Code Snippet
          </label>
          <Textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-xs font-mono min-h-30 bg-zinc-950 text-zinc-100 dark:bg-zinc-900/50 leading-relaxed selection:bg-zinc-800"
          />
        </div>
        <div className="flex items-center justify-end gap-2 mt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="h-8 text-xs gap-1"
          >
            <X className="w-3.5 h-3.5" /> Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="h-8 text-xs gap-1">
            <Check className="w-3.5 h-3.5" /> Save
          </Button>
        </div>
      </div>
    );
  },
);

export const ThreadCard = memo(
  ({ thread, isMe, canModify, onDeleteClick }: ThreadCardProps) => {
    const [isEditing, setIsEditing] = useState(false);

    const handleSave = useCallback(
      (title: string, content: string) => {
        if (!title.trim() && !content.trim()) return;

        queryClient.setQueryData(
          threadsQueryOptions(thread.group_id).queryKey,
          (oldThread) => {
            if (!oldThread) return oldThread;
            return {
              ...oldThread,
              pages: oldThread.pages.map((page) => ({
                ...page,
                items: page.items.map((t) =>
                  t.id === thread.id ? { ...t, title, content } : t,
                ),
              })),
            };
          },
        );

        socket.emit("chat:edit", {
          groupId: thread.group_id,
          threadId: thread.id,
          title,
          content,
        });
        setIsEditing(false);
      },
      [thread.group_id, thread.id],
    );

    const handleEdit = useCallback(() => setIsEditing(true), []);
    const handleCancel = useCallback(() => setIsEditing(false), []);
    const handleDelete = useCallback(
      () => onDeleteClick(thread),
      [onDeleteClick, thread],
    );

    const formattedTime = useMemo(() => {
      return new Date(thread.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }, [thread.created_at]);

    return (
      <div
        className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}
      >
        <div
          className={cn(
            "flex flex-col gap-2 w-full max-w-[85%]",
            isMe ? "items-end" : "items-start",
          )}
        >
          <div
            className={cn(
              "group relative flex flex-col overflow-hidden rounded-xl border max-w-[85%]",
              "transition-all duration-200",
              isMe
                ? "border-primary/20 bg-primary/5"
                : "border-border bg-card hover:bg-accent/5",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-medium text-foreground">
                  {thread.username}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  @{thread.display_id}
                </span>

                {isMe && (
                  <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                    You
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {canModify && !isEditing && (
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleEdit}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formattedTime}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 px-4 py-3">
              {isEditing ? (
                <ThreadEditForm
                  initialTitle={thread.title}
                  initialContent={thread.content}
                  onSave={(t, c) => {
                    handleSave(t, c);
                  }}
                  onCancel={handleCancel}
                />
              ) : (
                <>
                  <h3 className="text-sm font-normal tracking-wide text-foreground">
                    {thread.title}
                  </h3>

                  <MarkdownRenderer content={thread.content} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);
