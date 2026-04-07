import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import LeadDetail from "./LeadDetail";
import SCOPSNav from "@/components/SCOPSNav";

// ─── Pipeline Stages ──────────────────────────────────────────────────────────

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

// Stage bar colors — matching the mockup's blue gradient palette
const STAGE_BAR_COLORS: Record<string, string> = {
  NEW_INQUIRY:      "linear-gradient(90deg, #4a90d9, #5ba3e8)",
  QUALIFIED:        "linear-gradient(90deg, #4a9fd4, #5ab5e0)",
  TOUR_SCHEDULED:   "linear-gradient(90deg, #4aadca, #5ac4d8)",
  TOURED:           "linear-gradient(90deg, #4ab8b8, #5acfca)",
  OFFER_SUBMITTED:  "linear-gradient(90deg, #6ab4a0, #7dcbb5)",
  UNDER_CONTRACT:   "linear-gradient(90deg, #8aaa80, #9ec490)",
  CLOSED:           "linear-gradient(90deg, #a8a060, #c0b870)",
};

const STAGE_PILL_COLORS: Record<string, { bg: string; text: string }> = {
  NEW_INQUIRY:      { bg: "rgba(74,144,217,0.15)",  text: "#2563eb" },
  QUALIFIED:        { bg: "rgba(74,159,212,0.15)",  text: "#0891b2" },
  TOUR_SCHEDULED:   { bg: "rgba(74,173,202,0.15)",  text: "#0e7490" },
  TOURED:           { bg: "rgba(74,184,184,0.15)",  text: "#0f766e" },
  OFFER_SUBMITTED:  { bg: "rgba(106,180,160,0.15)", text: "#047857" },
  UNDER_CONTRACT:   { bg: "rgba(138,170,128,0.15)", text: "#65a30d" },
  CLOSED:           { bg: "rgba(168,160,96,0.15)",  text: "#a16207" },
  LOST:             { bg: "rgba(239,68,68,0.12)",   text: "#dc2626" },
};

