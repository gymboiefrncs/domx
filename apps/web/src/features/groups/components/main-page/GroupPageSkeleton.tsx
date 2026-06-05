import { Skeleton } from "@/components/ui/skeleton";

export const GroupPageSkeleton = () => {
  return (
    <div className="px-5 pt-8 space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3.5">
          <Skeleton className="w-11 h-11 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
};
