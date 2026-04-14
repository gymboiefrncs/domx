type DeletePostModalProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export const DeletePostModal = ({
  open,
  onCancel,
  onConfirm,
}: DeletePostModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-400 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-4 shadow-lg shadow-black/25">
        <h3 className="text-sm font-semibold text-text">Delete post?</h3>
        <p className="mt-2 text-xs text-text-muted">
          This action cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1 text-xs font-medium text-text-muted hover:text-text"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn bg-error px-3 py-1 text-on-error hover:bg-error-hover"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
