import { useQuery } from "@tanstack/react-query";
import type { PostDetails } from "@domx/shared";
import { postsQueryOptions } from "../hooks/usePosts";

interface GroupChatMessagesProps {
  groupId: string;
}

export const GroupChatMessages = ({ groupId }: GroupChatMessagesProps) => {
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
      {posts.map((post: PostDetails) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};

const PostCard = ({ post }: { post: PostDetails }) => {
  return (
    <div className={`flex flex-col gap-1`}>
      {/* Meta */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-foreground">
          {post.username}
        </span>
        <span className="text-xs text-muted-foreground">
          @{post.display_id}
        </span>
        <span className="text-xs text-muted-foreground">·</span>
        <span className="text-xs text-muted-foreground">
          {new Date(post.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {/* Card */}
      <div className="rounded-xl border border-border bg-muted/40 overflow-hidden">
        {/* Title */}
        <div className="px-4 py-2 border-b border-border">
          <p className="text-sm font-medium text-foreground">{post.title}</p>
        </div>

        {/* Code body */}
        <div className="relative">
          <pre className="px-4 py-3 text-xs text-foreground font-mono overflow-x-auto whitespace-pre leading-relaxed">
            <code>{post.body}</code>
          </pre>
          {/* Language badge placeholder — swap with real language later */}
          <span className="absolute top-2 right-3 text-xs text-muted-foreground font-mono">
            code
          </span>
        </div>
      </div>
    </div>
  );
};
