import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface CollapsibleCardProps extends React.HTMLAttributes<HTMLElement> {
  languageLabel?: string;
  children: React.ReactNode;
}

const COLLAPSED_HEIGHT = 300;

export const CollapsibleCard = ({
  className,
  children,
  languageLabel,
  ...props
}: CollapsibleCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsible, setIsCollapsible] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = contentRef.current;

    if (!element) return;

    const checkHeight = () => {
      const shouldCollapse = element.scrollHeight > COLLAPSED_HEIGHT;

      setIsCollapsible((prev) =>
        prev !== shouldCollapse ? shouldCollapse : prev,
      );
    };

    checkHeight();

    const observer = new ResizeObserver(checkHeight);

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="overflow-hidden shadow-inner"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-2 select-none">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700/60" />
        </div>

        {languageLabel && (
          <span className="font-mono text-[11px] uppercase tracking-wide text-zinc-400">
            {languageLabel}
          </span>
        )}
      </div>

      <div className="relative">
        <div
          className={cn(
            "transition-[max-height] duration-300 ease-out",
            isOpen ? "max-h-[1000px] overflow-auto" : "max-h-[300px]",
          )}
        >
          <div ref={contentRef} className="overflow-auto">
            <pre className="overflow-x-auto whitespace-pre text-xs leading-relaxed text-zinc-100 selection:bg-zinc-800">
              <code className={className} {...props}>
                {children}
              </code>
            </pre>
          </div>
        </div>

        {isCollapsible && !isOpen && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-24 items-end justify-center bg-linear-to-t from-zinc-950 via-zinc-950/80 to-transparent pb-3">
            <CollapsibleTrigger asChild>
              <Button
                variant="link"
                size="sm"
                className="pointer-events-auto h-7 gap-1.5 text-xs text-zinc-400 no-underline hover:text-zinc-200 hover:no-underline"
              >
                <ChevronDown className="h-3.5 w-3.5" />
                <span>Show Entire Code</span>
              </Button>
            </CollapsibleTrigger>
          </div>
        )}

        {isCollapsible && isOpen && (
          <div className="flex justify-center py-2">
            <CollapsibleTrigger asChild>
              <Button
                variant="link"
                size="sm"
                className="h-7 gap-1.5 text-xs text-zinc-400 no-underline hover:text-zinc-200 hover:no-underline"
              >
                <ChevronUp className="h-3.5 w-3.5" />
                <span>Show Less</span>
              </Button>
            </CollapsibleTrigger>
          </div>
        )}
      </div>
    </Collapsible>
  );
};
