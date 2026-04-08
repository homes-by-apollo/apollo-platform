import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";

const HOMES_BY_APOLLO_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/homes-by-apollo-logo_2ad1dfe7.png";

type NavSection = {
  label: string;
  key: string;
  path?: string;
  soon?: boolean;
};

// Main nav tabs — Settings removed, lives in profile dropdown now
const NAV_SECTIONS: NavSection[] = [
  { label: "Dashboard",  key: "dashboard",   path: "/scops" },
  { label: "Pipeline",   key: "scheduling",  path: "/scops/scheduling" },
  { label: "Inventory",  key: "properties",  path: "/scops/properties" },
  { label: "Campaigns",  key: "campaigns",   path: "/scops/campaigns" },
  { label: "Engine",     key: "engine",      path: "/scops/engine" },
];

const PAGE_TO_SECTION: Record<string, string> = {
  dashboard:     "dashboard",
  scheduling:    "Pipeline",
  pipeline:      "scheduling",
  properties:    "Inventory",
  "utm-builder": "Campaigns",
  campaigns:     "Campaigns",
  engine:        "engine",
  users:         "Admin",
  settings:      "Settings",
};

interface SCOPSNavProps {
  adminUser: { name: string; adminRole?: string | null };
  currentPage?: "dashboard" | "properties" | "users" | "utm-builder" | "campaigns" | "scheduling" | "settings" | "engine" | "email" | "pipeline";
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
    <div className="hidden lg:flex items-center gap-2.5 select-none">
      <span className="text-[20px] font-semibold tabular-nums tracking-tight text-gray-900">{time}</span>
      <span className="text-[15px] font-medium text-gray-400">{date}</span>
    </div>
  );
}

// Icon components
function IconUser() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
function IconTeam() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function IconIntegrations() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
      <rect x="2" y="3" width="6" height="6" rx="1"/><rect x="16" y="3" width="6" height="6" rx="1"/><rect x="9" y="15" width="6" height="6" rx="1"/>
      <path d="M5 9v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9"/><path d="M12 13v2"/>
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}
function IconGlobe() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}
function IconDashboard() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  );
}

