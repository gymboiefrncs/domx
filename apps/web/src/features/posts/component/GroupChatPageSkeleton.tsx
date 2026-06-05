import { Skeleton } from "@/components/ui/skeleton";

export const GroupChatSkeleton = () => {
  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex h-16 items-center justify-between border-b border-border px-5">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-9 w-24" />
      </header>

      <div className="flex-1" />

      <div className="p-4 border-t border-border">
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
};
