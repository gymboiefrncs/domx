import { Button } from "@/components/ui/button";
import { LogOut, TrashIcon } from "lucide-react";

type Props = { onLeave: () => void; onDelete: () => void };

export const GroupDangerZone = ({ onLeave, onDelete }: Props) => (
  <div className="px-5 py-4 border-t border-border space-y-2">
    <Button
      variant="outline"
      className="w-full text-destructive border-destructive/40 hover:bg-destructive/10"
      onClick={onLeave}
    >
      <LogOut className="w-4 h-4" />
      Leave Group
    </Button>
    <Button variant="destructive" className="w-full" onClick={onDelete}>
      <TrashIcon className="w-4 h-4" />
      Delete Group
    </Button>
  </div>
);
