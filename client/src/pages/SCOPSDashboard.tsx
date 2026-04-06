import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import LeadDetail from "./LeadDetail";
import SCOPSNav from "@/components/SCOPSNav";

// ─── Pipeline Stages (new enum) ───────────────────────────────────────────────

const PIPELINE_STAGES = [
  "NEW_INQUIRY",
  "QUALIFIED",
  "TOUR_SCHEDULED",
  "TOURED",
  "OFFER_SUBMITTED",
  "UNDER_CONTRACT",
  "CLOSED",
  "LOST",
] as const;

const STAGE_LABELS: Record<string, string> = {
  NEW_INQUIRY: "New Inquiry",
  QUALIFIED: "Qualified",
  TOUR_SCHEDULED: "Tour Scheduled",
  TOURED: "Toured",
  OFFER_SUBMITTED: "Offer Submitted",
  UNDER_CONTRACT: "Under Contract",
  CLOSED: "Closed",
  LOST: "Lost",
};

const STAGE_COLORS: Record<string, string> = {
  NEW_INQUIRY: "bg-slate-100 text-slate-700",
  QUALIFIED: "bg-blue-50 text-blue-700",
  TOUR_SCHEDULED: "bg-teal-50 text-teal-700",
  TOURED: "bg-emerald-50 text-emerald-700",
  OFFER_SUBMITTED: "bg-amber-50 text-amber-700",
  UNDER_CONTRACT: "bg-orange-50 text-orange-700",
  CLOSED: "bg-green-50 text-green-700",
  LOST: "bg-red-50 text-red-600",
};

