import { useLocation, useNavigate } from "react-router-dom";
import { GroupsIcon, ProfileIcon } from "@/assets/icons";

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

  return (
    <nav className="flex bg-surface border-t border-border-subtle p-4">
      {/* Nav links */}
      <ul className="flex gap-12 w-full justify-center">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <li key={href}>
              <button
                onClick={() => navigate(href)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm
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
                <span className="hidden font-medium">{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
