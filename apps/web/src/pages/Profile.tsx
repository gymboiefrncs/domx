import { useAuthContext } from "@/context/AuthContext";
import { useLogout } from "@/hooks/useAuth";
import { useDeleteAccount } from "@/hooks/useProfile";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SpinnerIcon } from "@/assets/icons";
import { toast } from "sonner";

export const ProfilePage = () => {
  const { user, loading } = useAuthContext();
  const { loadingLogout, handleLogout } = useLogout();
  const { loadingDeleteAccount, handleDeleteAccount } = useDeleteAccount();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const name = user?.username ?? "Unknown";
  const displayId = user?.display_id ?? "-";
  const nameInitial = name.charAt(0).toUpperCase();

  const handleCopyDisplayId = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(displayId);
      toast.success("Display ID copied");
    } catch {
      toast.error("Failed to copy display ID");
    }
  };

  if (loading || loadingLogout) {
    return (
      <div className="flex items-center justify-center h-screen text-sm text-neutral-400">
        <SpinnerIcon className="h-4 w-4 spinner" />
      </div>
    );
  }

  return (
    <div className="h-full bg-neutral-50 px-4 py-8">
      <div className="max-w-md mx-auto space-y-4">
        <div className="card border border-border px-5 py-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xl font-semibold text-primary">
                {nameInitial}
              </span>
            </div>

            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-text truncate">
                {name}
              </h1>
              <p className="text-xs text-text-muted mt-1">@{displayId}</p>
            </div>
            <button
              type="button"
              className="btn ml-auto text-xs bg-error text-on-error hover:bg-error-hover"
              onClick={async () => {
                await handleLogout();
                navigate("/login", { replace: true });
              }}
            >
              Log out
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <div className="rounded-md border border-border bg-surface-raised px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-text-muted">
                Name
              </p>
              <p className="text-sm font-medium text-text mt-1">{name}</p>
            </div>

            <div className="rounded-md border border-border bg-surface-raised px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-text-muted">
                Display ID
              </p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-text">@{displayId}</p>
                <button
                  type="button"
                  onClick={() => void handleCopyDisplayId()}
                  className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="card border border-border px-5 py-4">
          <p className="text-xs uppercase tracking-wide text-text-muted mb-3">
            Account Actions
          </p>

          <div className="flex flex-col items-center justify-between gap-2">
            <button
              type="button"
              className="btn w-full text-on-error bg-error hover:text-error/80 transition-colors"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete account
            </button>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-400 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-lg bg-surface p-4 shadow-lg shadow-black/25 border border-border">
            <h3 className="text-sm font-semibold text-text">Delete account?</h3>
            <p className="mt-2 text-xs text-text-muted">
              This will permanently remove your account and cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="text-xs font-medium text-text-muted hover:text-text px-3 py-1"
                disabled={loadingDeleteAccount}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleDeleteAccount();
                  setShowDeleteModal(false);
                }}
                className="btn px-3 py-1 bg-error text-on-error hover:bg-error-hover"
                disabled={loadingDeleteAccount}
              >
                {loadingDeleteAccount ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
