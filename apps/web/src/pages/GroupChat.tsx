import { Link, useNavigate, useParams } from "react-router-dom";
import { usePosts } from "@/hooks/usePost";
import React, { useEffect, useRef, useState } from "react";
import { SpinnerIcon, SendIcon, SettingsIcon } from "@/assets/icons";
import type { PostDetails } from "@domx/shared";
import { useGroups } from "@/hooks/useGroups";
import { toast } from "sonner";
import { useAuthContext } from "@/context/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";

export const GroupChatPage = () => {
  const { id } = useParams();
  const { posts, loading, handleCreatePost, handleEditPost } = usePosts(id!);
  const { user } = useAuthContext();
  const { groups } = useGroups();
  const group = groups.find((g) => g.group_id === id);
  const [post, setPost] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editBody, setEditBody] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [posts]);

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

  const handleCopyBody = async (body: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(body);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy post body");
    }
  };

  const startEditingPost = (selectedPost: PostDetails): void => {
    setEditingPostId(selectedPost.id);
    setEditTitle(selectedPost.title);
    setEditBody(selectedPost.body);
  };

  const cancelEditingPost = (): void => {
    setEditingPostId(null);
    setEditTitle("");
    setEditBody("");
  };

  const saveEditedPost = async (): Promise<void> => {
    if (!editingPostId) return;
    if (!editTitle.trim() || !editBody.trim()) {
      toast.error("Title and body are required");
      return;
    }

    await handleEditPost(editingPostId, editBody.trim(), editTitle.trim());
    cancelEditingPost();
    toast.success("Post update sent");
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
                  {editingPostId === post.id ? (
                    <>
                      <textarea
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        rows={1}
                        className="w-full text-sm font-medium text-text bg-transparent border border-border rounded-md p-2 resize-none outline-none"
                      />
                      <div className="p-4 border-border-strong border-2 rounded-md">
                        <textarea
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          rows={6}
                          className="w-full text-sm text-text-muted bg-transparent resize-y outline-none"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-sm font-medium text-text flex items-center gap-2">
                        <span>{post.title}</span>
                        {new Date(post.updated_at).getTime() -
                          new Date(post.created_at).getTime() >
                          1000 && (
                          <span className="text-[10px] uppercase tracking-wide text-text-muted">
                            edited
                          </span>
                        )}
                      </h2>
                      <div className="p-4 border-border-strong border-2 rounded-md">
                        <div className="text-sm text-text-muted wrap-break-word max-h-72 overflow-y-auto pr-1">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[
                              [
                                rehypeHighlight,
                                { detect: true, ignoreMissing: true },
                              ],
                            ]}
                            components={{
                              p: ({ children }) => (
                                <p className="text-sm text-text-muted whitespace-pre-wrap mb-2 last:mb-0">
                                  {children}
                                </p>
                              ),
                              pre: ({ children }) => (
                                <pre className="rounded-md overflow-x-hidden border border-border bg-neutral-100 text-xs leading-5 my-2 p-3 whitespace-pre-wrap wrap-break-word">
                                  {children}
                                </pre>
                              ),
                              code: ({ className, children, ...props }) => {
                                const isBlock = Boolean(
                                  className?.includes("language-"),
                                );
                                if (isBlock) {
                                  return (
                                    <code
                                      className={`${className} block whitespace-pre-wrap wrap-break-word`}
                                      {...props}
                                    >
                                      {children}
                                    </code>
                                  );
                                }

                                return (
                                  <code
                                    className="rounded bg-neutral-200 px-1 py-0.5 text-xs text-neutral-900"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                );
                              },
                            }}
                          >
                            {post.body}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex justify-end pt-3">
                    {editingPostId === post.id ? (
                      <>
                        <button
                          type="button"
                          onClick={cancelEditingPost}
                          className="text-xs font-medium text-text-muted hover:text-text transition-colors mr-3"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => void saveEditedPost()}
                          className="text-xs font-medium text-primary hover:text-primary/80 transition-colors mr-3"
                        >
                          Save
                        </button>
                      </>
                    ) : (
                      user?.display_id === post.display_id && (
                        <button
                          type="button"
                          onClick={() => startEditingPost(post)}
                          className="text-xs font-medium text-primary hover:text-primary/80 transition-colors mr-3"
                        >
                          Edit
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={() => handleCopyBody(post.body)}
                      className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div ref={bottomRef} />
      </div>
      {/* Input area */}
      <div
        className="border-t border-neutral-200 bg-neutral-50 px-4 py-3"
        onBlur={(e) => {
          /**
           * If click happens outside of the current target(input area) and post/title is empty, then set isFocused to false
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
                onKeyDown={handleKeyDown}
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
                  disabled={loading}
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
