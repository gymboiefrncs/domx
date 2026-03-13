export interface Group {
  group_id: string;
  name: string;
  role: string;
  unread_count: number;
}

interface GroupCardProps {
  group: Group;
  onClick: (groupId: string) => void;
}

export function GroupCard({ group, onClick }: GroupCardProps) {
  return (
    <div
      onClick={() => onClick(group.group_id)}
      className="flex items-center gap-3 bg-white border border-neutral-100 rounded-2xl px-4 py-3.5 cursor-pointer transition-colors"
    >
      <div className="w-11 h-11 rounded-xl bg-neutral-100 flex items-center justify-center text-lg shrink-0">
        ⌗
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 truncate">
          {group.name}
        </p>
        <p className="text-xs text-neutral-400 mt-0.5">{group.role}</p>
      </div>
      {group.unread_count > 0 && (
        <div className="w-5 h-5 rounded-full bg-neutral-900 flex items-center justify-center shrink-0">
          <span className="text-[10px] font-medium text-white">
            {group.unread_count}
          </span>
        </div>
      )}
    </div>
  );
}
