import { useQuery } from "@tanstack/react-query";
import type { GroupRole, PostDetails } from "@domx/shared";
import { postsQueryOptions } from "../hooks/usePosts";
import { Clock, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  if (!posts?.length) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="text-sm text-center text-muted-foreground">
          No messages yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
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

const PostCard = ({
  post,
  isMe,
  canModify,
}: {
  post: PostDetails;
  isMe: boolean;
  canModify: boolean;
}) => {
  return (
    <div
      className={`group flex flex-col gap-2.5 p-4 rounded-xl border transition-all duration-200 ${
        isMe
          ? "border-primary/20 bg-primary/5 shadow-sm"
          : "border-border bg-card hover:bg-accent/5"
      }`}
    >
      {/* Header Row */}
      <div
        className={`flex items-center justify-between gap-4 ${isMe ? "flex-row-reverse" : ""}`}
      >
        {/* Left Side: Identity Info */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-foreground truncate">
            {post.username}
          </span>
          <span className="text-xs text-muted-foreground truncate">
            @{post.display_id}
          </span>

          {/* Tag */}
          {isMe && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary text-primary-foreground rounded-md uppercase tracking-wider scale-95">
              You
            </span>
          )}
        </div>

        {/* Right Side: Timestamp */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 font-medium">
          {canModify && (
            <div>
              <Button variant="ghost" size="icon">
                <Pencil className="w-4 h-4"></Pencil>
              </Button>
              <Button variant="destructive" size="icon">
                <Trash2 className="w-4 h-4"></Trash2>
              </Button>
            </div>
          )}
          <Clock className="w-3 h-3" />
          <span>
            {new Date(post.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      {/* Post Title */}
      <h3 className="text-base font-medium text-foreground tracking-tight px-0.5">
        {post.title}
      </h3>

      {/* Code Window Container */}
      <div className="relative rounded-lg border border-border bg-zinc-950 dark:bg-zinc-900/50 overflow-hidden shadow-inner">
        {/* Code Header Bar */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-900 border-b border-zinc-800">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/60" />
          </div>
          <span className="text-[11px] text-zinc-400 font-mono tracking-wide uppercase">
            code {/* replace later witht he actual language */}
          </span>
        </div>

        {/* Code Body */}
        <div className="overflow-x-auto">
          <pre className="p-4 text-xs font-mono text-zinc-100 whitespace-pre leading-relaxed selection:bg-zinc-800">
            <code>{post.body}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
