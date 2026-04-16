import { useAuthContext } from "@/providers/AuthContext";
import { useLogout } from "@/features/auth/index";
import { useDeleteAccount } from "@/features/profile/index";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageLoader } from "@/shared/components/PageLoader";

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
    return <PageLoader fullHeight={true} />;
  }

  return (
    <div className="page-shell bg-neutral-50">
      <div className="page-content max-w-4xl space-y-4 md:space-y-5">
        <div className="card border border-border px-5 py-6 md:px-6 md:py-7">
          <div className="flex items-center gap-4 md:gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/15 md:h-16 md:w-16">
              <span className="text-xl font-semibold text-primary md:text-2xl">
                {nameInitial}
              </span>
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-text md:text-2xl">
                {name}
              </h1>
              <p className="mt-1 text-xs text-text-muted md:text-sm">
                @{displayId}
              </p>
            </div>
            <button
              type="button"
              className="btn ml-auto bg-error text-xs text-on-error hover:bg-error-hover md:hidden"
              onClick={async () => {
                await handleLogout();
                navigate("/login", { replace: true });
              }}
            >
              Log out
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            <div className="rounded-md border border-border bg-surface-raised px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-text-muted md:text-xs">
                Name
              </p>
              <p className="mt-1 text-sm font-medium text-text md:text-base">
                {name}
              </p>
            </div>

            <div className="rounded-md border border-border bg-surface-raised px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-text-muted md:text-xs">
                Display ID
              </p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-text md:text-base">
                  @{displayId}
                </p>
                <button
                  type="button"
                  onClick={() => void handleCopyDisplayId()}
                  className="text-xs font-medium text-primary transition-colors hover:text-primary/80 md:text-sm"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="card border border-border px-5 py-4 md:px-6 md:py-5">
          <p className="mb-3 text-xs uppercase tracking-wide text-text-muted md:text-sm">
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
