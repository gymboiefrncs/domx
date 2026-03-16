import { useParams } from "react-router-dom";
import { usePosts } from "@/hooks/usePost";
import { useGroups } from "@/context/GroupContext";

type Posts = {
  id: string;
  user_id: string;
  group_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  title: string;
  username: string;
  display_id: string;
};

export const GroupChatPage = () => {
  const { id } = useParams();
  const { posts, loading, error } = usePosts(id!);
  const { groups } = useGroups();
  const group = groups.find((g) => g.group_id === id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-sm text-neutral-400">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-sm text-red-400">
        Failed to load messages.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-medium text-neutral-900 tracking-tight">
              {group?.name ?? "Group Chat"}
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              {(group?.member_count ?? 0) === 1
                ? `${group?.member_count} member`
                : `${group?.member_count} members`}
            </p>
          </div>
        </div>
        <div>
          {posts.length === 0 ? (
            <p className="text-sm text-neutral-400">No posts yet.</p>
          ) : (
            <ul className="space-y-4">
              {posts.map((post: Posts) => (
                <li key={post.id} className="text-sm text-neutral-700">
                  {post.body}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button className="btn btn-primary fixed bottom-20 right-4">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
