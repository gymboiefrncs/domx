import type { PostDetails } from "@domx/shared";
import { MarkdownBody } from "./markdownComponents";

type PostCardProps = {
  post: PostDetails;
  index: number;
  isOwner: boolean;
  isEditing: boolean;
  editTitle: string;
  editBody: string;
  onEditTitleChange: (value: string) => void;
  onEditBodyChange: (value: string) => void;
  onStartEdit: (post: PostDetails) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onRequestDelete: (postId: string) => void;
  onCopyBody: (body: string) => void;
};

export const PostCard = ({
  post,
  index,
  isOwner,
  isEditing,
  editTitle,
  editBody,
  onEditTitleChange,
  onEditBodyChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRequestDelete,
  onCopyBody,
}: PostCardProps) => (
  <li
    style={{ animationDelay: `${Math.min(index * 30, 210)}ms` }}
    className="animate-fade-rise mb-4 flex min-w-0 flex-col gap-1 rounded-2xl bg-white/90 px-4 py-3 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.65)] ring-1 ring-black/5 transition-transform duration-200 hover:-translate-y-0.5 md:mb-5 md:px-5 md:py-4"
  >
    <div className="flex min-w-0 items-center justify-between border-b border-border-subtle pb-3">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <span className="text-xs font-bold text-primary">
            {post.username.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="truncate text-sm font-medium text-text md:text-base">
          {post.username}
        </span>
      </div>
      <span className="ml-2 shrink-0 text-xs text-text-muted md:text-sm">
        @{post.display_id}
      </span>
    </div>

    <div className="flex flex-col gap-3">
      {isEditing ? (
        <>
          <textarea
            value={editTitle}
            onChange={(e) => onEditTitleChange(e.target.value)}
            rows={1}
            className="w-full resize-none rounded-lg bg-white px-3 py-2 text-sm font-medium text-text outline-none ring-1 ring-black/10 md:text-base"
          />
          <textarea
            value={editBody}
            onChange={(e) => onEditBodyChange(e.target.value)}
            rows={6}
            className="w-full resize-y rounded-lg bg-white p-3 text-sm text-text-muted outline-none ring-1 ring-black/10 md:text-base"
          />
        </>
      ) : (
        <>
          <h2 className="flex min-w-0 items-center gap-2 text-sm font-medium text-text md:text-base">
            <span className="wrap-break-word min-w-0">{post.title}</span>
            {new Date(post.updated_at).getTime() -
              new Date(post.created_at).getTime() >
              1000 && (
              <span className="text-[10px] uppercase tracking-wide text-text-muted">
                edited
              </span>
            )}
          </h2>

          <div className="border-l-3 min-w-0 overflow-x-hidden rounded-bl-lg rounded-tl-lg border-primary/50 p-2 pl-3 md:pl-4">
            <div className="wrap-break-word max-h-72 w-full min-w-0 max-w-full overflow-x-auto overflow-y-auto rounded-md border p-2 text-sm text-text-muted md:max-h-96  md:text-base">
              <MarkdownBody body={post.body} />
            </div>
          </div>
        </>
      )}

      <div className="flex items-center justify-between pt-3">
        <div className="flex items-center">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={onCancelEdit}
                className="mr-3 text-xs font-medium text-text-muted transition-colors hover:text-text"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSaveEdit}
                className="mr-3 text-xs font-medium text-primary transition-colors hover:text-primary/80"
              >
                Save
              </button>
            </>
          ) : (
            isOwner && (
              <>
                <button
                  type="button"
                  onClick={() => onStartEdit(post)}
                  className="mr-3 text-xs font-medium text-primary transition-colors hover:text-primary/80"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onRequestDelete(post.id)}
                  className="mr-3 text-xs font-medium text-error transition-colors hover:text-error/80"
                >
                  Delete
                </button>
              </>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => onCopyBody(post.body)}
          className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
        >
          Copy
        </button>
      </div>
    </div>
  </li>
);
