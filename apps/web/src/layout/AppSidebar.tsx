"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { useModules } from "@/context/ModulesContext";
import { clearToken, getUser } from "@/lib/api";

type NavItem = {
  title: string;
  url: string;
  icon: React.ReactNode;
  superadminOnly?: boolean;
  module?: string;
};

function DashboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 3C2 2.44772 2.44772 2 3 2H8C8.55228 2 9 2.44772 9 3V8C9 8.55228 8.55228 9 8 9H3C2.44772 9 2 8.55228 2 8V3Z" fill="currentColor" fillOpacity="0.8" />
      <path d="M11 3C11 2.44772 11.4477 2 12 2H17C17.5523 2 18 2.44772 18 3V8C18 8.55228 17.5523 9 17 9H12C11.4477 9 11 8.55228 11 8V3Z" fill="currentColor" fillOpacity="0.8" />
      <path d="M2 12C2 11.4477 2.44772 11 3 11H8C8.55228 11 9 11.4477 9 12V17C9 17.5523 8.55228 18 8 18H3C2.44772 18 2 17.5523 2 17V12Z" fill="currentColor" fillOpacity="0.8" />
      <path d="M11 12C11 11.4477 11.4477 11 12 11H17C17.5523 11 18 11.4477 18 12V17C18 17.5523 17.5523 18 17 18H12C11.4477 18 11 17.5523 11 17V12Z" fill="currentColor" fillOpacity="0.8" />
    </svg>
  );
}

function ResidentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="6" r="4" fill="currentColor" fillOpacity="0.8" />
      <path d="M2 17C2 14.2386 5.58172 12 10 12C14.4183 12 18 14.2386 18 17" stroke="currentColor" strokeOpacity="0.8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 3C3 2.44772 3.44772 2 4 2H16C16.5523 2 17 2.44772 17 3V18H3V3Z" stroke="currentColor" strokeOpacity="0.8" strokeWidth="1.5" />
      <path d="M7 6H9M11 6H13M7 10H9M11 10H13M7 14H9M11 14V18H13V14" stroke="currentColor" strokeOpacity="0.8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7" cy="6" r="3" fill="currentColor" fillOpacity="0.8" />
      <path d="M1 16C1 13.7909 3.68629 12 7 12C10.3137 12 13 13.7909 13 16" stroke="currentColor" strokeOpacity="0.8" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="6" r="2.5" fill="currentColor" fillOpacity="0.5" />
      <path d="M17 14.5C18.1046 15.0523 19 15.9477 19 17" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2C5.58 2 2 5.13 2 9C2 11.07 3.03 12.93 4.67 14.22L3 18L7.97 16.04C8.62 16.18 9.3 16.25 10 16.25C14.42 16.25 18 13.12 18 9C18 5.13 14.42 2 10 2Z" stroke="currentColor" strokeOpacity="0.8" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="7" cy="9" r="1" fill="currentColor" fillOpacity="0.8" />
      <circle cx="10" cy="9" r="1" fill="currentColor" fillOpacity="0.8" />
      <circle cx="13" cy="9" r="1" fill="currentColor" fillOpacity="0.8" />
    </svg>
  );
}

function ScoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" strokeOpacity="0.8" strokeWidth="1.5" />
      <path d="M6 10H14M6 7H10M6 13H12" stroke="currentColor" strokeOpacity="0.8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function GuardianIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7.5" cy="6" r="3" fill="currentColor" fillOpacity="0.8" />
      <path d="M1 16C1 13.7909 3.96243 12 7.5 12" stroke="currentColor" strokeOpacity="0.8" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13 10L14.5 13L18 10.5L16 17H11L9 10.5L12.5 13L13 10Z" stroke="currentColor" strokeOpacity="0.8" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function DomainIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeOpacity="0.8" strokeWidth="1.5" />
      <path d="M10 2C10 2 7 6 7 10C7 14 10 18 10 18" stroke="currentColor" strokeOpacity="0.8" strokeWidth="1.5" />
      <path d="M10 2C10 2 13 6 13 10C13 14 10 18 10 18" stroke="currentColor" strokeOpacity="0.8" strokeWidth="1.5" />
      <path d="M2 10H18" stroke="currentColor" strokeOpacity="0.8" strokeWidth="1.5" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 3H4C3.44772 3 3 3.44772 3 4V16C3 16.5523 3.44772 17 4 17H7" stroke="currentColor" strokeOpacity="0.8" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13 7L17 10L13 13" stroke="currentColor" strokeOpacity="0.8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 10H7" stroke="currentColor" strokeOpacity="0.8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const navItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: <DashboardIcon /> },
  { title: "Anggota", url: "/residents", icon: <ResidentIcon />, module: "residents" },
  { title: "Tanya AI", url: "/rag", icon: <ChatIcon /> },
  { title: "Nilai", url: "/scores", icon: <ScoreIcon />, module: "scores" },
  { title: "Wali Murid", url: "/guardians", icon: <GuardianIcon />, module: "guardians" },
  { title: "Organisasi", url: "/towns", icon: <BuildingIcon />, superadminOnly: true },
  { title: "Template Domain", url: "/domain-templates", icon: <DomainIcon />, superadminOnly: true },
  { title: "Pengguna", url: "/users", icon: <UsersIcon />, superadminOnly: true },
];

export default function AppSidebar() {
  const { isExpanded, isHovered, isMobileOpen, setIsHovered } = useSidebar();
  const { isModuleEnabled } = useModules();
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser();

  const showLabel = isExpanded || isHovered || isMobileOpen;
  const visible = navItems.filter((item) => {
    if (item.superadminOnly && user?.role !== "superadmin") return false;
    if (item.module && !isModuleEnabled(item.module)) return false;
    return true;
  });

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  return (
    <aside
      className={`fixed top-0 left-0 flex flex-col h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 transition-all duration-300 ease-in-out
        ${isExpanded || isHovered ? "w-[250px]" : "w-[72px]"}
        ${isMobileOpen ? "translate-x-0 w-[250px]" : "-translate-x-full lg:translate-x-0"}
      `}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-gray-200 dark:border-gray-800 ${!showLabel ? "justify-center" : ""}`}>
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 1L1 5V17H17V5L9 1Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M6 17V11H12V17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {showLabel && (
          <div>
            <p className="font-semibold text-gray-800 dark:text-white text-sm">Townibos</p>
            {user && <p className="text-xs text-gray-400">{user.username} · {user.role}</p>}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {visible.map((item) => {
          const active = pathname.startsWith(item.url);
          return (
            <Link
              key={item.title}
              href={item.url}
              title={!showLabel ? item.title : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${!showLabel ? "justify-center" : ""}
                ${active
                  ? "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }
              `}
            >
              <span className={`flex-shrink-0 ${active ? "text-brand-500" : "text-gray-400 dark:text-gray-500"}`}>
                {item.icon}
              </span>
              {showLabel && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-3">
        <button
          onClick={handleLogout}
          title={!showLabel ? "Keluar" : undefined}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
            ${!showLabel ? "justify-center" : ""}
          `}
        >
          <span className="flex-shrink-0 text-gray-400"><LogoutIcon /></span>
          {showLabel && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  );
}
