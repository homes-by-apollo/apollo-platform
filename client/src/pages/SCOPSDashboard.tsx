import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { useLocation } from "wouter";
import LeadDetail from "./LeadDetail";
import SCOPSNav from "@/components/SCOPSNav";

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGE_ORDER = [
  "NEW_LEAD", "CONTACTED", "NURTURE", "SQL",
  "TOUR_SCHEDULED", "TOUR_COMPLETED", "PROPOSAL_SENT",
  "CONTRACT_SIGNED", "IN_CONSTRUCTION", "CLOSED", "LOST",
] as const;

const STAGE_LABELS: Record<string, string> = {
  NEW_LEAD: "New Lead", CONTACTED: "Contacted", NURTURE: "Nurturing",
  SQL: "SQL", TOUR_SCHEDULED: "Tour Scheduled", TOUR_COMPLETED: "Tour Completed",
  PROPOSAL_SENT: "Proposal Sent", CONTRACT_SIGNED: "Contract Signed",
  IN_CONSTRUCTION: "In Construction", CLOSED: "Closed", LOST: "Lost",
};

const SCORE_COLORS: Record<string, string> = {
  HOT: "bg-red-100 text-red-700 border-red-200",
  WARM: "bg-amber-100 text-amber-700 border-amber-200",
  COLD: "bg-blue-100 text-blue-700 border-blue-200",
};

const STAGE_COLORS: Record<string, string> = {
  NEW_LEAD: "bg-slate-100 text-slate-700",
  CONTACTED: "bg-blue-100 text-blue-700",
  NURTURE: "bg-purple-100 text-purple-700",
  SQL: "bg-green-100 text-green-700",
  TOUR_SCHEDULED: "bg-teal-100 text-teal-700",
  TOUR_COMPLETED: "bg-emerald-100 text-emerald-700",
  PROPOSAL_SENT: "bg-orange-100 text-orange-700",
  CONTRACT_SIGNED: "bg-green-200 text-green-800",
  IN_CONSTRUCTION: "bg-yellow-100 text-yellow-700",
  CLOSED: "bg-gray-100 text-gray-700",
  LOST: "bg-red-100 text-red-600",
};

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTimeline(t: string | null | undefined) {
  const map: Record<string, string> = {
    ASAP: "ASAP", "1_3_MONTHS": "1–3 mo", "3_6_MONTHS": "3–6 mo",
    "6_12_MONTHS": "6–12 mo", JUST_BROWSING: "Browsing",
  };
  return t ? (map[t] ?? t) : "—";
}

// ─── Source Breakdown Chart ──────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: "Website",
  ZILLOW: "Zillow",
  MLS: "MLS",
  REFERRAL: "Referral",
  AGENT: "Agent",
  BILLBOARD: "Billboard",
  WALK_IN: "Walk-In",
  OTHER: "Other",
};

const SOURCE_COLORS: Record<string, string> = {
  WEBSITE: "#0f2044",
  ZILLOW: "#006aff",
  MLS: "#7c3aed",
  REFERRAL: "#e07b39",
  AGENT: "#059669",
  BILLBOARD: "#dc2626",
  WALK_IN: "#ca8a04",
  OTHER: "#94a3b8",
};

