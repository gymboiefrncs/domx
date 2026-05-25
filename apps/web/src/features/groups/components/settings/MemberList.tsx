type Props = { username: string; displayId: string };

export const MemberListItem = ({ username, displayId }: Props) => (
  <li className="flex items-center gap-3 px-3 py-3.5">
    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
      {username.slice(0, 2).toUpperCase()}
    </div>
    <p className="text-sm font-medium text-foreground">{username}</p>
    <p className="text-xs text-muted-foreground">({displayId})</p>
  </li>
);
