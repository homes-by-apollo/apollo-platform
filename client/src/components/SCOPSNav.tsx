import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";

const OWL_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/apollo-logo-white_48c145a3.png";

// Nav section → page key mapping
// "built" pages have a real route; "soon" pages show a toast
type NavSection = {
  label: string;
  key: string;
  path?: string;
  soon?: boolean;
  // sub-items for dropdown sections (future)
};

const NAV_SECTIONS: NavSection[] = [
  { label: "Dashboard",   key: "dashboard",   path: "/scops" },
  { label: "Pipeline",    key: "scheduling",  path: "/scops/scheduling" },
  { label: "Inventory",   key: "properties",  path: "/scops/properties" },
  { label: "Marketing",   key: "utm-builder", path: "/scops/utm-builder" },
  { label: "Content",     key: "blog",        path: "/scops/blog" },
  { label: "Operations",  key: "operations",  soon: true },
  { label: "Admin",       key: "admin",       path: "/scops/users" },
];

// Which nav label is "active" given the currentPage prop
const PAGE_TO_SECTION: Record<string, string> = {
  dashboard:   "dashboard",
  scheduling:  "Pipeline",
  properties:  "Inventory",
  "utm-builder": "Marketing",
  blog:        "Content",
  users:       "Admin",
};

interface SCOPSNavProps {
  adminUser: { name: string };
  currentPage?: "dashboard" | "properties" | "blog" | "users" | "utm-builder" | "scheduling";
}

export default function SCOPSNav({ adminUser, currentPage }: SCOPSNavProps) {
  const [, setLocation] = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const logoutMutation = trpc.adminAuth.logout.useMutation({
    onSuccess: () => { window.location.href = "/admin-login"; },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const activeSection = currentPage ? PAGE_TO_SECTION[currentPage] : "";

  // First name only for the user button
  const firstName = adminUser.name?.split(" ")[0] ?? adminUser.name ?? "User";

  return (
    <div
      className="bg-[#0f2044] text-white flex items-center justify-between border-b border-white/10"
      style={{ minHeight: 52, paddingLeft: 16, paddingRight: 16 }}
    >
      {/* ── Left: Logo + Nav sections ── */}
      <div className="flex items-center gap-0 min-w-0">
        {/* Owl logo → back to public site */}
        <button
          onClick={() => window.location.href = "/"}
          className="flex items-center gap-2 pr-4 border-r border-white/20 mr-4 h-[52px] hover:opacity-80 transition-opacity flex-shrink-0"
          title="Back to Apollo Site"
        >
          <img src={OWL_LOGO} alt="Apollo Owl" style={{ height: 30, width: 30, objectFit: "contain" }} />
        </button>

        {/* Nav items */}
        <nav className="flex items-center gap-0.5">
          {NAV_SECTIONS.map((section) => {
            const isActive =
              activeSection === section.label ||
              activeSection === section.key ||
              (currentPage === section.key);

            return (
              <button
                key={section.key}
                onClick={() => {
                  if (section.soon) {
                    toast.info(`${section.label} — coming soon`);
                    return;
                  }
                  if (section.path) setLocation(section.path);
                }}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-white/15 text-white"
                    : section.soon
                    ? "text-white/30 cursor-default"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
                title={section.soon ? "Coming soon" : undefined}
              >
                {section.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Right: User dropdown ── */}
      <div className="relative flex-shrink-0 ml-4" ref={menuRef}>
        <button
          onClick={() => setUserMenuOpen(prev => !prev)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {firstName.charAt(0).toUpperCase()}
          </div>
          <span>{firstName}</span>
          {/* Chevron */}
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            className={`transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Dropdown */}
        {userMenuOpen && (
          <div
            className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50"
            style={{ minWidth: 160 }}
          >
            <div className="px-4 py-2 border-b border-gray-100">
              <div className="text-xs font-semibold text-[#0f2044] truncate">{adminUser.name}</div>
              <div className="text-xs text-gray-400">SCOPS Admin</div>
            </div>
            <button
              onClick={() => { setUserMenuOpen(false); setLocation("/scops"); }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={() => { window.location.href = "/"; }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              View Public Site
            </button>
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={() => { setUserMenuOpen(false); logoutMutation.mutate(); }}
                disabled={logoutMutation.isPending}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                {logoutMutation.isPending ? "Signing out…" : "Sign Out"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