const SCORE_PILL: Record<string, { bg: string; text: string }> = {
  HOT:  { bg: "rgba(239,68,68,0.12)",   text: "#dc2626" },
  WARM: { bg: "rgba(245,158,11,0.12)",  text: "#d97706" },
  COLD: { bg: "rgba(59,130,246,0.12)",  text: "#2563eb" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
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

// ─── Glass Card ───────────────────────────────────────────────────────────────

function GlassCard({
  children,
  className = "",
  style = {},
  noPad = false,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  noPad?: boolean;
}) {
  return (
    <div
      className={className}
      style={{
        background: "rgba(255,255,255,0.62)",
        backdropFilter: "blur(20px) saturate(1.6)",
        WebkitBackdropFilter: "blur(20px) saturate(1.6)",
        border: "1px solid rgba(255,255,255,0.75)",
        borderRadius: 18,
        boxShadow: "0 4px 24px rgba(30,60,120,0.08), 0 1px 3px rgba(30,60,120,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
        padding: noPad ? 0 : "20px 22px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

const KPI_BAR_COLORS = [
  "linear-gradient(90deg, #4a90d9 0%, #7eb8f0 100%)",
  "linear-gradient(90deg, #4aadca 0%, #7ed4e8 100%)",
  "linear-gradient(90deg, #e07b39 0%, #f0a870 100%)",
  "linear-gradient(90deg, #4a90d9 0%, #6ab4f0 100%)",
  "linear-gradient(90deg, #7c6ad9 0%, #a89cf0 100%)",
  "linear-gradient(90deg, #4ab8b8 0%, #7adcdc 100%)",
];

function KpiCard({
  label,
  value,
  unit,
  badge,
  badgeUp,
  barPct,
  colorIdx,
  loading,
}: {
  label: string;
  value: string | number;
  unit?: string;
  badge?: string | number;
  badgeUp?: boolean;
  barPct?: number;
  colorIdx: number;
  loading?: boolean;
}) {
  const barColor = KPI_BAR_COLORS[colorIdx % KPI_BAR_COLORS.length];
  return (
    <GlassCard>
      <div className="text-[11px] font-semibold text-slate-500 mb-2 leading-tight">{label}</div>
      {loading ? (
        <div className="h-8 w-20 bg-white/60 rounded-lg animate-pulse mb-3" />
      ) : (
        <div className="flex items-baseline gap-1.5 mb-2">
          <span className="text-[28px] font-black text-slate-800 leading-none tracking-tight">{value}</span>
          {unit && <span className="text-[13px] font-semibold text-slate-500">{unit}</span>}
          {badge !== undefined && (
            <span
              className="ml-auto text-[11px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5"
              style={{
                background: badgeUp === false ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                color: badgeUp === false ? "#dc2626" : "#16a34a",
              }}
            >
              {badgeUp === false ? "▼" : "▲"} {badge}
            </span>
          )}
        </div>
      )}
      {/* Progress bar */}
      <div
        style={{
          height: 4,
          borderRadius: 4,
          background: "rgba(0,0,0,0.06)",
          overflow: "hidden",
          marginTop: 4,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(barPct ?? 60, 100)}%`,
            background: barColor,
            borderRadius: 4,
            transition: "width 0.6s ease",
          }}
        />
      </div>
    </GlassCard>
  );
}

// ─── Pipeline Funnel ──────────────────────────────────────────────────────────

function PipelineFunnel({ stageCounts }: { stageCounts: { stage: string; count: number }[] }) {
  const activeStages = PIPELINE_STAGES.filter(s => s !== "LOST" && s !== "CLOSED");
  const countMap = Object.fromEntries(stageCounts.map(s => [s.stage, s.count]));
  const maxCount = Math.max(...activeStages.map(s => countMap[s] ?? 0), 1);
  const firstCount = countMap[activeStages[0]] || 1;
  const totalActive = activeStages.reduce((sum, s) => sum + (countMap[s] ?? 0), 0);
  const closedCount = countMap["CLOSED"] ?? 0;
  const conversionPct = firstCount > 0 ? Math.round((closedCount / firstCount) * 100) : 0;
  const pipelineValue = totalActive * 425000; // estimated avg deal value

  return (
    <div>
      <div className="space-y-2 mb-4">
        {activeStages.map((stage, i) => {
          const count = countMap[stage] ?? 0;
          const pct = Math.round((count / maxCount) * 100);
          return (
            <div key={stage} className="flex items-center gap-2.5">
              <div
                className="flex items-center justify-between px-3 rounded-lg text-[12px] font-semibold text-white transition-all duration-500"
                style={{
                  width: `${Math.max(pct, count > 0 ? 20 : 8)}%`,
                  minWidth: 110,
                  height: 32,
                  background: count > 0 ? STAGE_BAR_COLORS[stage] : "rgba(0,0,0,0.06)",
                  color: count > 0 ? "white" : "#94a3b8",
                }}
              >
                <span className="truncate">{STAGE_LABELS[stage]}</span>
                <span className="ml-2 font-black">{count}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-white/40">
        <div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Conversion</div>
          <div className="text-[20px] font-black text-slate-700">{conversionPct}%</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Pipeline Value</div>
          <div className="text-[20px] font-black text-slate-700">{formatCurrency(pipelineValue)}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Revenue Forecast ─────────────────────────────────────────────────────────

function RevenueForecast({
  forecast,
  loading,
}: {
  forecast?: { days30: number; days60: number; days90: number } | null;
  loading?: boolean;
}) {
  const d30 = forecast?.days30 ?? 0;
  const d60 = forecast?.days60 ?? 0;
  const d90 = forecast?.days90 ?? 0;
  const total = d30 + d60 + d90;
  const maxVal = Math.max(d30, d60, d90, 1);

  const bars = [
    { label: "30 days", value: d30, color: "linear-gradient(180deg, #7eb8f0 0%, #4a90d9 100%)" },
    { label: "60 days", value: d60, color: "linear-gradient(180deg, #7eb8f0 0%, #4a90d9 100%)" },
    { label: "90 days", value: d90, color: "linear-gradient(180deg, #7eb8f0 0%, #4a90d9 100%)" },
  ];

  if (loading) return <div className="h-40 flex items-center justify-center text-slate-400 text-sm">Loading…</div>;

  return (
    <div>
      {/* Big numbers row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {bars.map(b => (
          <div key={b.label} className="text-center">
            <div className="text-[22px] font-black text-slate-800 leading-none">
              {b.value > 0 ? formatCurrency(b.value) : "—"}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">{b.label}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-4 h-28 mb-3">
        {bars.map(b => {
          const heightPct = maxVal > 0 ? Math.max((b.value / maxVal) * 100, b.value > 0 ? 8 : 0) : 0;
          return (
            <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end" style={{ height: 96 }}>
                <div
                  className="w-full rounded-t-lg transition-all duration-700"
                  style={{
                    height: `${heightPct}%`,
                    background: b.value > 0 ? b.color : "rgba(0,0,0,0.06)",
                    minHeight: b.value > 0 ? 8 : 0,
                    boxShadow: b.value > 0 ? "0 -2px 8px rgba(74,144,217,0.3)" : "none",
                  }}
                />
              </div>
              <div className="text-[10px] text-slate-400 font-medium">{b.label}</div>
            </div>
          );
        })}
      </div>

      {/* Total forecast */}
      <div
        className="flex items-center justify-between px-3 py-2 rounded-xl"
        style={{ background: "rgba(74,144,217,0.08)", border: "1px solid rgba(74,144,217,0.15)" }}
      >
        <span className="text-[11px] text-slate-500 font-semibold">Total Forecast</span>
        <span className="text-[14px] font-black text-[#2563eb]">{total > 0 ? formatCurrency(total) : "—"}</span>
      </div>
    </div>
  );
}

// ─── Inventory Health Card ────────────────────────────────────────────────────

function InventoryHealthCard({
  title,
  items,
  emptyMsg,
  loading,
}: {
  title: string;
  items: { id: number; address: string; price: string; dom: number; leadCount: number; imageUrl?: string | null }[];
  emptyMsg: string;
  loading?: boolean;
}) {
  const PLACEHOLDER = "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=120&h=80&fit=crop&auto=format";
  return (
    <div>
      <div className="text-[12px] font-bold text-slate-600 mb-3">{title}</div>
      {loading ? (
        <div className="text-sm text-slate-400">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-[12px] text-slate-400 py-2">{emptyMsg}</div>
      ) : (
        <div className="space-y-2.5">
          {items.map(p => (
            <div
              key={p.id}
              className="flex items-center gap-3 p-2.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.7)" }}
            >
              <img
                src={p.imageUrl || PLACEHOLDER}
                alt={p.address}
                className="w-14 h-10 rounded-lg object-cover flex-shrink-0"
                style={{ border: "1px solid rgba(255,255,255,0.6)" }}
                onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-slate-800 truncate">{p.address}</div>
                <div className="text-[11px] text-slate-400">{p.price} · {p.dom}d DOM</div>
              </div>
              <div className="text-[11px] font-bold text-slate-500 shrink-0">{p.leadCount} leads</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Deals at Risk ────────────────────────────────────────────────────────────

function DealsAtRisk({
  deals,
  loading,
  onView,
}: {
  deals: { id: number; name: string; stage: string; issue: string }[];
  loading?: boolean;
  onView: (id: number) => void;
}) {
  if (loading) return <div className="text-sm text-slate-400 py-2">Loading…</div>;
  if (deals.length === 0) return (
    <div className="text-[12px] text-slate-400 py-2">No at-risk deals. Pipeline looks healthy.</div>
  );
  return (
    <div className="space-y-2.5">
      {deals.map((d, i) => (
        <div
          key={d.id}
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.55)",
            border: "1px solid rgba(255,255,255,0.7)",
          }}
        >
          {/* Stage badge number */}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
            style={{ background: i === 0 ? "#2563eb" : i === 1 ? "#0891b2" : "#6366f1" }}
          >
            {i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-bold text-slate-800">{STAGE_LABELS[d.stage] ?? d.stage}</div>
            <div className="text-[11px] text-slate-500 truncate">{d.issue}</div>
          </div>
          <button
            onClick={() => onView(d.id)}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
          >
            Follow-Up
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

function ActivityFeed({
  items,
  loading,
}: {
  items: { id: number; activityType: string; description: string; firstName?: string | null; lastName?: string | null; createdAt: Date | string }[];
  loading?: boolean;
}) {
  const PLACEHOLDER = "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=60&h=60&fit=crop&auto=format";
  if (loading) return <div className="text-sm text-slate-400 py-2">Loading…</div>;
  if (items.length === 0) return <div className="text-[12px] text-slate-400 py-2">No recent activity.</div>;
  return (
    <div className="space-y-2.5">
      {items.map(a => (
        <div
          key={a.id}
          className="flex items-center gap-3 p-2.5 rounded-xl"
          style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.7)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #4a90d9, #2563eb)" }}
          >
            {a.firstName ? a.firstName.charAt(0).toUpperCase() : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-slate-800 truncate">
              {a.firstName && a.lastName ? `${a.firstName} ${a.lastName}` : "System"}
            </div>
            <div className="text-[11px] text-slate-500 truncate">{a.description}</div>
          </div>
          <div className="text-[10px] text-slate-400 shrink-0">{timeAgo(a.createdAt)}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Source Performance ───────────────────────────────────────────────────────

const SOURCE_ICONS: Record<string, string> = {
  ZILLOW: "🏠",
  FACEBOOK_ADS: "📘",
  GOOGLE_ADS: "🔍",
  REFERRAL: "🤝",
  WEBSITE: "🌐",
  REALTOR: "🏡",
  INSTAGRAM: "📸",
  WORD_OF_MOUTH: "💬",
};

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

  const dashboardQuery = trpc.dashboard.overview.useQuery();
  const statsQuery = trpc.leads.dashboardStats.useQuery({ sourcePeriod: "all" });
  const contactsQuery = trpc.leads.list.useQuery({
    pipelineStage: stageFilter !== "ALL" ? stageFilter as any : undefined,
    leadScore: scoreFilter !== "ALL" ? scoreFilter as any : undefined,
  });

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: "linear-gradient(135deg, #c8d8f0 0%, #dce8f8 40%, #e8f0fc 70%, #d0dff5 100%)" }}
      >
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    );
  }

  if (!adminUser) {
    window.location.href = "/admin-login";
    return null;
  }

  const contacts = contactsQuery.data ?? [];
  const dash = dashboardQuery.data;
  const stageCounts = statsQuery.data?.stageCounts ?? [];

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

  const slowMoving = inventoryHealth.filter(p => p.dom > 60).slice(0, 4);
  const mostDemanded = inventoryHealth.filter(p => p.leadCount > 0).sort((a, b) => b.leadCount - a.leadCount).slice(0, 2);
  const recentlyReduced = inventoryHealth.filter(p => p.dom > 30 && p.leadCount < 2).slice(0, 2);

  // KPI bar percentages (relative to reasonable maxes)
  const availablePct = Math.min(((inv?.available ?? 0) / 30) * 100, 100);
  const underContractPct = Math.min(((inv?.underContract ?? 0) / 15) * 100, 100);
  const soldPct = Math.min(((inv?.soldLast30 ?? 0) / 10) * 100, 100);
  const revenuePct = Math.min(((inv?.revenueMtd ?? 0) / 5_000_000) * 100, 100);
  const toursPct = Math.min(((dash?.toursThisWeek ?? 0) / 20) * 100, 100);
  const absorptionPct = Math.min((dash?.absorptionRate ?? 0), 100);

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(145deg, #b8ccec 0%, #cddaf5 25%, #dce8fb 50%, #c8d8f0 75%, #b8c8e8 100%)",
        backgroundAttachment: "fixed",
      }}
    >
      <SCOPSNav adminUser={adminUser} currentPage="dashboard" />

      <div className="px-5 py-5 max-w-screen-2xl mx-auto space-y-5">

        {/* ── Row 1: KPI Cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard label="Units Available"      value={inv?.available ?? "—"}                                   unit="units"  badge={2}   badgeUp={true}  barPct={availablePct}    colorIdx={0} loading={dashboardQuery.isLoading} />
          <KpiCard label="Units Under Contract" value={inv?.underContract ?? "—"}                               unit="units"  badge={1}   badgeUp={true}  barPct={underContractPct} colorIdx={1} loading={dashboardQuery.isLoading} />
          <KpiCard label={`Units Sold (30d)`}   value={inv?.soldLast30 ?? "—"}                                  unit="units"  badge={1}   badgeUp={false} barPct={soldPct}         colorIdx={2} loading={dashboardQuery.isLoading} />
          <KpiCard label="Revenue Closed (MTD)" value={inv ? formatCurrency(inv.revenueMtd) : "—"}                            badge={undefined}               barPct={revenuePct}      colorIdx={3} loading={dashboardQuery.isLoading} />
          <KpiCard label="Tours Scheduled This Week" value={dash?.toursThisWeek ?? "—"}                         unit="tours"  badge={4}   badgeUp={true}  barPct={toursPct}        colorIdx={4} loading={dashboardQuery.isLoading} />
          <KpiCard label="Absorption Rate"      value={dash?.absorptionRate != null ? `${dash.absorptionRate}%` : "—"}        badge={undefined}               barPct={absorptionPct}   colorIdx={5} loading={dashboardQuery.isLoading} />
        </div>

        {/* ── Row 2: Pipeline + Revenue Forecast + Inventory Health ─────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Pipeline Funnel */}
          <GlassCard>
            <div className="text-[13px] font-bold text-slate-700 mb-4">Pipeline Funnel</div>
            {statsQuery.isLoading ? (
              <div className="text-sm text-slate-400 py-4">Loading…</div>
            ) : (
              <PipelineFunnel stageCounts={stageCounts} />
            )}
          </GlassCard>

          {/* Revenue Forecast */}
          <GlassCard>
            <div className="text-[13px] font-bold text-slate-700 mb-4">Revenue Forecast</div>
            <RevenueForecast forecast={forecast} loading={dashboardQuery.isLoading} />
          </GlassCard>

          {/* Inventory Health */}
          <GlassCard>
            <div className="text-[13px] font-bold text-slate-700 mb-4">Inventory Health</div>
            <div className="space-y-5">
              <InventoryHealthCard
                title="Slow-Moving Units"
                items={slowMoving}
                emptyMsg="No properties over 60 days on market."
                loading={dashboardQuery.isLoading}
              />
              <InventoryHealthCard
                title="Most Demanded Properties"
                items={mostDemanded}
                emptyMsg="No demand data yet."
                loading={dashboardQuery.isLoading}
              />
              <InventoryHealthCard
                title="Recently Reduced Prices"
                items={recentlyReduced}
                emptyMsg="No recently reduced listings."
                loading={dashboardQuery.isLoading}
              />
            </div>
          </GlassCard>
        </div>

        {/* ── Row 3: Source Performance + Deals at Risk + Activity Feed ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Source Performance */}
          <GlassCard noPad>
            <div className="px-5 pt-5 pb-3">
              <div className="text-[13px] font-bold text-slate-700">Source Performance</div>
            </div>
            {dashboardQuery.isLoading ? (
              <div className="text-sm text-slate-400 px-5 pb-5">Loading…</div>
            ) : sourcePerf.filter(s => s.leads > 0).length === 0 ? (
              <div className="text-[12px] text-slate-400 px-5 pb-5">No leads yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.5)" }}>
                      {["", "LEADS", "CONTRACTS", "REVENUE"].map(h => (
                        <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-2.5">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sourcePerf.filter(s => s.leads > 0).map(s => (
                      <tr key={s.source} style={{ borderBottom: "1px solid rgba(255,255,255,0.4)" }} className="last:border-0">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[14px]">{SOURCE_ICONS[s.source] ?? "📊"}</span>
                            <span className="font-semibold text-slate-700">{s.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 font-black text-slate-800">{s.leads}</td>
                        <td className="px-4 py-2.5 font-semibold text-slate-600">{s.contracts}</td>
                        <td className="px-4 py-2.5 font-bold text-[#2563eb]">
                          {s.contracts > 0 ? formatCurrency(s.contracts * 425000) : "—"}
                        </td>
                      </tr>
                    ))}
                    {/* Totals row */}
                    {sourcePerf.filter(s => s.leads > 0).length > 1 && (
                      <tr style={{ borderTop: "1px solid rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.3)" }}>
                        <td className="px-4 py-2.5 font-bold text-slate-600" />
                        <td className="px-4 py-2.5 font-black text-slate-800">
                          {sourcePerf.reduce((s, r) => s + r.leads, 0)}
                        </td>
                        <td className="px-4 py-2.5 font-black text-slate-800">
                          {sourcePerf.reduce((s, r) => s + r.contracts, 0)}
                        </td>
                        <td className="px-4 py-2.5 font-black text-[#2563eb]">
                          {formatCurrency(sourcePerf.reduce((s, r) => s + r.contracts * 425000, 0))}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>

          {/* Deals at Risk */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <div className="text-[13px] font-bold text-slate-700">Deals at Risk</div>
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                style={{ background: "#ef4444" }}
                title="Leads with no contact in 48+ hours"
              >
                !
              </div>
            </div>
            <DealsAtRisk deals={atRisk} loading={dashboardQuery.isLoading} onView={setSelectedId} />
          </GlassCard>

          {/* Recent Activity */}
          <GlassCard>
            <div className="text-[13px] font-bold text-slate-700 mb-4">Recent Activity</div>
            <ActivityFeed items={activity} loading={dashboardQuery.isLoading} />
          </GlassCard>
        </div>

        {/* ── Row 4: Active Pipeline Table ─────────────────────────────── */}
        <GlassCard noPad>
          <div className="px-5 pt-5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-[13px] font-bold text-slate-700">
              Active Pipeline
              <span className="ml-2 text-[11px] font-semibold text-slate-400">{filtered.length} contacts</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Search name, email, phone…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-8 text-xs w-44"
                style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.8)" }}
              />
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="h-8 text-xs w-36" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.8)" }}>
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
                <SelectTrigger className="h-8 text-xs w-28" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.8)" }}>
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
          {contactsQuery.isLoading ? (
            <div className="text-sm text-slate-400 px-5 pb-5">Loading contacts…</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-slate-400 px-5 pb-5 text-center py-8">
              {contacts.length === 0
                ? "No contacts yet. Submit the website form to create the first lead."
                : "No contacts match the current filters."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.3)" }}>
                    {["Name", "Stage", "Score", "Timeline", "Last Activity", "Next Action", ""].map(h => (
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
                      className="cursor-pointer transition-colors"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.4)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.35)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      onClick={() => setSelectedId(c.id)}
                    >
                      <td className="px-5 py-3">
                        <div className="font-semibold text-slate-800">{c.firstName} {c.lastName}</div>
                        <div className="text-[11px] text-slate-400">{c.email}</div>
                      </td>
                      <td className="px-5 py-3">
                        {(() => {
                          const p = STAGE_PILL_COLORS[c.pipelineStage] ?? { bg: "rgba(0,0,0,0.06)", text: "#64748b" };
                          return (
                            <span
                              className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: p.bg, color: p.text }}
                            >
                              {STAGE_LABELS[c.pipelineStage]}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-5 py-3">
                        {c.leadScore ? (() => {
                          const p = SCORE_PILL[c.leadScore] ?? { bg: "rgba(0,0,0,0.06)", text: "#64748b" };
                          return (
                            <span
                              className="text-[11px] px-2 py-0.5 rounded-full font-bold"
                              style={{ background: p.bg, color: p.text }}
                            >
                              {c.leadScore}
                            </span>
                          );
                        })() : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3 text-slate-500">{formatTimeline(c.timeline)}</td>
                      <td className="px-5 py-3 text-slate-400">
                        {timeAgo((c as any).lastContactedAt ?? c.updatedAt)}
                      </td>
                      <td className="px-5 py-3 text-slate-500 max-w-[160px] truncate">
                        {(c as any).nextAction ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          className="px-3 py-1 rounded-lg text-[11px] font-bold text-slate-600 transition-all hover:bg-white/60"
                          style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.7)" }}
                          onClick={e => { e.stopPropagation(); setSelectedId(c.id); }}
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>

      </div>
    </div>
  );
}
