import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

const OWL_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/apollo-logo-white_48c145a3.png";

interface SCOPSNavProps {
  adminUser: { name: string };
  currentPage?: "dashboard" | "properties" | "blog" | "users" | "utm-builder" | "scheduling";
}

export default function SCOPSNav({ adminUser, currentPage }: SCOPSNavProps) {
  const [, setLocation] = useLocation();
  const logoutMutation = trpc.adminAuth.logout.useMutation({
    onSuccess: () => { window.location.href = "/admin-login"; },
  });

  const navItems = [
    { key: "dashboard", label: "SCOPS", path: "/scops" },
    { key: "properties", label: "Properties", path: "/scops/properties" },
    { key: "blog", label: "Blog Posts", path: "/scops/blog" },
    { key: "users", label: "Admin Users", path: "/scops/users" },
    { key: "utm-builder", label: "UTM Builder", path: "/scops/utm-builder" },
    { key: "scheduling", label: "Scheduling", path: "/scops/scheduling" },
  ] as const;

  return (
    <div className="bg-[#0f2044] text-white px-6 py-0 flex items-center justify-between border-b border-white/10" style={{ minHeight: 52 }}>
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-0">
        {/* Logo */}
        <button
          onClick={() => window.location.href = "/"}
          className="flex items-center gap-2 pr-5 border-r border-white/20 mr-5 h-[52px] hover:opacity-80 transition-opacity"
          title="Back to Site"
        >
          <img src={OWL_LOGO} alt="Apollo Owl" style={{ height: 32, width: 32, objectFit: "contain" }} />
        </button>

        {/* Brand name */}
        <span className="text-xs font-bold tracking-[0.18em] text-white/40 uppercase mr-5">SCOPS</span>

        {/* Nav items */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = currentPage === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setLocation(item.path)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-white/55 hover:text-white hover:bg-white/10"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: User + Sign Out */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">
            {adminUser.name?.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm text-white/70 font-medium">{adminUser.name}</span>
        </div>
        <button
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="text-xs text-white/50 hover:text-white border border-white/20 hover:border-white/50 rounded px-3 py-1.5 transition-colors ml-2"
        >
          {logoutMutation.isPending ? "…" : "Sign Out"}
        </button>
      </div>
    </div>
  );
}