export default function SCOPSNav({ adminUser, currentPage }: SCOPSNavProps) {
  const [, setLocation] = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const logoutMutation = trpc.adminAuth.logout.useMutation({
    onSuccess: () => { window.location.href = "/admin-login"; },
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const activeSection = currentPage ? PAGE_TO_SECTION[currentPage] : "";
  const firstName = adminUser.name?.split(" ")[0] ?? adminUser.name ?? "User";
  const role = adminUser.adminRole ?? "admin";

  const visibleSections = NAV_SECTIONS.filter(s => {
    if (role === "sales" && (s.key === "utm-builder" || s.key === "campaigns")) return false;
    if (role === "marketing" && s.key === "scheduling") return false;
    return true;
  });

  const navigate = (section: NavSection) => {
    setMobileMenuOpen(false);
    if (section.soon) { toast.info(`${section.label} — coming soon`); return; }
    if (section.path) setLocation(section.path);
  };

  return (
    <div
      className="bg-white border-b border-gray-200"
      style={{
        boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* ── Main bar ── */}
      <div className="flex items-center justify-between" style={{ minHeight: 64, paddingLeft: 16, paddingRight: 16 }}>

        {/* Left: Logo + Clock */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => window.location.href = "/"}
            className="flex items-center hover:opacity-80 transition-opacity"
            title="Back to Apollo Site"
          >
            <img
              src={HOMES_BY_APOLLO_LOGO}
              alt="Homes by Apollo"
              style={{ height: 47, width: "auto", objectFit: "contain" }}
            />
          </button>
          <div className="hidden lg:block" style={{ width: 1, height: 24, background: "#e5e7eb" }} />
          <LiveClock />
        </div>

        {/* Center: Nav tabs — desktop only */}
        <nav className="hidden md:flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2">
          {visibleSections.map((section) => {
            const isActive =
              activeSection === section.label ||
              activeSection === section.key ||
              currentPage === section.key;
            return (
              <button
                key={section.key}
                onClick={() => navigate(section)}
                className="relative px-3 py-2 rounded-lg text-[14px] font-medium transition-all whitespace-nowrap"
                style={{
                  color: isActive ? "#111827" : section.soon ? "#d1d5db" : "#6b7280",
                  background: isActive ? "#f3f4f6" : "transparent",
                  cursor: section.soon ? "default" : "pointer",
                  fontWeight: isActive ? 600 : 500,
                }}
                title={section.soon ? "Coming soon" : undefined}
              >
                {section.label}
                {isActive && (
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: "15%",
                      width: "70%",
                      height: 2,
                      borderRadius: 2,
                      background: "#2563eb",
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: User dropdown + hamburger */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* User dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setUserMenuOpen(prev => !prev)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              style={{ background: userMenuOpen ? "#f3f4f6" : "#ffffff" }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}
              >
                {firstName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline text-[14px] font-medium text-gray-700">{firstName}</span>
              <svg
                width="10" height="10" viewBox="0 0 12 12" fill="none"
                className={`transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                style={{ color: "#9ca3af" }}
              >
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {userMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-lg border border-gray-200 bg-white py-1 z-50"
                style={{ boxShadow: "0 8px 24px rgba(15,23,42,0.12)" }}
              >
                {/* User info header */}
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <div className="text-sm font-semibold text-gray-900 truncate">{adminUser.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">SCOPS Admin</div>
                </div>

                {/* Quick nav */}
                <div className="py-1">
                  <button
                    onClick={() => { setUserMenuOpen(false); setLocation("/scops"); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2.5"
                  >
                    <IconDashboard />
                    Dashboard
                  </button>
                  <button
                    onClick={() => { setUserMenuOpen(false); window.location.href = "/"; }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2.5"
                  >
                    <IconGlobe />
                    View Public Site
                  </button>
                </div>

                {/* Account section */}
                <div className="border-t border-gray-100 py-1">
                  <div className="px-4 py-1.5">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Account</span>
                  </div>
                  <button
                    onClick={() => { setUserMenuOpen(false); toast.info("Profile — coming soon"); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2.5"
                  >
                    <IconUser />
                    Profile
                  </button>
                  <button
                    onClick={() => { setUserMenuOpen(false); setLocation("/scops/users"); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2.5"
                  >
                    <IconTeam />
                    Team
                  </button>
                  <button
                    onClick={() => { setUserMenuOpen(false); toast.info("Integrations — coming soon"); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2.5"
                  >
                    <IconIntegrations />
                    Integrations
                  </button>
                  <button
                    onClick={() => { setUserMenuOpen(false); setLocation("/scops/settings"); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2.5"
                  >
                    <IconSettings />
                    Settings
                  </button>
                </div>

                {/* Sign out */}
                <div className="border-t border-gray-100 py-1">
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

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label="Open navigation"
          >
            {mobileMenuOpen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown nav ── */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden border-t border-gray-100 bg-white"
        >
          {visibleSections.map((section) => {
            const isActive =
              activeSection === section.label ||
              activeSection === section.key ||
              currentPage === section.key;
            return (
              <button
                key={section.key}
                onClick={() => navigate(section)}
                className="w-full text-left px-4 py-3 text-[15px] font-medium border-b border-gray-50 last:border-0 transition-colors"
                style={{
                  color: isActive ? "#111827" : section.soon ? "#d1d5db" : "#374151",
                  background: isActive ? "#f3f4f6" : "transparent",
                  fontWeight: isActive ? 700 : 500,
                  cursor: section.soon ? "default" : "pointer",
                  borderLeft: isActive ? "3px solid #2563eb" : "3px solid transparent",
                }}
              >
                {section.label}
                {section.soon && <span className="ml-2 text-[10px] text-gray-400 font-normal">Coming soon</span>}
              </button>
            );
          })}
          {/* Settings in mobile menu too */}
          <button
            onClick={() => { setMobileMenuOpen(false); setLocation("/scops/settings"); }}
            className="w-full text-left px-4 py-3 text-[15px] font-medium border-b border-gray-50 last:border-0 transition-colors"
            style={{
              color: currentPage === "settings" ? "#111827" : "#374151",
              background: currentPage === "settings" ? "#f3f4f6" : "transparent",
              fontWeight: currentPage === "settings" ? 700 : 500,
              borderLeft: currentPage === "settings" ? "3px solid #2563eb" : "3px solid transparent",
            }}
          >
            Settings
          </button>
        </div>
      )}
    </div>
  );
}
