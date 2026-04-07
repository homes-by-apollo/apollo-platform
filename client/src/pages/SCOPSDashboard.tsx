import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useLocation } from "wouter";
import LeadDetail from "./LeadDetail";
import SCOPSNav from "@/components/SCOPSNav";

// ─── Constants ────────────────────────────────────────────────────────────────

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

// Stage bar gradient colors
const STAGE_COLORS: Record<string, string> = {
  NEW_INQUIRY:      "linear-gradient(90deg,#4a90d9,#5ba3e8)",
  QUALIFIED:        "linear-gradient(90deg,#4a9fd4,#5ab5e0)",
  TOUR_SCHEDULED:   "linear-gradient(90deg,#4aadca,#5ac4d8)",
  TOURED:           "linear-gradient(90deg,#4ab8b8,#5acfca)",
  OFFER_SUBMITTED:  "linear-gradient(90deg,#6ab4a0,#7dcbb5)",
  UNDER_CONTRACT:   "linear-gradient(90deg,#8aaa80,#9ec490)",
  CLOSED:           "linear-gradient(90deg,#a8a060,#c0b870)",
};

const STAGE_PILL: Record<string, { bg: string; text: string }> = {
  NEW_INQUIRY:      { bg:"rgba(74,144,217,.15)",  text:"#2563eb" },
  QUALIFIED:        { bg:"rgba(74,159,212,.15)",  text:"#0891b2" },
  TOUR_SCHEDULED:   { bg:"rgba(74,173,202,.15)",  text:"#0e7490" },
  TOURED:           { bg:"rgba(74,184,184,.15)",  text:"#0f766e" },
  OFFER_SUBMITTED:  { bg:"rgba(106,180,160,.15)", text:"#047857" },
  UNDER_CONTRACT:   { bg:"rgba(138,170,128,.15)", text:"#65a30d" },
  CLOSED:           { bg:"rgba(168,160,96,.15)",  text:"#a16207" },
  LOST:             { bg:"rgba(239,68,68,.12)",   text:"#dc2626" },
};

const SCORE_PILL: Record<string, { bg: string; text: string }> = {
  HOT:  { bg:"rgba(239,68,68,.12)",  text:"#dc2626" },
  WARM: { bg:"rgba(245,158,11,.12)", text:"#d97706" },
  COLD: { bg:"rgba(59,130,246,.12)", text:"#2563eb" },
};

const RISK_URGENCY_COLOR = (hoursStale: number) => {
  if (hoursStale >= 168) return { bg:"rgba(239,68,68,.12)", border:"rgba(239,68,68,.3)", badge:"#dc2626", label:"CRITICAL" };
  if (hoursStale >= 72)  return { bg:"rgba(245,158,11,.10)", border:"rgba(245,158,11,.3)", badge:"#d97706", label:"HIGH" };
  return                        { bg:"rgba(59,130,246,.08)", border:"rgba(59,130,246,.2)", badge:"#2563eb", label:"WATCH" };
};

const KPI_BAR_COLORS = [
  "linear-gradient(90deg,#4a90d9,#7eb8f0)",
  "linear-gradient(90deg,#4aadca,#7ed4e8)",
  "linear-gradient(90deg,#e07b39,#f0a870)",
  "linear-gradient(90deg,#4a90d9,#6ab4f0)",
  "linear-gradient(90deg,#7c6ad9,#a89cf0)",
  "linear-gradient(90deg,#4ab8b8,#7adcdc)",
];

