import type { GroupCardProps } from "../types";

export function GroupCard({ group, onClick }: GroupCardProps) {
  return (
    <div
      onClick={() => onClick(group.group_id)}
      className="card flex cursor-pointer items-center gap-3 px-4 py-3.5 transition-colors hover:bg-neutral-100 md:px-5 md:py-4"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-lg md:h-12 md:w-12 md:text-xl">
        #
      </div>

      <div className="flex-1">
        <p className="mb-2 truncate text-sm font-medium text-neutral-900 md:text-base">
          {group.name}
        </p>
        <p className="text-xs capitalize text-neutral-400 md:text-sm">
          {group.member_count} {group.member_count === 1 ? "member" : "members"}
        </p>
      </div>

      {group.unread_count > 0 && (
        <span className="text-[10px] font-medium text-text md:text-xs">
          {group.unread_count}
        </span>
      )}
    </div>
  );
}
