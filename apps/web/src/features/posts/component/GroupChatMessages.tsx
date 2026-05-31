import { useQuery } from "@tanstack/react-query";
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
