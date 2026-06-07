// @/features/groups/components/chat/ChatMessagesSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export const ChatMessagesSkeleton = () => {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-5 w-48 px-0.5" />

        <div className="relative rounded-lg border border-border bg-zinc-950 dark:bg-zinc-900/50 overflow-hidden shadow-inner">
          <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-900 border-b border-zinc-800">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/60" />
            </div>
            <span className="text-[11px] text-zinc-400 font-mono tracking-wide uppercase">
              code
            </span>
          </div>

          <div className="p-4 space-y-2.5">
            <Skeleton className="h-3 w-[75%] bg-zinc-800 dark:bg-zinc-800" />
            <Skeleton className="h-3 w-[45%] bg-zinc-800 dark:bg-zinc-800" />
            <Skeleton className="h-3 w-[90%] bg-zinc-800 dark:bg-zinc-800" />
            <Skeleton className="h-3 w-[30%] bg-zinc-800 dark:bg-zinc-800" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Skeleton className="h-5 w-32 px-0.5" />

        <div className="relative rounded-lg border border-border bg-zinc-950 dark:bg-zinc-900/50 overflow-hidden shadow-inner">
          <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-900 border-b border-zinc-800">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700/60" />
            </div>
            <span className="text-[11px] text-zinc-400 font-mono tracking-wide uppercase">
              code
            </span>
          </div>

          <div className="p-4 space-y-2.5">
            <Skeleton className="h-3 w-[60%] bg-zinc-800 dark:bg-zinc-800" />
            <Skeleton className="h-3 w-[80%] bg-zinc-800 dark:bg-zinc-800" />
            <Skeleton className="h-3 w-[40%] bg-zinc-800 dark:bg-zinc-800" />
          </div>
        </div>
      </div>
    </div>
  );
};