const SCORE_COLORS: Record<string, string> = {
  HOT: "bg-red-50 text-red-700 border-red-200",
  WARM: "bg-amber-50 text-amber-700 border-amber-200",
  COLD: "bg-blue-50 text-blue-700 border-blue-200",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function timeAgo(d: Date | string | null | undefined): string {
  if (!d) return "never";
  const ms = Date.now() - new Date(d).getTime();
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatTimeline(t: string | null | undefined): string {
  const map: Record<string, string> = {
    ASAP: "ASAP", "1_3_MONTHS": "1–3 mo", "3_6_MONTHS": "3–6 mo",
    "6_12_MONTHS": "6–12 mo", JUST_BROWSING: "Browsing",
  };
  return t ? (map[t] ?? t) : "—";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
      {children}
    </p>
  );
}

function MetricCard({
  label,
  value,
  sub,
  accent,
  loading,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  loading?: boolean;
}) {
  return (
    <Card className="bg-white border border-slate-100 shadow-none rounded-2xl">
      <CardContent className="pt-5 pb-4 px-5">
        {loading ? (
          <div className="h-8 w-16 bg-slate-100 rounded animate-pulse mb-1" />
        ) : (
          <div
            className="text-3xl font-black tracking-tight leading-none"
            style={{ color: accent ?? "#0f2044" }}
          >
            {value}
          </div>
        )}
        <div className="text-[13px] font-semibold text-slate-700 mt-1.5">{label}</div>
        {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function PipelineFunnel({ stageCounts }: { stageCounts: { stage: string; count: number }[] }) {
  const activeStages = PIPELINE_STAGES.filter(s => s !== "LOST" && s !== "CLOSED");
  const countMap = Object.fromEntries(stageCounts.map(s => [s.stage, s.count]));
  const maxCount = Math.max(...activeStages.map(s => countMap[s] ?? 0), 1);
  const totalActive = activeStages.reduce((sum, s) => sum + (countMap[s] ?? 0), 0);

  return (
    <div className="space-y-2.5">
      {activeStages.map((stage, i) => {
        const count = countMap[stage] ?? 0;
        const pct = Math.round((count / maxCount) * 100);
        const convPct = i === 0 || totalActive === 0 ? null :
          Math.round((count / (countMap[activeStages[0]] || 1)) * 100);
        return (
          <div key={stage} className="flex items-center gap-3">
            <div className="w-28 text-[11px] text-slate-500 text-right shrink-0 font-medium">
              {STAGE_LABELS[stage]}
            </div>
            <div className="flex-1 h-5 bg-slate-50 rounded-md overflow-hidden border border-slate-100">
              <div
                className="h-full rounded-md transition-all duration-500 flex items-center justify-end pr-2"
                style={{
                  width: `${Math.max(pct, count > 0 ? 6 : 0)}%`,
                  background: "#0f2044",
                  opacity: 0.85 - i * 0.08,
                }}
              >
                {count > 0 && (
                  <span className="text-[10px] font-bold text-white">{count}</span>
                )}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 w-10 text-right shrink-0">
              {convPct !== null ? `${convPct}%` : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    FORM_SUBMITTED: "●",
    STAGE_CHANGE: "→",
    NOTE_ADDED: "✎",
    EMAIL_SENT: "✉",
    CALL_LOGGED: "☎",
    TOUR_SCHEDULED: "◈",
    SCORE_UPDATED: "◆",
  };
  const colors: Record<string, string> = {
    FORM_SUBMITTED: "text-blue-500",
    STAGE_CHANGE: "text-amber-500",
    NOTE_ADDED: "text-slate-400",
    EMAIL_SENT: "text-emerald-500",
    CALL_LOGGED: "text-violet-500",
    TOUR_SCHEDULED: "text-teal-500",
    SCORE_UPDATED: "text-orange-500",
  };
  return (
    <span className={`text-[10px] font-bold ${colors[type] ?? "text-slate-400"}`}>
      {icons[type] ?? "·"}
    </span>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function SCOPSDashboard() {
  const adminMeQuery = trpc.adminAuth.me.useQuery();
  const adminUser = adminMeQuery.data;
  const loading = adminMeQuery.isLoading;

  const [, setLocation] = useLocation();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [scoreFilter, setScoreFilter] = useState<string>("ALL");

  // Data queries
  const dashboardQuery = trpc.dashboard.overview.useQuery();
  const statsQuery = trpc.leads.dashboardStats.useQuery({ sourcePeriod: "all" });
  const contactsQuery = trpc.leads.list.useQuery({
    pipelineStage: stageFilter !== "ALL" ? stageFilter as any : undefined,
    leadScore: scoreFilter !== "ALL" ? scoreFilter as any : undefined,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-sm text-slate-400">Loading…</div>
      </div>
    );
  }

  if (!adminUser) {
    window.location.href = "/admin-login";
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-sm text-slate-400">Redirecting…</div>
      </div>
    );
  }

  const contacts = contactsQuery.data ?? [];
  const dash = dashboardQuery.data;
  const stageCounts = statsQuery.data?.stageCounts ?? [];

  // Derived
  const filtered = contacts.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q)
    );
  });

  if (selectedId !== null) {
    return <LeadDetail id={selectedId} onBack={() => setSelectedId(null)} />;
  }

  const inv = dash?.inventoryStats;
  const forecast = dash?.revenueForecast;
  const atRisk = dash?.dealsAtRisk ?? [];
  const inventoryHealth = dash?.inventoryHealth ?? [];
  const sourcePerf = dash?.sourcePerformance ?? [];
  const activity = dash?.recentActivity ?? [];

  // Slow-moving: DOM > 60 days
  const slowMoving = inventoryHealth.filter(p => p.dom > 60).slice(0, 5);
  // Low activity: 0 leads
  const lowActivity = inventoryHealth.filter(p => p.leadCount === 0).slice(0, 5);

  return (
    <div className="min-h-screen bg-white">
      <SCOPSNav adminUser={adminUser} currentPage="dashboard" />

      <div className="px-6 py-6 max-w-screen-2xl mx-auto space-y-8">

        {/* ── Row 1: Top KPI Cards ─────────────────────────────────────── */}
        <div>
          <SectionLabel>Inventory &amp; Revenue</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <MetricCard
              label="Units Available"
              value={inv?.available ?? "—"}
              sub="active listings"
              loading={dashboardQuery.isLoading}
            />
            <MetricCard
              label="Under Contract"
              value={inv?.underContract ?? "—"}
              sub="pending close"
              accent="#c8a96e"
              loading={dashboardQuery.isLoading}
            />
            <MetricCard
              label="Sold (30d)"
              value={inv?.soldLast30 ?? "—"}
              sub="units closed"
              accent="#059669"
              loading={dashboardQuery.isLoading}
            />
            <MetricCard
              label="Revenue MTD"
              value={inv ? formatCurrency(inv.revenueMtd) : "—"}
              sub="month to date"
              accent="#0f2044"
              loading={dashboardQuery.isLoading}
            />
            <MetricCard
              label="Tours This Week"
              value={dash?.toursThisWeek ?? "—"}
              sub="scheduled"
              loading={dashboardQuery.isLoading}
            />
            <MetricCard
              label="Absorption Rate"
              value={dash?.absorptionRate != null ? `${dash.absorptionRate}%` : "—"}
              sub="30-day rate"
              loading={dashboardQuery.isLoading}
            />
          </div>
        </div>

        {/* ── Row 2: Quick Actions ─────────────────────────────────────── */}
        <div>
          <SectionLabel>Quick Actions</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              {
                label: "New Blog Post",
                description: "Write & publish content",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                ),
                href: "/scops/blog?new=1",
                accent: "#0f2044",
              },
              {
                label: "Add Lead",
                description: "Create a new CRM contact",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                  </svg>
                ),
                href: "/scops/leads?new=1",
                accent: "#1a3366",
              },
              {
                label: "Schedule Tour",
                description: "Book a site visit",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                ),
                href: "/scops/scheduling",
                accent: "#059669",
              },
              {
                label: "View Properties",
                description: "Manage listings",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                ),
                href: "/scops/properties",
                accent: "#7c3aed",
              },
              {
                label: "UTM Builder",
                description: "Generate tracking links",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                ),
                href: "/scops/utm-builder",
                accent: "#e07b39",
              },
            ].map(({ label, description, icon, href, accent }) => (
              <button
                key={label}
                onClick={() => setLocation(href)}
                className="group text-left bg-white rounded-xl border border-slate-100 p-4 hover:border-slate-200 hover:shadow-sm transition-all duration-150 cursor-pointer"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: `${accent}12`, color: accent }}
                >
                  {icon}
                </div>
                <div className="text-[13px] font-bold text-slate-800 leading-tight">{label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Row 3: Deals at Risk ─────────────────────────────────────── */}
        {atRisk.length > 0 && (
          <div>
            <SectionLabel>Deals at Risk</SectionLabel>
            <Card className="bg-white border border-red-100 shadow-none rounded-2xl">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-red-50">
                        {["Lead", "Stage", "Issue", "Action"].map(h => (
                          <th key={h} className="text-left text-[10px] font-bold text-red-400 uppercase tracking-wider px-5 py-3">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {atRisk.map((r) => (
                        <tr key={r.id} className="border-b border-red-50 last:border-0 hover:bg-red-50/40 transition-colors">
                          <td className="px-5 py-3">
                            <span className="font-semibold text-slate-800 text-[13px]">{r.name}</span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${STAGE_COLORS[r.stage]}`}>
                              {STAGE_LABELS[r.stage]}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-[12px] text-red-600 font-medium">{r.issue}</span>
                          </td>
                          <td className="px-5 py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[11px] text-[#0f2044] hover:bg-[#0f2044]/8 font-semibold"
                              onClick={() => setSelectedId(r.id)}
                            >
                              View →
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Row 4: Pipeline + Revenue Forecast ──────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pipeline Funnel */}
          <Card className="bg-white border border-slate-100 shadow-none rounded-2xl">
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Pipeline Funnel
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {statsQuery.isLoading ? (
                <div className="text-sm text-slate-400 py-4">Loading…</div>
              ) : (
                <PipelineFunnel stageCounts={stageCounts} />
              )}
            </CardContent>
          </Card>

          {/* Revenue Forecast */}
          <Card className="bg-white border border-slate-100 shadow-none rounded-2xl">
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Revenue Forecast
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {dashboardQuery.isLoading ? (
                <div className="text-sm text-slate-400 py-4">Loading…</div>
              ) : !forecast || (forecast.days30 === 0 && forecast.days60 === 0 && forecast.days90 === 0) ? (
                <div className="text-[12px] text-slate-400 py-4">
                  No active deals with expected close dates. Create deals in the Pipeline to see forecasts.
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    { label: "30-Day Forecast", value: forecast.days30, desc: "closing within 30 days" },
                    { label: "60-Day Forecast", value: forecast.days60, desc: "closing in 31–60 days" },
                    { label: "90-Day Forecast", value: forecast.days90, desc: "closing in 61–90 days" },
                  ].map(({ label, value, desc }) => {
                    const maxVal = Math.max(forecast.days30, forecast.days60, forecast.days90, 1);
                    const pct = Math.round((value / maxVal) * 100);
                    return (
                      <div key={label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[12px] font-semibold text-slate-700">{label}</span>
                          <span className="text-[13px] font-black text-[#0f2044]">
                            {value > 0 ? formatCurrency(value) : "—"}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                          <div
                            className="h-full bg-[#0f2044] rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(pct, value > 0 ? 4 : 0)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">{desc}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Row 5: Source Performance + Activity Feed ────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Source Performance */}
          <Card className="bg-white border border-slate-100 shadow-none rounded-2xl">
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Source Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {dashboardQuery.isLoading ? (
                <div className="text-sm text-slate-400 py-4">Loading…</div>
              ) : sourcePerf.length === 0 ? (
                <div className="text-[12px] text-slate-400 py-4">No leads yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {["Source", "Leads", "Tours", "Contracts"].map(h => (
                          <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-2 pr-3">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sourcePerf.filter(s => s.leads > 0).map(s => (
                        <tr key={s.source} className="border-b border-slate-50 last:border-0">
                          <td className="py-2.5 pr-3 font-semibold text-slate-700">{s.label}</td>
                          <td className="py-2.5 pr-3 font-black text-[#0f2044]">{s.leads}</td>
                          <td className="py-2.5 pr-3 text-slate-600">{s.tours}</td>
                          <td className="py-2.5 font-semibold text-emerald-700">{s.contracts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="bg-white border border-slate-100 shadow-none rounded-2xl">
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Activity Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {dashboardQuery.isLoading ? (
                <div className="text-sm text-slate-400 py-4">Loading…</div>
              ) : activity.length === 0 ? (
                <div className="text-[12px] text-slate-400 py-4">No activity yet.</div>
              ) : (
                <div className="space-y-2.5">
                  {activity.map(a => (
                    <div key={a.id} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                        <ActivityIcon type={a.activityType} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] text-slate-700 leading-snug truncate">
                          {a.firstName && a.lastName && (
                            <span className="font-semibold text-slate-800">
                              {a.firstName} {a.lastName} —{" "}
                            </span>
                          )}
                          {a.description}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {timeAgo(a.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Row 6: Inventory Health ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Slow Moving */}
          <Card className="bg-white border border-slate-100 shadow-none rounded-2xl">
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Slow Moving (60+ DOM)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {dashboardQuery.isLoading ? (
                <div className="text-sm text-slate-400 py-4">Loading…</div>
              ) : slowMoving.length === 0 ? (
                <div className="text-[12px] text-slate-400 py-4">No properties over 60 days on market.</div>
              ) : (
                <div className="space-y-2">
                  {slowMoving.map(p => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-slate-800 truncate">{p.address}</div>
                        <div className="text-[11px] text-slate-400">{p.price}</div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 ml-4">
                        <div className="text-right">
                          <div className="text-[11px] font-black text-amber-600">{p.dom}d</div>
                          <div className="text-[10px] text-slate-400">DOM</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] font-bold text-slate-700">{p.leadCount}</div>
                          <div className="text-[10px] text-slate-400">leads</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Activity */}
          <Card className="bg-white border border-slate-100 shadow-none rounded-2xl">
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Low Activity Listings
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {dashboardQuery.isLoading ? (
                <div className="text-sm text-slate-400 py-4">Loading…</div>
              ) : lowActivity.length === 0 ? (
                <div className="text-[12px] text-slate-400 py-4">All listings have active leads.</div>
              ) : (
                <div className="space-y-2">
                  {lowActivity.map(p => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-slate-800 truncate">{p.address}</div>
                        <div className="text-[11px] text-slate-400">{p.price}</div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 ml-4">
                        <div className="text-right">
                          <div className="text-[11px] font-black text-slate-500">{p.dom}d</div>
                          <div className="text-[10px] text-slate-400">DOM</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] font-bold text-red-500">0</div>
                          <div className="text-[10px] text-slate-400">leads</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Row 7: Active Pipeline Table ─────────────────────────────── */}
        <div>
          <SectionLabel>Active Pipeline</SectionLabel>
          <Card className="bg-white border border-slate-100 shadow-none rounded-2xl">
            <CardHeader className="pb-3 pt-5 px-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  {filtered.length} contacts
                </div>
                <div className="flex flex-wrap gap-2">
                  <Input
                    placeholder="Search name, email, phone…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="h-8 text-xs w-44 border-slate-200 bg-white"
                  />
                  <Select value={stageFilter} onValueChange={setStageFilter}>
                    <SelectTrigger className="h-8 text-xs w-36 border-slate-200">
                      <SelectValue placeholder="All Stages" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Stages</SelectItem>
                      {PIPELINE_STAGES.map(s => (
                        <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={scoreFilter} onValueChange={setScoreFilter}>
                    <SelectTrigger className="h-8 text-xs w-28 border-slate-200">
                      <SelectValue placeholder="All Scores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Scores</SelectItem>
                      <SelectItem value="HOT">Hot</SelectItem>
                      <SelectItem value="WARM">Warm</SelectItem>
                      <SelectItem value="COLD">Cold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {contactsQuery.isLoading ? (
                <div className="text-sm text-slate-400 p-6">Loading contacts…</div>
              ) : filtered.length === 0 ? (
                <div className="text-sm text-slate-400 p-6 text-center">
                  {contacts.length === 0
                    ? "No contacts yet. Submit the website form to create the first lead."
                    : "No contacts match the current filters."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        {["Name", "Stage", "Score", "Primary Property", "Timeline", "Last Activity", "Next Action", ""].map(h => (
                          <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((c) => (
                        <tr
                          key={c.id}
                          className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 cursor-pointer transition-colors"
                          onClick={() => setSelectedId(c.id)}
                        >
                          <td className="px-5 py-3">
                            <div className="font-semibold text-slate-800">{c.firstName} {c.lastName}</div>
                            <div className="text-[11px] text-slate-400">{c.email}</div>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${STAGE_COLORS[c.pipelineStage]}`}>
                              {STAGE_LABELS[c.pipelineStage]}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            {c.leadScore ? (
                              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${SCORE_COLORS[c.leadScore]}`}>
                                {c.leadScore}
                              </span>
                            ) : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-5 py-3 text-slate-500">
                            {(c as any).primaryPropertyId ? `#${(c as any).primaryPropertyId}` : "—"}
                          </td>
                          <td className="px-5 py-3 text-slate-500">{formatTimeline(c.timeline)}</td>
                          <td className="px-5 py-3 text-slate-400">
                            {timeAgo((c as any).lastContactedAt ?? c.updatedAt)}
                          </td>
                          <td className="px-5 py-3 text-slate-500 max-w-[160px] truncate">
                            {(c as any).nextAction ?? "—"}
                          </td>
                          <td className="px-5 py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[11px] text-[#0f2044] hover:bg-[#0f2044]/8 font-semibold"
                              onClick={e => { e.stopPropagation(); setSelectedId(c.id); }}
                            >
                              View →
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
