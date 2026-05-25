import { useLocation, useNavigate } from "@tanstack/react-router";
import { useLogout } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, GroupIcon, UserIcon } from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";

const NAV_ITEMS = [
  { label: "Groups", href: "/groups", icon: GroupIcon },
  { label: "Profile", href: "/profile", icon: UserIcon },
];

export const Nav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { handleLogout } = useLogout();

  return (
    <nav className="nav">
      <div className="mb-6 hidden md:block">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Domx
        </p>
      </div>

      <ul className="mx-auto flex w-full max-w-lg items-center justify-center gap-2 md:max-w-none md:flex-1 md:flex-col md:items-stretch md:justify-start md:gap-1.5">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <li key={href} className="flex-1 md:flex-none">
              <Button
                variant={isActive ? "secondary" : "ghost"}
                onClick={() => navigate({ to: href })}
                className="w-full justify-center md:justify-start"
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Button>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        trigger={
          <Button
            variant="destructive"
            onClick={() => handleLogout()}
            className="mt-auto hidden w-full md:flex"
            size="lg"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </Button>
        }
        title="Log out?"
        description="You'll need to sign in again"
        onConfirm={handleLogout}
      ></ConfirmDialog>
    </nav>
  );
};
