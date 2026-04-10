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
  const { posts, loading, handleCreatePost, handleEditPost, handleDeletePost } =
    usePosts(id!);
  const { user } = useAuthContext();
  const { groups, markGroupSeen } = useGroups();
  const group = groups.find((g) => g.group_id === id);
  const [post, setPost] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editBody, setEditBody] = useState<string>("");
  const [pendingDeletePostId, setPendingDeletePostId] = useState<string | null>(
    null,
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);
  const seenGroupRef = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;
    if (seenGroupRef.current === id) return;

    seenGroupRef.current = id;
    void markGroupSeen(id);
  }, [id, markGroupSeen]);

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

  const requestDeletePost = (postId: string): void => {
    setPendingDeletePostId(postId);
  };

  const cancelDeletePost = (): void => {
    setPendingDeletePostId(null);
  };

  const confirmDeletePost = async (): Promise<void> => {
    if (!pendingDeletePostId) return;

    if (editingPostId === pendingDeletePostId) {
      cancelEditingPost();
    }

    await handleDeletePost(pendingDeletePostId);
    setPendingDeletePostId(null);
    toast.success("Post deleted");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-sm text-neutral-400">
        <SpinnerIcon className="h-4 w-4 spinner" />
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-neutral-50 md:h-full">
      {/* Header */}
      <div className="shrink-0 flex items-center border-b border-border-subtle bg-neutral-50/90 px-4 py-4 backdrop-blur-sm md:px-6 lg:px-8">
        <button onClick={() => navigate(-1)} className="mr-4 text-text">
          <span>{"<-"}</span>
        </button>
        <div>
          <h1 className="text-base font-medium text-neutral-900 md:text-lg xl:text-xl">
            {group?.name ?? "Group Chat"}
          </h1>
          <p className="mt-0.5 text-xs text-neutral-400 md:text-sm">
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
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 lg:px-8 lg:py-7">
        {posts.length === 0 ? (
          <p className="mt-10 text-center text-sm text-neutral-400 md:text-base">
            No posts yet. Be the first to post!
          </p>
        ) : (
          <div className="mx-auto w-full max-w-4xl">
            <ul>
              {posts.map((post: PostDetails, index: number) => (
                <li
                  key={post.id}
                  style={{ animationDelay: `${Math.min(index * 30, 210)}ms` }}
                  className="animate-fade-rise mb-4 flex flex-col gap-1 rounded-2xl bg-white/90 px-4 py-3 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.65)] ring-1 ring-black/5 transition-transform duration-200 hover:-translate-y-0.5 md:mb-5 md:px-5 md:py-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-xs font-bold text-primary">
                          {post.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-text md:text-base">
                        {post.username}
                      </span>
                    </div>
                    <span className="text-xs text-text-muted md:text-sm">
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
                          className="w-full resize-none rounded-lg bg-white px-3 py-2 text-sm font-medium text-text outline-none ring-1 ring-black/10 md:text-base"
                        />
                        <textarea
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          rows={6}
                          className="w-full resize-y rounded-lg bg-white p-3 text-sm text-text-muted outline-none ring-1 ring-black/10 md:text-base"
                        />
                      </>
                    ) : (
                      <>
                        <h2 className="flex items-center gap-2 text-sm font-medium text-text md:text-base">
                          <span>{post.title}</span>
                          {new Date(post.updated_at).getTime() -
                            new Date(post.created_at).getTime() >
                            1000 && (
                            <span className="text-[10px] uppercase tracking-wide text-text-muted">
                              edited
                            </span>
                          )}
                        </h2>
                        <div className="border-l-3 rounded-tl-lg rounded-bl-lg border-primary/50 pl-3 p-2 md:pl-4">
                          <div className="wrap-break-word border rounded-md max-h-72 overflow-y-auto p-2 text-sm text-text-muted md:max-h-96 md:text-base">
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
                                  <p className="mb-2 whitespace-pre-wrap text-sm text-text-muted last:mb-0 md:text-base">
                                    {children}
                                  </p>
                                ),
                                pre: ({ children }) => (
                                  <pre className="my-2 wrap-break-word overflow-x-hidden whitespace-pre-wrap rounded-lg text-xs leading-5 md:text-sm">
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
                                      className="rounded bg-neutral-200/80 px-1 py-0.5 text-xs text-neutral-900"
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

                    <div className="flex items-center justify-between pt-3">
                      <div className="flex items-center">
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
                            <>
                              <button
                                type="button"
                                onClick={() => startEditingPost(post)}
                                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors mr-3"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => requestDeletePost(post.id)}
                                className="text-xs font-medium text-error hover:text-error/80 transition-colors mr-3"
                              >
                                Delete
                              </button>
                            </>
                          )
                        )}
                      </div>

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
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      {/* Input area */}
      <div
        className="sticky bottom-0 z-10 border-t border-border-subtle bg-neutral-50/95 px-4 py-3 backdrop-blur-sm md:static"
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
        <div className="mx-auto w-full max-w-4xl">
          <div className="animate-soft-pop flex flex-col gap-1 rounded-2xl bg-white/95 px-3 py-2 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.65)] ring-1 ring-black/5 transition-all duration-200 focus-within:-translate-y-0.5 focus-within:shadow-[0_16px_30px_-20px_rgba(15,23,42,0.6)] md:px-4 md:py-3">
            {/* Title */}
            {isFocused && (
              <textarea
                placeholder="Title"
                required
                value={title}
                onKeyDown={handleKeyDown}
                onChange={(e) => setTitle(e.target.value)}
                rows={1}
                className="w-full resize-none bg-transparent text-sm font-medium text-text placeholder:text-text-muted outline-none md:text-base"
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
              className="w-full min-h-10 max-h-40 resize-none overflow-y-auto bg-transparent text-sm text-text placeholder:text-xs placeholder:text-text-muted outline-none md:max-h-48 md:text-base"
            />
            {isFocused && (
              <div className="flex justify-end pt-1">
                <button
                  className="btn btn-primary animate-soft-pop flex h-9 w-9 items-center justify-center rounded-full p-0 transition-transform duration-200 hover:scale-105 active:scale-95"
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

      {pendingDeletePostId && (
        <div className="fixed inset-0 z-400 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-lg bg-surface p-4 shadow-lg shadow-black/25 border border-border">
            <h3 className="text-sm font-semibold text-text">Delete post?</h3>
            <p className="mt-2 text-xs text-text-muted">
              This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelDeletePost}
                className="text-xs font-medium text-text-muted hover:text-text px-3 py-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDeletePost()}
                className="btn px-3 py-1 bg-error text-on-error hover:bg-error-hover"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