function SourceChart({ sourceCounts }: { sourceCounts: { source: string; count: number }[] }) {
  const total = sourceCounts.reduce((s, c) => s + c.count, 0);
  const sorted = [...sourceCounts].sort((a, b) => b.count - a.count);

  if (total === 0) {
    return <p className="text-xs text-muted-foreground py-2">No leads yet.</p>;
  }

  return (
    <div className="space-y-2">
      {sorted.map(({ source, count }) => {
        const pct = Math.round((count / total) * 100);
        const color = SOURCE_COLORS[source] ?? "#94a3b8";
        return (
          <div key={source} className="flex items-center gap-3">
            <div className="w-20 text-xs text-muted-foreground text-right shrink-0">{SOURCE_LABELS[source] ?? source}</div>
            <div className="flex-1 h-5 bg-slate-100 rounded-md overflow-hidden">
              <div
                className="h-full rounded-md transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%`, background: color }}
              >
                {count > 0 && <span className="text-[10px] font-bold text-white">{count}</span>}
              </div>
            </div>
            <div className="text-xs text-muted-foreground w-8 text-right">{pct}%</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── UTM Source Chart ────────────────────────────────────────────────────────

const UTM_COLORS = [
  "#0f2044", "#1a3366", "#c8a96e", "#e07b39", "#059669",
  "#7c3aed", "#dc2626", "#0284c7", "#ca8a04", "#94a3b8",
];

function UtmChart({ rows }: { rows: { utmSource: string | null; utmMedium: string | null; utmCampaign: string | null; count: number }[] }) {
  // Roll up by source for the bar chart
  const bySource: Record<string, number> = {};
  for (const r of rows) {
    const src = r.utmSource ?? "(direct)";
    bySource[src] = (bySource[src] ?? 0) + r.count;
  }
  const sorted = Object.entries(bySource).sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((s, [, c]) => s + c, 0);

  if (total === 0) {
    return <p className="text-xs text-muted-foreground py-2">No UTM-tagged leads yet. Start running ads with UTM parameters to see attribution here.</p>;
  }

  return (
    <div className="space-y-2">
      {sorted.map(([src, count], i) => {
        const pct = Math.round((count / total) * 100);
        const color = UTM_COLORS[i % UTM_COLORS.length];
        return (
          <div key={src} className="flex items-center gap-3">
            <div className="w-20 text-xs text-muted-foreground text-right shrink-0 truncate" title={src}>{src}</div>
            <div className="flex-1 h-5 bg-slate-100 rounded-md overflow-hidden">
              <div
                className="h-full rounded-md transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%`, background: color }}
              >
                {count > 0 && <span className="text-[10px] font-bold text-white">{count}</span>}
              </div>
            </div>
            <div className="text-xs text-muted-foreground w-8 text-right">{pct}%</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Funnel Bar Chart ─────────────────────────────────────────────────────────

function FunnelChart({ stageCounts }: { stageCounts: { stage: string; count: number }[] }) {
  const activeStages = STAGE_ORDER.filter(s => s !== "LOST" && s !== "IN_CONSTRUCTION" && s !== "CLOSED");
  const countMap = Object.fromEntries(stageCounts.map(s => [s.stage, s.count]));
  const maxCount = Math.max(...activeStages.map(s => countMap[s] ?? 0), 1);

  return (
    <div className="space-y-2">
      {activeStages.map((stage) => {
        const count = countMap[stage] ?? 0;
        const pct = Math.round((count / maxCount) * 100);
        return (
          <div key={stage} className="flex items-center gap-3">
            <div className="w-32 text-xs text-muted-foreground text-right shrink-0">{STAGE_LABELS[stage]}</div>
            <div className="flex-1 h-6 bg-slate-100 rounded-md overflow-hidden">
              <div
                className="h-full bg-[#0f2044] rounded-md transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
              >
                {count > 0 && <span className="text-[10px] font-bold text-white">{count}</span>}
              </div>
            </div>
            {count === 0 && <span className="text-xs text-muted-foreground w-4">0</span>}
          </div>
        );
      })}
    </div>
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
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [sourcePeriod, setSourcePeriod] = useState<"7d" | "30d" | "all">("all");
  const [trafficPeriod, setTrafficPeriod] = useState<"7d" | "30d" | "month" | "6mo" | "12mo">("30d");
  const [utmPeriod, setUtmPeriod] = useState<"7d" | "30d" | "all">("all");

  const statsQuery = trpc.leads.dashboardStats.useQuery({ sourcePeriod });
  const trafficQuery = trpc.analytics.trafficStats.useQuery({ period: trafficPeriod });
  const utmQuery = trpc.leads.utmStats.useQuery({ period: utmPeriod });
  const contactsQuery = trpc.leads.list.useQuery({
    pipelineStage: stageFilter !== "ALL" ? stageFilter as any : undefined,
    contactType: typeFilter !== "ALL" ? typeFilter as any : undefined,
    leadScore: scoreFilter !== "ALL" ? scoreFilter as any : undefined,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!adminUser) {
    // Redirect to admin login
    window.location.href = "/admin-login";
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-sm text-muted-foreground">Redirecting to login…</div>
      </div>
    );
  }

  const contacts = contactsQuery.data ?? [];
  const stats = statsQuery.data;
  const stageCounts = stats?.stageCounts ?? [];
  const newLeadsThisWeek = stats?.newLeadsThisWeek ?? 0;
  const sourceCounts = stats?.sourceCounts ?? [];
  const traffic = trafficQuery.data;

  // Derived stats
  const totalActive = contacts.filter(c => !["LOST","CLOSED"].includes(c.pipelineStage)).length;
  const hotLeads = contacts.filter(c => c.leadScore === "HOT").length;
  const toursScheduled = contacts.filter(c => c.pipelineStage === "TOUR_SCHEDULED").length;
  const contractsSigned = contacts.filter(c => c.pipelineStage === "CONTRACT_SIGNED").length;

  // Derived web KPIs
  const formConversionRate =
    traffic?.visitors && traffic.visitors > 0
      ? ((newLeadsThisWeek / traffic.visitors) * 100).toFixed(1)
      : null;

  // Format avg visit duration (seconds → m:ss)
  function fmtDuration(secs: number | null | undefined) {
    if (secs == null) return "—";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  }

  // Search filter (client-side)
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <SCOPSNav adminUser={adminUser} currentPage="dashboard" />

      <div className="px-6 py-6 max-w-screen-2xl mx-auto space-y-6">
        {/* CRM KPI Cards */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Pipeline</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "New This Week", value: newLeadsThisWeek, sub: "leads captured" },
              { label: "Active Pipeline", value: totalActive, sub: "open contacts" },
              { label: "Hot Leads", value: hotLeads, sub: "ASAP + pre-approved" },
              { label: "Tours Scheduled", value: toursScheduled, sub: "upcoming visits" },
            ].map(({ label, value, sub }) => (
              <Card key={label} className="border-0 shadow-sm">
                <CardContent className="pt-5 pb-4">
                  <div className="text-3xl font-black text-[#0f2044]">{value}</div>
                  <div className="text-sm font-semibold mt-1">{label}</div>
                  <div className="text-xs text-muted-foreground">{sub}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Quick Actions</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              {
                label: "New Blog Post",
                description: "Write & publish content",
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                className="group text-left bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:shadow-md hover:border-slate-200 transition-all duration-200 cursor-pointer"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                  style={{ background: `${accent}15`, color: accent }}
                >
                  {icon}
                </div>
                <div className="text-sm font-bold text-[#0d1b2a] leading-tight">{label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Web Traffic Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Website Traffic</p>
            <div className="flex items-center gap-2">
              {traffic?.configured === false && (
                <span className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  Plausible API key not configured
                </span>
              )}
              {traffic?.configured === true && (
                <a
                  href="https://plausible.io/apollohomebuilders.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#0f2044] font-semibold hover:underline"
                >
                  Open Plausible ↗
                </a>
              )}
              <div className="flex gap-1">
                {(["7d", "30d", "month", "6mo", "12mo"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setTrafficPeriod(p)}
                    className={`text-[10px] px-2 py-0.5 rounded font-semibold transition-colors ${
                      trafficPeriod === p
                        ? "bg-[#0f2044] text-white"
                        : "bg-slate-100 text-muted-foreground hover:bg-slate-200"
                    }`}
                  >
                    {p === "month" ? "Mo" : p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
            {[
              { label: "Unique Visitors", value: traffic?.visitors, fmt: (v: number) => v.toLocaleString() },
              { label: "Pageviews", value: traffic?.pageviews, fmt: (v: number) => v.toLocaleString() },
              { label: "Bounce Rate", value: traffic?.bounceRate, fmt: (v: number) => `${v}%` },
              { label: "Avg Visit", value: traffic?.avgVisitDuration, fmt: (v: number) => fmtDuration(v) },
              { label: "Form Conversion", value: formConversionRate != null ? parseFloat(formConversionRate) : null, fmt: (v: number) => `${v}%` },
            ].map(({ label, value, fmt }) => (
              <Card key={label} className="border-0 shadow-sm">
                <CardContent className="pt-4 pb-3">
                  {trafficQuery.isLoading ? (
                    <div className="text-2xl font-black text-slate-200 animate-pulse">—</div>
                  ) : (
                    <div className="text-2xl font-black text-[#0f2044]">
                      {value != null ? fmt(value as number) : "—"}
                    </div>
                  )}
                  <div className="text-xs font-semibold mt-1">{label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Timeseries sparkline + Top Pages + Top Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Timeseries */}
            <Card className="lg:col-span-1 border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-[#0f2044] uppercase tracking-wider">Daily Visitors</CardTitle>
              </CardHeader>
              <CardContent>
                {trafficQuery.isLoading ? (
                  <div className="text-xs text-muted-foreground py-4">Loading…</div>
                ) : !traffic?.timeseries?.length ? (
                  <div className="text-xs text-muted-foreground py-4">No data</div>
                ) : (
                  <div className="flex items-end gap-0.5 h-24">
                    {traffic.timeseries.map((d) => {
                      const max = Math.max(...traffic.timeseries!.map(x => x.visitors), 1);
                      const pct = Math.max((d.visitors / max) * 100, 2);
                      return (
                        <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5" title={`${d.date}: ${d.visitors} visitors`}>
                          <div
                            className="w-full rounded-sm bg-[#0f2044] opacity-80 hover:opacity-100 transition-opacity"
                            style={{ height: `${pct}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Pages */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-[#0f2044] uppercase tracking-wider">Top Pages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {trafficQuery.isLoading ? (
                  <div className="text-xs text-muted-foreground py-4">Loading…</div>
                ) : !traffic?.topPages?.length ? (
                  <div className="text-xs text-muted-foreground py-4">No data</div>
                ) : (
                  traffic.topPages.slice(0, 8).map((p) => (
                    <div key={p.page} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground truncate flex-1" title={p.page}>
                        {p.page === "/" ? "Home" : p.page.replace(/^\//,"")}
                      </span>
                      <span className="text-xs font-bold text-[#0f2044] shrink-0">{p.visitors.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Top Sources */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-[#0f2044] uppercase tracking-wider">Top Sources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {trafficQuery.isLoading ? (
                  <div className="text-xs text-muted-foreground py-4">Loading…</div>
                ) : !traffic?.topSources?.length ? (
                  <div className="text-xs text-muted-foreground py-4">No data</div>
                ) : (
                  (() => {
                    const total = traffic.topSources.reduce((s, x) => s + x.visitors, 0);
                    return traffic.topSources.slice(0, 8).map((s) => {
                      const pct = total > 0 ? Math.round((s.visitors / total) * 100) : 0;
                      return (
                        <div key={s.source} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-24 truncate shrink-0">{s.source || "Direct"}</span>
                          <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#0f2044] rounded-full"
                              style={{ width: `${Math.max(pct, 2)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-[#0f2044] w-8 text-right shrink-0">{s.visitors}</span>
                        </div>
                      );
                    });
                  })()
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Funnel + Source + Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1 border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-[#0f2044] uppercase tracking-wider">Pipeline Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              {statsQuery.isLoading ? (
                <div className="text-sm text-muted-foreground py-4">Loading…</div>
              ) : (
                <FunnelChart stageCounts={stageCounts} />
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-1 border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-[#0f2044] uppercase tracking-wider">Lead Source</CardTitle>
                <div className="flex gap-1">
                  {(["7d", "30d", "all"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setSourcePeriod(p)}
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold transition-colors ${
                        sourcePeriod === p
                          ? "bg-[#0f2044] text-white"
                          : "bg-slate-100 text-muted-foreground hover:bg-slate-200"
                      }`}
                    >
                      {p === "all" ? "All" : p}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {statsQuery.isLoading ? (
                <div className="text-sm text-muted-foreground py-4">Loading…</div>
              ) : (
                <SourceChart sourceCounts={sourceCounts} />
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-1 border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-[#0f2044] uppercase tracking-wider">Ad Attribution</CardTitle>
                <div className="flex gap-1">
                  {(["7d", "30d", "all"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setUtmPeriod(p)}
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold transition-colors ${
                        utmPeriod === p
                          ? "bg-[#0f2044] text-white"
                          : "bg-slate-100 text-muted-foreground hover:bg-slate-200"
                      }`}
                    >
                      {p === "all" ? "All" : p}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {utmQuery.isLoading ? (
                <div className="text-sm text-muted-foreground py-4">Loading…</div>
              ) : (
                <UtmChart rows={utmQuery.data ?? []} />
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-[#0f2044] uppercase tracking-wider">Stage Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {STAGE_ORDER.map(stage => {
                const count = stageCounts.find(s => s.stage === stage)?.count ?? 0;
                if (count === 0) return null;
                return (
                  <div key={stage} className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STAGE_COLORS[stage]}`}>
                      {STAGE_LABELS[stage]}
                    </span>
                    <span className="text-sm font-bold text-[#0f2044]">{count}</span>
                  </div>
                );
              })}
              {stageCounts.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">No contacts yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contacts Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-sm font-bold text-[#0f2044] uppercase tracking-wider">
                Contacts ({filtered.length})
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Input
                  placeholder="Search name, email, phone…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="h-8 text-xs w-48"
                />
                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="h-8 text-xs w-36">
                    <SelectValue placeholder="All Stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Stages</SelectItem>
                    {STAGE_ORDER.map(s => <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={scoreFilter} onValueChange={setScoreFilter}>
                  <SelectTrigger className="h-8 text-xs w-28">
                    <SelectValue placeholder="All Scores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Scores</SelectItem>
                    <SelectItem value="HOT">🔥 Hot</SelectItem>
                    <SelectItem value="WARM">🌤 Warm</SelectItem>
                    <SelectItem value="COLD">❄️ Cold</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-8 text-xs w-28">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="BUYER">Buyer</SelectItem>
                    <SelectItem value="AGENT">Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {contactsQuery.isLoading ? (
              <div className="text-sm text-muted-foreground p-6">Loading contacts…</div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-muted-foreground p-6 text-center">
                {contacts.length === 0 ? "No contacts yet. Submit the website form to create the first lead." : "No contacts match the current filters."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      {["Name", "Type", "Stage", "Score", "Timeline", "Source", "Created", ""].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-muted-foreground px-4 py-2.5 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c, i) => (
                      <tr
                        key={c.id}
                        className={`border-b last:border-0 hover:bg-slate-50 cursor-pointer transition-colors ${i % 2 === 0 ? "" : "bg-slate-50/50"}`}
                        onClick={() => setSelectedId(c.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-[#0f2044]">{c.firstName} {c.lastName}</div>
                          <div className="text-xs text-muted-foreground">{c.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.contactType === "BUYER" ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-700"}`}>
                            {c.contactType === "BUYER" ? "Buyer" : "Agent"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STAGE_COLORS[c.pipelineStage]}`}>
                            {STAGE_LABELS[c.pipelineStage]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {c.leadScore ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${SCORE_COLORS[c.leadScore]}`}>
                              {c.leadScore}
                            </span>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{formatTimeline(c.timeline)}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{c.source}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(c.createdAt)}</td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-[#0f2044] hover:bg-[#0f2044]/10"
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
  );
}
