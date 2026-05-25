import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const NotFoundPage = () => (
  <div className="flex h-screen flex-col items-center justify-center px-6 text-center bg-background">
    <h1 className="text-8xl font-black tracking-tighter text-muted-foreground/20 md:text-9xl">
      404
    </h1>
    <h2 className="mt-4 text-lg font-medium text-foreground md:text-xl">
      You've reached the end of the internet.
    </h2>
    <p className="mt-2 mb-8 text-sm text-muted-foreground max-w-sm">
      Our developers are currently arguing over whose fault this is. It's
      probably Dave's.
    </p>
    <Button asChild>
      <Link to="/groups">Go home</Link>
    </Button>
  </div>
);
