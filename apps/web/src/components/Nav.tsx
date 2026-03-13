import { useState } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: React.FC<{ active: boolean }>;
};

const GroupsIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Three overlapping person silhouettes */}
    <circle
      cx="7"
      cy="6"
      r="2.5"
      stroke="currentColor"
      strokeWidth="1.5"
      fill={active ? "currentColor" : "none"}
      strokeLinecap="round"
    />
    <path
      d="M2 15c0-2.761 2.239-5 5-5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M12 15c0-2.761-2.239-5-5-5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle
      cx="13"
      cy="6"
      r="2.5"
      stroke="currentColor"
      strokeWidth="1.5"
      fill={active ? "currentColor" : "none"}
      strokeLinecap="round"
    />
    <path
      d="M13 10c2.761 0 5 2.239 5 5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const SavedIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 3h10a1 1 0 0 1 1 1v12.382a.5.5 0 0 1-.724.447L10 14.118l-5.276 2.711A.5.5 0 0 1 4 16.382V4a1 1 0 0 1 1-1z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      fill={active ? "currentColor" : "none"}
    />
  </svg>
);

const ProfileIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="10"
      cy="7"
      r="3"
      stroke="currentColor"
      strokeWidth="1.5"
      fill={active ? "currentColor" : "none"}
    />
    <path
      d="M3 17c0-3.866 3.134-7 7-7s7 3.134 7 7"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const SettingsIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="10"
      cy="10"
      r="2.5"
      stroke="currentColor"
      strokeWidth="1.5"
      fill={active ? "currentColor" : "none"}
    />
    <path
      d="M10 2v1.5M10 16.5V18M18 10h-1.5M3.5 10H2M15.657 4.343l-1.06 1.06M5.404 14.596l-1.06 1.06M15.657 15.657l-1.06-1.06M5.404 5.404l-1.06-1.06"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  { label: "Groups", href: "/groups", icon: GroupsIcon },
  { label: "Saved", href: "/saved", icon: SavedIcon },
  { label: "Profile", href: "/profile", icon: ProfileIcon },
  { label: "Settings", href: "/settings", icon: SettingsIcon },
];

export const Nav = () => {
  const [active, setActive] = useState("/groups");

  return (
    <nav className="flex bg-black/75 px-4 py-2 shrink-0">
      {/* Nav links */}
      <ul className="flex gap-8 w-full justify-center">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = active === href;
          return (
            <li key={href}>
              <button
                onClick={() => setActive(href)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm
                  transition-colors duration-150 cursor-pointer
                  ${
                    isActive
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
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
