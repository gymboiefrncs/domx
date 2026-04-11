import { useLocation, useNavigate } from "react-router-dom";
import { GroupsIcon, ProfileIcon } from "@/assets/icons";
import { useLogout } from "@/hooks/useAuth";

type NavItem = {
  label: string;
  href: string;
  icon: React.FC<{ active: boolean }>;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Groups", href: "/groups", icon: GroupsIcon },
  { label: "Profile", href: "/profile", icon: ProfileIcon },
];

export const Nav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { loadingLogout, handleLogout } = useLogout();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-sticky border-t border-border-subtle bg-surface px-3 py-2 md:static md:flex md:h-full md:flex-col md:border-r md:border-t-0 md:px-4 md:py-6 lg:px-5">
      <div className="mb-6 hidden md:block">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
          Domx
        </p>
      </div>
      <ul className="mx-auto flex w-full max-w-lg items-center justify-center gap-2 md:max-w-none md:flex-1 md:flex-col md:items-stretch md:justify-start md:gap-1.5">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <li key={href} className="flex-1 md:flex-none">
              <button
                onClick={() => navigate(href)}
                className={`
                  flex w-full items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm md:justify-start md:px-3.5 md:py-3 md:text-base
                  transition-colors duration-150 cursor-pointer
                  ${
                    isActive
                      ? "bg-primary-subtle text-primary"
                      : "text-text-muted hover:text-text"
                  }
                `}
              >
                {/* Icon */}
                <span className="shrink-0">
                  <Icon active={isActive} />
                </span>

                {/* Label */}
                <span className="font-medium">{label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        className="mt-auto hidden w-full rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm font-medium text-error transition-colors hover:bg-error/15 md:block"
        onClick={async () => {
          await handleLogout();
          navigate("/login", { replace: true });
        }}
        disabled={loadingLogout}
      >
        {loadingLogout ? "Logging out..." : "Log out"}
      </button>
    </nav>
  );
};
