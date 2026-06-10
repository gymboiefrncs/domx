import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { queryClient } from "@/shared/lib/queryClient";
import { socket } from "@/shared/lib/socket/socket.client";
import type { ThreadDetails } from "@domx/shared";
import { Check, Clock, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { threadsQueryOptions } from "../queries";

interface PostCardProps {
  thread: ThreadDetails;
  isMe: boolean;
  canModify: boolean;
}

export const PostCard = ({ thread, isMe, canModify }: PostCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(thread.title);
  const [editBody, setEditBody] = useState(thread.content);

  const handleEdit = () => {
    setIsEditing(true);
    setEditTitle(thread.title);
    setEditBody(thread.content);
  };
  const handleCancel = () => {
    setIsEditing(false);
    setEditTitle(thread.title);
    setEditBody(thread.content);
  };

  const handleSaveOnEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  const handleSave = () => {
    if (!editTitle.trim() && !editBody.trim()) return;

    queryClient.setQueryData(
      threadsQueryOptions(thread.group_id).queryKey,
      (oldThread) => {
        if (!oldThread) return oldThread;
        return {
          ...oldThread,
          pages: oldThread.pages.map((page) => ({
            ...page,
            items: page.items.map((t) =>
              t.id === thread.id
                ? { ...t, title: editTitle, content: editBody }
                : t,
            ),
          })),
        };
      },
    );

    socket.emit("chat:edit", {
      groupId: thread.group_id,
      threadId: thread.id,
      title: editTitle,
      content: editBody,
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    queryClient.setQueryData(
      threadsQueryOptions(thread.group_id).queryKey,
      (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            items: page.items.filter((t) => t.id !== thread.id),
          })),
        };
      },
    );
    socket.emit("chat:delete", {
      groupId: thread.group_id,
      threadId: thread.id,
    });
  };

  return (
    <div
      className={`group flex flex-col gap-2.5 p-4 rounded-xl border transition-all duration-200 ${
        isMe
          ? "border-primary/20 bg-primary/5 shadow-sm"
          : "border-border bg-card hover:bg-accent/5"
      }`}
    >
      {/* Header Info */}
      <div
        className={`flex items-center justify-between gap-4 ${isMe ? "flex-row-reverse" : ""}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-foreground truncate">
            {thread.username}
          </span>
          <span className="text-xs text-muted-foreground truncate">
            @{thread.display_id}
          </span>
          {isMe && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary text-primary-foreground rounded-md uppercase tracking-wider scale-95">
              You
            </span>
          )}
        </div>

        {/* Action Elements Toggle */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0 font-medium">
          {canModify && !isEditing && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleEdit}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <ConfirmDialog
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                }
                title="Delete thread?"
                description="This action cannot be undone."
                onConfirm={handleDelete}
              />
            </div>
          )}
          <div className="flex items-center gap-1 ml-1">
            <Clock className="w-3 h-3" />
            <span>
              {new Date(thread.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Editing Conditional Block */}
      {isEditing ? (
        <div className="flex flex-col gap-3 mt-1">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider pl-0.5">
              Post Title
            </label>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleSaveOnEnter}
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
              onKeyDown={handleSaveOnEnter}
              className="text-xs font-mono min-h-30 bg-zinc-950 text-zinc-100 dark:bg-zinc-900/50 leading-relaxed selection:bg-zinc-800"
            />
          </div>
          <div className="flex items-center justify-end gap-2 mt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="h-8 text-xs gap-1"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="h-8 text-xs gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Save
            </Button>
          </div>
        </div>
      ) : (
        <>
          <h3 className="text-base font-medium text-foreground tracking-tight px-0.5">
            {thread.title}
          </h3>
          <div className="relative rounded-lg border border-border bg-zinc-950 dark:bg-zinc-900/50 overflow-hidden shadow-inner">
            <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-900 border-b border-zinc-800">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/60" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/60" />
              </div>
              <span className="text-[11px] text-zinc-400 font-mono tracking-wide uppercase">
                code
              </span>
            </div>
            <div className="overflow-x-auto">
              <pre className="p-4 text-xs font-mono text-zinc-100 whitespace-pre leading-relaxed selection:bg-zinc-800">
                <code>{thread.content}</code>
              </pre>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
