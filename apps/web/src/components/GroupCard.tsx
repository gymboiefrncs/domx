import type { GroupCardProps } from "@/shared";

export function GroupCard({ group, onClick }: GroupCardProps) {
  return (
    <div
      onClick={() => onClick(group.group_id)}
      className="flex items-center gap-3 card px-4 py-3.5 cursor-pointer hover:bg-neutral-100 transition-colors"
    >
      <div className="w-11 h-11 rounded-xl bg-neutral-100 flex items-center justify-center text-lg shrink-0">
        #
      </div>

      <div className="flex-1">
        <p className="text-sm font-medium text-neutral-900 truncate mb-2">
          {group.name}
        </p>
        <p className="text-xs text-neutral-400 capitalize">
          {group.member_count} {group.member_count === 1 ? "member" : "members"}
        </p>
      </div>

      {group.unread_count > 0 ? (
        <div className="w-5 h-5 rounded-full bg-neutral-900 flex items-center justify-center">
          <span className="text-[10px] font-medium text-text">
            {group.unread_count}
          </span>
        </div>
      ) : (
        <span className="text-[11px] font-medium text-text-muted">
          No new messages
        </span>
      )}
    </div>
  );
}
