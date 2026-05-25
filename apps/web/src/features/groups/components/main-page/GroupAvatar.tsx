const colors = [
  "bg-emerald-500/10 text-emerald-600",
  "bg-violet-500/10 text-violet-600",
  "bg-orange-500/10 text-orange-600",
  "bg-amber-500/10 text-amber-600",
];

export const getInitials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

type Props = { name: string; index: number };

export const GroupAvatar = ({ name, index }: Props) => (
  <div
    className={`w-11 h-11 rounded-lg flex items-center justify-center text-xs font-medium shrink-0 ${colors[index % colors.length]}`}
  >
    {getInitials(name)}
  </div>
);
