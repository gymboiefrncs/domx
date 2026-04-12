import { Link, useNavigate, useParams } from "react-router-dom";
import { usePosts } from "@/hooks/usePost";
import React, { useEffect, useRef, useState } from "react";
import { SettingsIcon } from "@/assets/icons";
import type { PostDetails } from "@domx/shared";
import { useGroups } from "@/hooks/useGroups";
import { toast } from "sonner";
import { useAuthContext } from "@/context/AuthContext";
import { PostCard } from "@/components/chat/PostCard";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { DeletePostModal } from "@/components/chat/DeletePostModal";
import { PageLoader } from "@/components/common/PageLoader";
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
    return <PageLoader fullHeight={true} />;
  }

  return (
    <div className="flex h-dvh min-w-0 flex-col overflow-x-hidden bg-neutral-50 md:h-full">
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

      <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-5 md:px-6 md:py-6 lg:px-8 lg:py-7">
        {posts.length === 0 ? (
          <p className="mt-10 text-center text-sm text-neutral-400 md:text-base">
            No posts yet. Be the first to post!
          </p>
        ) : (
          <div className="mx-auto w-full min-w-0 max-w-4xl">
            <ul className="min-w-0">
              {posts.map((post: PostDetails, index: number) => (
                <PostCard
                  key={post.id}
                  post={post}
                  index={index}
                  isOwner={
                    group?.role === "admin" ||
                    user?.display_id === post.display_id
                  }
                  isEditing={editingPostId === post.id}
                  editTitle={editTitle}
                  editBody={editBody}
                  onEditTitleChange={setEditTitle}
                  onEditBodyChange={setEditBody}
                  onStartEdit={startEditingPost}
                  onCancelEdit={cancelEditingPost}
                  onSaveEdit={() => void saveEditedPost()}
                  onRequestDelete={requestDeletePost}
                  onCopyBody={(body) => void handleCopyBody(body)}
                />
              ))}
            </ul>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <ChatComposer
        post={post}
        title={title}
        isFocused={isFocused}
        loading={loading}
        textareaRef={textareaRef}
        onPostChange={handleChange}
        onTitleChange={setTitle}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlurArea={(e) => {
          if (
            !e.currentTarget.contains(e.relatedTarget) &&
            !post.trim() &&
            !title.trim()
          ) {
            setIsFocused(false);
          }
        }}
        onSend={handleSend}
      />

      <DeletePostModal
        open={Boolean(pendingDeletePostId)}
        onCancel={cancelDeletePost}
        onConfirm={() => void confirmDeletePost()}
      />
    </div>
  );
};
