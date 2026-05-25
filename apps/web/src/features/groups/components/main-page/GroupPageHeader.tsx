import { LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";

type Props = {
  count: number;
  onCreateClick: () => void;
  onLogoutClick: () => void;
};

export const GroupPageHeader = ({
  count,
  onCreateClick,
  onLogoutClick,
}: Props) => (
  <div className="flex items-center justify-between px-5 pt-8 pb-4 border-b border-gray-100">
    <div>
      <h1 className="text-2xl font-medium text-foreground">Groups</h1>
      <p className="text-xs text-muted-foreground mt-0.5">{count} groups</p>
    </div>
    <div className="flex gap-2">
      <Button size="icon" onClick={onCreateClick}>
        <Plus className="w-4 h-4" />
      </Button>
      <ConfirmDialog
        trigger={
          <Button size="icon" variant="destructive" className="md:hidden">
            <LogOut className="w-5 h-5" />
          </Button>
        }
        title="Log out?"
        description="You'll need to sign in again."
        onConfirm={onLogoutClick}
      />
    </div>
  </div>
);
