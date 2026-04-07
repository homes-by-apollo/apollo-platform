import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";

const OWL_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/apollo-logo-white_48c145a3.png";

type NavSection = {
  label: string;
  key: string;
  path?: string;
  soon?: boolean;
};

const NAV_SECTIONS: NavSection[] = [
  { label: "Dashboard",   key: "dashboard",   path: "/scops" },
  { label: "Pipeline",    key: "scheduling",  path: "/scops/scheduling" },
  { label: "Inventory",   key: "properties",  path: "/scops/properties" },
  { label: "Marketing",   key: "utm-builder", path: "/scops/utm-builder" },
  { label: "Content",     key: "blog",        path: "/scops/blog" },
  { label: "Settings",     key: "settings",    path: "/scops/settings" },
];

const PAGE_TO_SECTION: Record<string, string> = {
  dashboard:     "dashboard",
  scheduling:    "Pipeline",
  properties:    "Inventory",
  "utm-builder": "Marketing",
  blog:          "Content",
  users:         "Admin",
  settings:      "Settings",
};

interface SCOPSNavProps {
  adminUser: { name: string; adminRole?: string | null };
  currentPage?: "dashboard" | "properties" | "blog" | "users" | "utm-builder" | "scheduling" | "settings";
}

function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const time = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const date = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  return (
    <div className="flex items-center gap-2 select-none">
          <span className="text-[15px] font-semibold tabular-nums tracking-tight" style={{ color: "rgba(255,255,255,0.90)" }}>{time}</span>
          <span className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.50)" }}>{date}</span>
    </div>
  );
}

export default function SCOPSNav({ adminUser, currentPage }: SCOPSNavProps) {
  const [, setLocation] = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const logoutMutation = trpc.adminAuth.logout.useMutation({
    onSuccess: () => { window.location.href = "/admin-login"; },
  });

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
  const firstName = adminUser.name?.split(" ")[0] ?? adminUser.name ?? "User";
  const role = adminUser.adminRole ?? "admin";

  // Role-gated nav: sales can't see Marketing/Content; marketing can't see Pipeline/Scheduling
  const visibleSections = NAV_SECTIONS.filter(s => {
    if (role === "sales" && (s.key === "utm-builder" || s.key === "blog")) return false;
    if (role === "marketing" && (s.key === "scheduling")) return false;
    return true;
  });

  return (
    <div
      className="flex items-center justify-between border-b"
      style={{
        minHeight: 64,
        paddingLeft: 20,
        paddingRight: 20,
        background: "rgba(20, 20, 30, 0.55)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 1px 0 rgba(0, 0, 0, 0.30)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* ── Left: Clock + Logo ── */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <LiveClock />
        <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.15)" }} />
        <button
          onClick={() => window.location.href = "/"}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          title="Back to Apollo Site"
        >
          <img src={OWL_LOGO} alt="Apollo Owl" style={{ height: 28, width: 28, objectFit: "contain" }} />
        </button>
      </div>

      {/* ── Center: Nav tabs ── */}
      <nav className="flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
        {visibleSections.map((section) => {
          const isActive =
            activeSection === section.label ||
            activeSection === section.key ||
            currentPage === section.key;

          return (
            <button
              key={section.key}
              onClick={() => {
                if (section.soon) { toast.info(`${section.label} — coming soon`); return; }
                if (section.path) setLocation(section.path);
              }}
              className="relative px-3.5 py-1.5 rounded-lg text-[17px] font-medium transition-all whitespace-nowrap"
              style={{
                color: isActive ? "rgba(255,255,255,0.95)" : section.soon ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.60)",
                background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
                border: "1px solid transparent",
                borderColor: isActive ? "rgba(255,255,255,0.25)" : "transparent",
                backdropFilter: isActive ? "blur(12px)" : "none",
                cursor: section.soon ? "default" : "pointer",
                boxShadow: isActive ? "0 2px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.20)" : "none",
                fontWeight: isActive ? 600 : 500,
                paddingBottom: "calc(0.375rem + 4px)",
              }}
              title={section.soon ? "Coming soon" : undefined}
            >
              {section.label}
              {/* Amber underline — absolute, below pill, full-width */}
              {isActive && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: "10%",
                    width: "80%",
                    height: 2,
                    borderRadius: 2,
                    background: "#e8a020",
                    boxShadow: "0 0 6px rgba(232,160,32,0.60)",
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Right: User dropdown ── */}
      <div className="relative flex-shrink-0" ref={menuRef}>
        <button
          onClick={() => setUserMenuOpen(prev => !prev)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all"
          style={{
            background: userMenuOpen ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.25)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 2px 8px rgba(100,130,200,0.12)",
          }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #4a90d9 0%, #2563eb 100%)" }}
          >
            {firstName.charAt(0).toUpperCase()}
          </div>
          <span className="text-[15px] font-medium" style={{ color: "rgba(255,255,255,0.90)" }}>{firstName}</span>
          <svg
            width="10" height="10" viewBox="0 0 12 12" fill="none"
            className={`transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {userMenuOpen && (
          <div
            className="absolute right-0 top-full mt-2 w-48 rounded-2xl shadow-2xl border py-1 z-50"
            style={{
              background: "rgba(255,255,255,0.88)",
              backdropFilter: "blur(28px) saturate(180%)",
              WebkitBackdropFilter: "blur(28px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.85)",
              boxShadow: "0 8px 32px rgba(100,130,200,0.18)",
            }}
          >
            <div className="px-4 py-2.5 border-b border-gray-100">
              <div className="text-xs font-bold text-[#0f2044] truncate">{adminUser.name}</div>
              <div className="text-[11px] text-gray-400">SCOPS Admin</div>
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
            {/* Admin Controls section */}
            <div className="border-t border-gray-100 mt-1 pt-1">
              <div className="px-4 py-1.5">
                <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "rgba(15,32,68,0.35)" }}>Admin Controls</span>
              </div>
              <button
                onClick={() => { setUserMenuOpen(false); setLocation("/scops/users"); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Manage Users
              </button>
            </div>
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
