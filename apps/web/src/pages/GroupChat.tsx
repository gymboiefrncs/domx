import { Link, useNavigate, useParams } from "react-router-dom";
import { usePosts } from "@/hooks/usePost";
import { useGroupContext } from "@/context/GroupContext";
import React, { useRef, useState } from "react";
import { useCreatePost } from "@/hooks/useCreatePost";
import { useAuthContext } from "@/context/AuthContext";
import { SpinnerIcon, SendIcon, SettingsIcon } from "@/assets/icons";
import type { PostDetails } from "@domx/shared";

export const GroupChatPage = () => {
  const { id } = useParams();
  const { user } = useAuthContext();
  const { posts, loading, addPost } = usePosts(id!);
  const { groups } = useGroupContext();
  const group = groups.find((g) => g.group_id === id);
  const [post, setPost] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  const { handleCreatePost, loadingPost } = useCreatePost((newPost) => {
    addPost({
      ...newPost,
      username: user?.username,
      display_id: user?.display_id,
    } as PostDetails);
  });

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setPost(e.target.value);
    setIsFocused(true);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    //shift + enter for new line
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = (): void => {
    if (!post.trim()) return;
    handleCreatePost(id!, post.trim(), title.trim());
    setPost("");
    setTitle("");
    setIsFocused(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-sm text-neutral-400">
        <SpinnerIcon className="h-4 w-4 spinner" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-neutral-50">
      {/* Header */}
      <div className="flex items-center px-4 py-4 border-b border-neutral-200 bg-neutral-50">
        <button onClick={() => navigate(-1)} className="text-text mr-4">
          <span>{"<-"}</span>
        </button>
        <div>
          <h1 className="text-base font-medium text-neutral-900">
            {group?.name ?? "Group Chat"}
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            {(group?.member_count ?? 0) === 1
              ? `${group?.member_count} member`
              : `${group?.member_count ?? 0} members`}
          </p>
        </div>
        <div className="ml-auto">
          <Link to={`/groups/${id}/settings`}>
            <SettingsIcon className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Posts area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {posts.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center mt-10">
            No posts yet. Be the first to post!
          </p>
        ) : (
          <ul className="max-w-md mx-auto">
            {posts.map((post: PostDetails) => (
              <li
                key={post.id}
                className="card px-4 py-3 flex flex-col gap-1 mb-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {post.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-text">
                      {post.username}
                    </span>
                  </div>
                  <span className="text-xs text-text-muted">
                    @{post.display_id}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  <h2 className="text-sm font-medium text-text">
                    {post.title}
                  </h2>
                  <div className="p-4 border-border-strong border-2 rounded-md">
                    <p className="text-sm text-text-muted">{post.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Input area */}
      <div
        className="border-t border-neutral-200 bg-neutral-50 px-4 py-3"
        onBlur={(e) => {
          /**
           * If click happens outside of the current target(input area) and , then set isFocused to false
           * but if the user has typed something in either title or body, then keep the focus
           */

          if (
            !e.currentTarget.contains(e.relatedTarget) &&
            !post.trim() &&
            !title.trim()
          )
            setIsFocused(false);
        }}
      >
        <div className="max-w-md mx-auto">
          <div className="card flex flex-col px-3 py-2 gap-1 focus-within:border-border focus-within:shadow-md focus-within:shadow-black/50 transition-shadow duration-200">
            {/* Title */}
            {isFocused && (
              <textarea
                placeholder="Title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                rows={1}
                className="w-full text-sm font-medium text-text bg-transparent placeholder:text-text-muted resize-none outline-none"
              />
            )}

            <div className="h-px bg-border" />

            {/* Body */}
            <textarea
              placeholder="Start with ```(language)"
              value={post}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              ref={textareaRef}
              rows={1}
              className="w-full min-h-10 max-h-40 overflow-y-auto text-sm text-text bg-transparent placeholder:text-text-muted placeholder:text-xs resize-none outline-none"
            />
            {isFocused && (
              <div className="flex justify-end pt-1">
                <button
                  className="btn btn-primary p-2"
                  onClick={handleSend}
                  disabled={loadingPost}
                >
                  <SendIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