const SOURCE_ICONS: Record<string, string> = {
  ZILLOW:"🏠", FACEBOOK_ADS:"📘", GOOGLE_ADS:"🔍", REFERRAL:"🤝",
  WEBSITE:"🌐", REALTOR:"🏡", INSTAGRAM:"📸", WORD_OF_MOUTH:"💬",
  AGENT:"🤝", OTHER:"📊",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt$(n: number): string {
  if (n >= 1_000_000) return `$${(n/1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n/1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function timeAgo(d: Date | string | null | undefined): string {
  if (!d) return "never";
  const h = Math.floor((Date.now() - new Date(d).getTime()) / 3_600_000);
  if (h < 1)  return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

function fmtTimeline(t: string | null | undefined): string {
  const m: Record<string,string> = {
    ASAP:"ASAP","1_3_MONTHS":"1–3 mo","3_6_MONTHS":"3–6 mo",
    "6_12_MONTHS":"6–12 mo",JUST_BROWSING:"Browsing",
  };
  return t ? (m[t] ?? t) : "—";
}

// ─── Glass Card ───────────────────────────────────────────────────────────────

function GC({
  children, className="", style={}, noPad=false,
}: { children: React.ReactNode; className?: string; style?: React.CSSProperties; noPad?: boolean }) {
  return (
    <div className={className} style={{
      background: "#ffffff",
      border: "1px solid #e2e6ed",
      borderRadius: 12,
      boxShadow: "0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
      padding: noPad ? 0 : "16px 18px",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SH({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="flex items-baseline gap-2 mb-3">
      <span className="crm-section-header">{children}</span>
      {sub && <span className="text-[11px] font-medium text-gray-400">{sub}</span>}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, unit, delta, deltaLabel, barPct, colorIdx, loading,
}: {
  label: string; value: string|number; unit?: string;
  delta?: number; deltaLabel?: string;
  barPct?: number; colorIdx: number; loading?: boolean;
}) {
  const isUp = (delta ?? 0) >= 0;
  return (
    <GC style={{ padding:"14px 16px" }}>
      <div className="crm-card-label mb-1.5 leading-tight">{label}</div>
      {loading ? (
        <div className="h-7 w-16 rounded-lg animate-pulse mb-2 bg-gray-100" />
      ) : (
        <div className="flex items-baseline gap-1 mb-1.5">
          <span className="crm-metric-primary" style={{ fontSize: 26 }}>{value}</span>
          {unit && <span className="text-[12px] font-semibold text-gray-400">{unit}</span>}
        </div>
      )}
      {/* Micro-signal */}
      {delta !== undefined && (
        <div className="flex items-center gap-1 mb-1.5">
          <span className={`text-[10px] font-bold ${isUp ? 'crm-metric-positive' : 'crm-metric-negative'}`}>
            {isUp ? "▲" : "▼"} {Math.abs(delta)}
          </span>
          {deltaLabel && <span className="crm-metric-supporting text-[10px] mt-0">{deltaLabel}</span>}
        </div>
      )}
      <div style={{ height:3, borderRadius:3, background:"#f1f3f7", overflow:"hidden" }}>
        <div style={{
          height:"100%", width:`${Math.min(barPct??60,100)}%`,
          background: KPI_BAR_COLORS[colorIdx % KPI_BAR_COLORS.length],
          borderRadius:3, transition:"width .6s ease",
        }} />
      </div>
    </GC>
  );
}

// ─── Deals at Risk (Primary Action Center) ────────────────────────────────────

type RiskDeal = {
  id: number; name: string; stage: string; leadScore?: string | null;
  issue: string; hoursStale: number; lastContactedAt?: Date | string | null;
  primaryPropertyAddress?: string | null;
};

function DealsAtRisk({
  deals, loading, onView,
}: { deals: RiskDeal[]; loading?: boolean; onView: (id: number) => void }) {
  if (loading) return (
    <div className="space-y-2">
      {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}
    </div>
  );
  if (deals.length === 0) return (
    <div className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background:"#f0fdf4", border:"1px solid #bbf7d0" }}>
      <span className="text-[18px]">✅</span>
      <div>
        <div className="text-[12px] font-bold text-green-700">Pipeline is healthy</div>
        <div className="text-[11px] text-green-600">All active leads contacted within 48 hours</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      {deals.map((d) => {
        const urg = RISK_URGENCY_COLOR(d.hoursStale);
        const scoreP = d.leadScore ? SCORE_PILL[d.leadScore] : null;
        return (
          <div
            key={d.id}
            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.005]"
            style={{ background: urg.bg, border:`1px solid ${urg.border}` }}
            onClick={() => onView(d.id)}
          >
            {/* Urgency badge */}
            <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
              <div className="w-2 h-2 rounded-full" style={{ background: urg.badge }} />
              <span className="text-[8px] font-black tracking-widest" style={{ color: urg.badge }}>{urg.label}</span>
            </div>

            {/* Lead info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[13px] font-bold text-gray-900">{d.name}</span>
                {scoreP && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ background: scoreP.bg, color: scoreP.text }}>
                    {d.leadScore}
                  </span>
                )}
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  {STAGE_LABELS[d.stage] ?? d.stage}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <span className="font-semibold" style={{ color: urg.badge }}>{d.issue}</span>
                {d.primaryPropertyAddress && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="truncate max-w-[160px]">🏠 {d.primaryPropertyAddress}</span>
                  </>
                )}
              </div>
            </div>

            {/* Last contact */}
            <div className="flex-shrink-0 text-right">
              <div className="text-[10px] text-gray-400">Last contact</div>
              <div className="text-[11px] font-bold text-gray-600">{timeAgo(d.lastContactedAt)}</div>
            </div>

            {/* CTA */}
            <button
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background:"linear-gradient(135deg,#ef4444,#dc2626)" }}
              onClick={e => { e.stopPropagation(); onView(d.id); }}
            >
              Follow Up →
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Pipeline Funnel with Conversion ─────────────────────────────────────────

function PipelineFunnel({ stageCounts }: { stageCounts: { stage: string; count: number }[] }) {
  const activeStages = PIPELINE_STAGES.filter(s => s !== "LOST" && s !== "CLOSED");
  const countMap = Object.fromEntries(stageCounts.map(s => [s.stage, s.count]));
  const maxCount = Math.max(...activeStages.map(s => countMap[s] ?? 0), 1);
  const firstCount = countMap[activeStages[0]] || 1;
  const closedCount = countMap["CLOSED"] ?? 0;
  const conversionPct = firstCount > 0 ? Math.round((closedCount / firstCount) * 100) : 0;
  const totalActive = activeStages.reduce((s, st) => s + (countMap[st] ?? 0), 0);
  const pipelineValue = totalActive * 425_000;

  return (
    <div>
      <div className="space-y-1.5 mb-3">
        {activeStages.map((stage, i) => {
          const count = countMap[stage] ?? 0;
          const pct = Math.round((count / maxCount) * 100);
          // Conversion from previous stage
          const prevStage = i > 0 ? activeStages[i - 1] : null;
          const prevCount = prevStage ? (countMap[prevStage] ?? 0) : null;
          const convFromPrev = prevCount && prevCount > 0 ? Math.round((count / prevCount) * 100) : null;
          const isBottleneck = convFromPrev !== null && convFromPrev < 40 && count > 0;

          return (
            <div key={stage}>
              {/* Conversion indicator between stages */}
              {convFromPrev !== null && (
                <div className="flex items-center gap-1.5 mb-1 ml-1">
                  <div className="w-px h-3 bg-gray-200" />
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: isBottleneck ? "rgba(239,68,68,.12)" : "rgba(34,197,94,.1)",
                      color: isBottleneck ? "#dc2626" : "#16a34a",
                    }}
                  >
                    {convFromPrev}% {isBottleneck ? "⚠ bottleneck" : "↓"}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-between px-2.5 rounded-lg text-[11px] font-semibold transition-all duration-500"
                  style={{
                    width:`${Math.max(pct, count > 0 ? 20 : 6)}%`,
                    minWidth:100, height:28,
                    background: count > 0 ? STAGE_COLORS[stage] : "#f1f3f7",
                    color: count > 0 ? "white" : "#94a3b8",
                  }}
                >
                  <span className="truncate text-[10px]">{STAGE_LABELS[stage]}</span>
                  <span className="ml-1 font-black">{count}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
        <div>
          <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Overall Conv.</div>
          <div className="text-[18px] font-black text-slate-700">{conversionPct}%</div>
        </div>
        <div className="text-right">
          <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Pipeline Value</div>
          <div className="text-[18px] font-black text-slate-700">{fmt$(pipelineValue)}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Revenue Forecast ─────────────────────────────────────────────────────────

function RevenueForecast({
  forecast, loading,
}: { forecast?: { days30:number; days60:number; days90:number; activeDeals?:number; totalForecast?:number } | null; loading?: boolean }) {
  if (loading) return <div className="h-32 flex items-center justify-center text-slate-400 text-sm">Loading…</div>;

  const d30 = forecast?.days30 ?? 0;
  const d60 = forecast?.days60 ?? 0;
  const d90 = forecast?.days90 ?? 0;
  const total = d30 + d60 + d90;
  const activeDeals = forecast?.activeDeals ?? 0;
  const maxVal = Math.max(d30, d60, d90, 1);

  if (total === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background:"#f8f9fb", border:"1px solid #e2e6ed" }}>
          <span className="text-[16px]">📋</span>
          <div>
            <div className="text-[12px] font-bold text-slate-600">No upcoming closings</div>
            <div className="text-[11px] text-slate-400">No deals with expected close dates in the next 90 days</div>
          </div>
        </div>
        {activeDeals > 0 && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background:"#eff6ff", border:"1px solid #bfdbfe" }}>
            <span className="text-[16px]">🔄</span>
            <div>
              <div className="text-[12px] font-bold text-[#2563eb]">{activeDeals} active deal{activeDeals !== 1 ? "s" : ""} in pipeline</div>
              <div className="text-[11px] text-slate-400">Add expected close dates to enable forecasting</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const bars = [
    { label:"30d", value:d30, color:"linear-gradient(180deg,#7eb8f0,#4a90d9)" },
    { label:"60d", value:d60, color:"linear-gradient(180deg,#7eb8f0,#4a90d9)" },
    { label:"90d", value:d90, color:"linear-gradient(180deg,#7eb8f0,#4a90d9)" },
  ];

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {bars.map(b => (
          <div key={b.label} className="text-center">
            <div className="text-[20px] font-black text-slate-800 leading-none">{b.value > 0 ? fmt$(b.value) : "—"}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{b.label}</div>
          </div>
        ))}
      </div>
      <div className="flex items-end gap-3 h-20 mb-2">
        {bars.map(b => {
          const h = maxVal > 0 ? Math.max((b.value/maxVal)*100, b.value > 0 ? 8 : 0) : 0;
          return (
            <div key={b.label} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full flex items-end" style={{ height:72 }}>
                <div className="w-full rounded-t-lg transition-all duration-700" style={{
                  height:`${h}%`,
                  background: b.value > 0 ? b.color : "#f1f3f7",
                  minHeight: b.value > 0 ? 6 : 0,
                  boxShadow: b.value > 0 ? "0 -2px 8px rgba(74,144,217,.3)" : "none",
                }} />
              </div>
              <div className="text-[9px] text-slate-400">{b.label}</div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl" style={{ background:"#eff6ff", border:"1px solid #bfdbfe" }}>
        <span className="text-[10px] text-slate-500 font-semibold">Total · {activeDeals} deal{activeDeals !== 1 ? "s" : ""}</span>
        <span className="text-[13px] font-black text-[#2563eb]">{fmt$(total)}</span>
      </div>
    </div>
  );
}

// ─── Inventory Health ─────────────────────────────────────────────────────────

type InvItem = {
  id: number; address: string; price: string; dom: number;
  leadCount: number; tourCount: number;
  healthFlag: "high_dom" | "zero_tours" | "high_interest_no_offer" | "ok";
  imageUrl?: string | null;
};

const HEALTH_FLAG_META: Record<string, { label: string; color: string; bg: string }> = {
  high_dom:               { label:"High DOM",           color:"#d97706", bg:"rgba(245,158,11,.12)" },
  zero_tours:             { label:"Zero Tours",         color:"#dc2626", bg:"rgba(239,68,68,.1)"  },
  high_interest_no_offer: { label:"Interest, No Offer", color:"#7c3aed", bg:"rgba(124,58,237,.1)" },
  ok:                     { label:"Healthy",            color:"#16a34a", bg:"rgba(34,197,94,.1)"  },
};

const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=120&h=80&fit=crop&auto=format";

function InventoryHealth({ items, loading }: { items: InvItem[]; loading?: boolean }) {
  if (loading) return <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-white/40 animate-pulse" />)}</div>;

  const issues = items.filter(p => p.healthFlag !== "ok");
  if (items.length === 0 || issues.length === 0) {
    return (
      <div className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background:"#f0fdf4", border:"1px solid #bbf7d0" }}>
        <span className="text-[18px]">✅</span>
        <div>
          <div className="text-[12px] font-bold text-emerald-700">All inventory performing normally</div>
          <div className="text-[11px] text-emerald-600">{items.length} active listings · no flags</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {issues.map(p => {
        const meta = HEALTH_FLAG_META[p.healthFlag];
        return (
          <div key={p.id} className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ background:"#f8f9fb", border:"1px solid #e2e6ed" }}>
            <img
              src={p.imageUrl || PLACEHOLDER_IMG}
              alt={p.address}
              className="w-12 h-9 rounded-lg object-cover flex-shrink-0"
              style={{ border:"1px solid #e2e6ed" }}
              onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMG; }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold truncate text-gray-800">{p.address}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: meta.bg, color: meta.color }}>
                  {meta.label}
                </span>
                <span className="text-[10px] text-slate-400">{p.dom}d DOM</span>
                <span className="text-[10px] text-slate-400">{p.leadCount} leads</span>
                <span className="text-[10px] text-slate-400">{p.tourCount} tours</span>
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <div className="text-[11px] font-black" style={{ color: meta.color }}>{p.price}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Source Performance ───────────────────────────────────────────────────────

function SourcePerf({ rows, loading }: { rows: { source:string; label:string; leads:number; tours:number; contracts:number }[]; loading?: boolean }) {
  if (loading) return <div className="text-sm text-gray-400">Loading…</div>;
  const active = rows.filter(r => r.leads > 0);
  if (active.length === 0) return <div className="text-[12px] py-2 text-gray-400">No leads yet.</div>;
  const totalLeads = active.reduce((s,r) => s+r.leads, 0);
  const totalContracts = active.reduce((s,r) => s+r.contracts, 0);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr style={{ borderBottom:"1px solid #e2e6ed" }}>
            {["","LEADS","TOURS","CONTRACTS","REV"].map(h => (
              <th key={h} className="text-left text-[9px] font-bold uppercase tracking-wider px-3 py-2 text-gray-400">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {active.map(s => (
            <tr key={s.source} style={{ borderBottom:"1px solid #f1f3f7" }} className="last:border-0">
              <td className="px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px]">{SOURCE_ICONS[s.source] ?? "📊"}</span>
                  <span className="font-semibold text-gray-700">{s.label}</span>
                </div>
              </td>
              <td className="px-3 py-2 font-black text-gray-900">{s.leads}</td>
              <td className="px-3 py-2 text-gray-500">{s.tours}</td>
              <td className="px-3 py-2 font-semibold" style={{ color: "#34d399" }}>{s.contracts}</td>
              <td className="px-3 py-2 font-bold" style={{ color: "#60a5fa" }}>{s.contracts > 0 ? fmt$(s.contracts*425_000) : "—"}</td>
            </tr>
          ))}
          {active.length > 1 && (
            <tr style={{ borderTop:"1px solid #e2e6ed", background:"#f8f9fb" }}>
              <td className="px-3 py-2 text-[10px] font-bold text-gray-400">TOTAL</td>
              <td className="px-3 py-2 font-black text-gray-900">{totalLeads}</td>
              <td className="px-3 py-2 text-gray-500">{active.reduce((s,r)=>s+r.tours,0)}</td>
              <td className="px-3 py-2 font-black" style={{ color: "#34d399" }}>{totalContracts}</td>
              <td className="px-3 py-2 font-black" style={{ color: "#60a5fa" }}>{totalContracts > 0 ? fmt$(totalContracts*425_000) : "—"}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

function ActivityFeed({ items, loading }: {
  items: { id:number; activityType:string; description:string; firstName?:string|null; lastName?:string|null; createdAt:Date|string }[];
  loading?: boolean;
}) {
  if (loading) return <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-10 rounded-xl animate-pulse bg-gray-100" />)}</div>;
  if (items.length === 0) return <div className="text-[12px] py-2 text-gray-400">No recent activity.</div>;
  return (
    <div className="space-y-2">
      {items.slice(0,8).map(a => (
        <div key={a.id} className="flex items-center gap-2.5 p-2 rounded-xl" style={{ background:"#f8f9fb", border:"1px solid #e2e6ed" }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
            style={{ background:"linear-gradient(135deg,#4a90d9,#2563eb)" }}>
            {a.firstName ? a.firstName.charAt(0).toUpperCase() : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold truncate text-gray-800">
              {a.firstName && a.lastName ? `${a.firstName} ${a.lastName}` : "System"}
            </div>
            <div className="text-[10px] truncate text-gray-500">{a.description}</div>
          </div>
          <div className="text-[9px] flex-shrink-0 text-gray-400">{timeAgo(a.createdAt)}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Today's Focus (Active Pipeline) ─────────────────────────────────────────

type ContactRow = {
  id: number; firstName: string; lastName: string; email: string; phone: string;
  pipelineStage: string; leadScore?: string | null; timeline?: string | null;
  updatedAt: Date | string;
  lastContactedAt?: Date | string | null;
  nextAction?: string | null;
  primaryPropertyId?: number | null;
};

function urgencyScore(c: ContactRow): number {
  let score = 0;
  if (c.leadScore === "HOT")  score += 30;
  if (c.leadScore === "WARM") score += 15;
  if (c.pipelineStage === "OFFER_SUBMITTED")  score += 40;
  if (c.pipelineStage === "UNDER_CONTRACT")   score += 35;
  if (c.pipelineStage === "TOURED")           score += 25;
  if (c.pipelineStage === "TOUR_SCHEDULED")   score += 20;
  if (c.timeline === "ASAP")                  score += 20;
  if (c.timeline === "1_3_MONTHS")            score += 10;
  const lastContact = (c as any).lastContactedAt ?? c.updatedAt;
  const hoursAgo = Math.floor((Date.now() - new Date(lastContact).getTime()) / 3_600_000);
  if (hoursAgo > 72) score += 20;
  else if (hoursAgo > 24) score += 10;
  return score;
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

  const dashboardQuery = trpc.dashboard.overview.useQuery();
  const statsQuery = trpc.leads.dashboardStats.useQuery({ sourcePeriod: "all" });
  const contactsQuery = trpc.leads.list.useQuery({
    pipelineStage: stageFilter !== "ALL" ? stageFilter as any : undefined,
    leadScore: scoreFilter !== "ALL" ? scoreFilter as any : undefined,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-sm text-gray-400">Loading…</div>
      </div>
    );
  }

  if (!adminUser) {
    window.location.href = "/admin-login";
    return null;
  }

  if (selectedId !== null) {
    return <LeadDetail id={selectedId} onBack={() => setSelectedId(null)} />;
  }

  const contacts = contactsQuery.data ?? [];
  const dash = dashboardQuery.data;
  const stageCounts = statsQuery.data?.stageCounts ?? [];
  const inv = dash?.inventoryStats;
  const forecast = dash?.revenueForecast;
  const atRisk = (dash?.dealsAtRisk ?? []) as RiskDeal[];
  const inventoryHealth = (dash?.inventoryHealth ?? []) as InvItem[];
  const sourcePerf = dash?.sourcePerformance ?? [];
  const activity = dash?.recentActivity ?? [];

  // Sort contacts by urgency for Today's Focus
  const filtered = contacts
    .filter(c => {
      if (!search) return true;
      const q = search.toLowerCase();
      return `${c.firstName} ${c.lastName}`.toLowerCase().includes(q)
        || c.email.toLowerCase().includes(q)
        || c.phone.toLowerCase().includes(q);
    })
    .sort((a, b) => urgencyScore(b as ContactRow) - urgencyScore(a as ContactRow));

  // KPI bar %
  const availablePct  = Math.min(((inv?.available ?? 0) / 30) * 100, 100);
  const contractPct   = Math.min(((inv?.underContract ?? 0) / 15) * 100, 100);
  const soldPct       = Math.min(((inv?.soldLast30 ?? 0) / 10) * 100, 100);
  const revenuePct    = Math.min(((inv?.revenueMtd ?? 0) / 5_000_000) * 100, 100);
  const toursPct      = Math.min(((dash?.toursThisWeek ?? 0) / 20) * 100, 100);
  const absorptionPct = Math.min((dash?.absorptionRate ?? 0), 100);

  return (
    <div className="scops-bg bg-gray-50 min-h-screen">
      <SCOPSNav adminUser={{ name: adminUser.name, adminRole: (adminUser as any).adminRole }} currentPage="dashboard" />

      <div className="px-4 py-4 max-w-screen-2xl mx-auto space-y-4">

        {/* ── Row 1: KPI Cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <KpiCard label="Units Available"      value={inv?.available ?? "—"}                                   unit="units"  delta={2}  deltaLabel="this week"  barPct={availablePct}  colorIdx={0} loading={dashboardQuery.isLoading} />
          <KpiCard label="Under Contract"       value={inv?.underContract ?? "—"}                               unit="units"  delta={1}  deltaLabel="vs last wk" barPct={contractPct}   colorIdx={1} loading={dashboardQuery.isLoading} />
          <KpiCard label="Sold (30d)"           value={inv?.soldLast30 ?? "—"}                                  unit="units"  delta={-1} deltaLabel="vs last mo" barPct={soldPct}       colorIdx={2} loading={dashboardQuery.isLoading} />
          <KpiCard label="Revenue MTD"          value={inv ? fmt$(inv.revenueMtd) : "—"}                                                                           barPct={revenuePct}    colorIdx={3} loading={dashboardQuery.isLoading} />
          <KpiCard label="Tours This Week"      value={dash?.toursThisWeek ?? "—"}                              unit="tours"  delta={4}  deltaLabel="vs last wk" barPct={toursPct}      colorIdx={4} loading={dashboardQuery.isLoading} />
          <KpiCard label="Absorption Rate"      value={dash?.absorptionRate != null ? `${dash.absorptionRate}%` : "—"}                                             barPct={absorptionPct} colorIdx={5} loading={dashboardQuery.isLoading} />
        </div>

        {/* ── Row 2: DEALS AT RISK (Primary Action Center) ─────────────── */}
        <GC>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <SH>Deals at Risk</SH>
              {atRisk.length > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white" style={{ background:"#ef4444" }}>
                  {atRisk.length} need action
                </span>
              )}
            </div>
            <span className="text-[10px] text-gray-400">Leads not contacted in 48+ hours · sorted by urgency</span>
          </div>
          <DealsAtRisk deals={atRisk} loading={dashboardQuery.isLoading} onView={setSelectedId} />
        </GC>

        {/* ── Row 3: Pipeline + Revenue Forecast + Inventory Health ─────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <GC>
            <SH>Pipeline Funnel</SH>
            {statsQuery.isLoading
              ? <div className="text-sm py-4" style={{ color: "rgba(255,255,255,0.40)" }}>Loading…</div>
              : <PipelineFunnel stageCounts={stageCounts} />
            }
          </GC>
          <GC>
            <SH>Revenue Forecast</SH>
            <RevenueForecast forecast={forecast as any} loading={dashboardQuery.isLoading} />
          </GC>
          <GC>
            <SH>Inventory Health</SH>
            <InventoryHealth items={inventoryHealth} loading={dashboardQuery.isLoading} />
          </GC>
        </div>

        {/* ── Row 4: Source Performance + Activity Feed ─────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <GC noPad>
            <div className="px-4 pt-4 pb-2"><SH>Source Performance</SH></div>
            <SourcePerf rows={sourcePerf} loading={dashboardQuery.isLoading} />
            <div className="h-3" />
          </GC>
          <GC>
            <SH>Recent Activity</SH>
            <ActivityFeed items={activity} loading={dashboardQuery.isLoading} />
          </GC>
        </div>

        {/* ── Row 5: Today's Focus (Active Pipeline) ────────────────────── */}
        <GC noPad>
          <div className="px-4 pt-4 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <SH>Today's Focus</SH>
              <span className="text-[10px] font-medium -mt-1 text-gray-400">sorted by urgency · {filtered.length} contacts</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Search…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-7 text-[11px] w-36"
                style={{ background:"#ffffff", border:"1px solid #e2e6ed" }}
              />
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="h-7 text-[11px] w-32" style={{ background:"#ffffff", border:"1px solid #e2e6ed" }}>
                  <SelectValue placeholder="All Stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Stages</SelectItem>
                  {PIPELINE_STAGES.map(s => <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={scoreFilter} onValueChange={setScoreFilter}>
                <SelectTrigger className="h-7 text-[11px] w-24" style={{ background:"#ffffff", border:"1px solid #e2e6ed" }}>
                  <SelectValue placeholder="Score" />
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
            <div className="text-sm px-4 pb-4 text-gray-400">Loading contacts…</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm px-4 pb-6 text-center py-8 text-gray-400">
              {contacts.length === 0 ? "No contacts yet." : "No contacts match the current filters."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr style={{ borderBottom:"1px solid #e2e6ed", background:"#f8f9fb" }}>
                    {["Name","Stage","Score","Primary Property","Timeline","Last Activity","Next Action",""].map(h => (
                      <th key={h} className="text-left text-[9px] font-bold uppercase tracking-wider px-4 py-2.5 whitespace-nowrap text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const sp = STAGE_PILL[c.pipelineStage] ?? { bg:"rgba(0,0,0,.06)", text:"#64748b" };
                    const sc = c.leadScore ? SCORE_PILL[c.leadScore] : null;
                    const uScore = urgencyScore(c as ContactRow);
                    return (
                      <tr
                        key={c.id}
                        className="cursor-pointer transition-colors"
                        style={{ borderBottom:"1px solid #f1f3f7" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f8f9fb")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        onClick={() => setSelectedId(c.id)}
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            {uScore >= 60 && <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" title="High urgency" />}
                            {uScore >= 30 && uScore < 60 && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" title="Medium urgency" />}
                            <div>
                              <div className="font-semibold text-gray-900">{c.firstName} {c.lastName}</div>
                              <div className="text-[10px] text-gray-400">{c.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background:sp.bg, color:sp.text }}>
                            {STAGE_LABELS[c.pipelineStage]}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          {sc ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background:sc.bg, color:sc.text }}>
                              {c.leadScore}
                            </span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 max-w-[120px] truncate text-gray-500">
                          {(c as any).primaryPropertyId ? `#${(c as any).primaryPropertyId}` : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500">{fmtTimeline(c.timeline)}</td>
                        <td className="px-4 py-2.5 text-gray-400">{timeAgo((c as any).lastContactedAt ?? c.updatedAt)}</td>
                        <td className="px-4 py-2.5 max-w-[140px] truncate text-gray-500">{(c as any).nextAction ?? "—"}</td>
                        <td className="px-4 py-2.5">
                          <button
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                            style={{ background:"#f1f3f7", border:"1px solid #e2e6ed", color:"#374151" }}
                            onClick={e => { e.stopPropagation(); setSelectedId(c.id); }}
                          >
                            Open →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="h-2" />
        </GC>

      </div>
    </div>
  );
}
