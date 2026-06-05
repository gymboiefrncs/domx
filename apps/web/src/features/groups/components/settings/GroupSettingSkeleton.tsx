import { Skeleton } from "@/components/ui/skeleton";

export const GroupSettingsSkeleton = () => {
  return (
    <div className="px-5 pt-8 space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3.5">
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
};
