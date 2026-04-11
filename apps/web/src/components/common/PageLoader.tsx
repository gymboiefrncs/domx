import { SpinnerIcon } from "@/assets/icons";

type PageLoaderProps = {
  fullHeight?: boolean;
};

export const PageLoader = ({ fullHeight = true }: PageLoaderProps) => {
  return (
    <div
      className={`flex items-center justify-center text-sm text-neutral-400 ${
        fullHeight ? "h-screen" : "h-full"
      }`}
    >
      <SpinnerIcon className="h-4 w-4 spinner" />
    </div>
  );
};
