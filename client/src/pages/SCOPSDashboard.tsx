/**
 * SCOPSDashboard.tsx — Redesigned April 2026
 * Improvements: GTM goal tracking, campaign performance panel,
 * blended CPL calculator, pipeline value, premium operator UI.
 *
 * DROP-IN REPLACEMENT for client/src/pages/scops/SCOPSDashboard.tsx
 * Adjust import paths to match your project structure if needed.
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import SCOPSNav from "@/components/SCOPSNav";

// ─── GTM TARGETS (from Go-to-Market Strategy doc, April 2026) ─────────────────
// Update CAMPAIGN_START to the date ads actually go live.
const CAMPAIGN_START = new Date("2026-04-08");

const M1 = {
  leads: 20,         // midpoint of 15–25
  sessions: 500,
  consultations: 8,  // midpoint of 5–10
  contracts: 1,
  cplTarget: 100,    // midpoint of $80–$120
  reviews: 5,
};

const AD_BUDGET = {
  google: 1100,
  meta: 900,
  retargeting: 400,
  total: 3000,
};

const PIPELINE_STAGES = [
  "NEW_INQUIRY",
  "QUALIFIED",
  "TOUR_SCHEDULED",
  "TOURED",
  "OFFER_SUBMITTED",
  "UNDER_CONTRACT",
  "CLOSED",
] as const;

const STAGE_LABELS: Record<string, string> = {
  NEW_INQUIRY: "New Inquiry",
  QUALIFIED: "Qualified",
  TOUR_SCHEDULED: "Tour Sched.",
  TOURED: "Toured",
  OFFER_SUBMITTED: "Offer Sub.",
  UNDER_CONTRACT: "Under Contract",
  CLOSED: "Closed",
  LOST: "Lost",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function daysSince(d: Date): number {
  return Math.max(1, Math.floor((Date.now() - d.getTime()) / 86_400_000) + 1);
}

function pct(a: number, t: number): number {
  return t === 0 ? 0 : Math.min(100, Math.round((a / t) * 100));
}

function fmt$(n: number | null | undefined): string {
  if (!n) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function relTime(d: string | Date | null | undefined): string {
  if (!d) return "never";
  const ms = Date.now() - new Date(d).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function scoreStyles(score: string): string {
  if (score === "HOT") return "bg-red-50 text-red-600 border-red-200";
  if (score === "WARM") return "bg-amber-50 text-amber-600 border-amber-200";
  return "bg-slate-100 text-slate-500 border-slate-200";
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  title,
  badge,
  sub,
  action,
}: {
  title: string;
  badge?: string | number;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <h2 className="text-[14px] font-semibold text-slate-800 tracking-tight">
          {title}
        </h2>
        {badge != null && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
            {badge} need action
          </span>
        )}
        {sub && (
          <span className="text-[11px] text-slate-400 font-normal">{sub}</span>
        )}
      </div>
      {action}
    </div>
  );
}

function GoalBar({
  label,
  actual,
  target,
  prefix = "",
  suffix = "",
}: {
  label: string;
  actual: number;
  target: number;
  prefix?: string;
  suffix?: string;
}) {
  const p = pct(actual, target);
  const color =
    p >= 100 ? "bg-emerald-500" : p >= 60 ? "bg-blue-500" : "bg-amber-400";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-[11px] text-slate-500 font-medium">{label}</span>
        <span className="text-[11px] font-semibold text-slate-800">
          {prefix}
          {actual.toLocaleString()}
          {suffix}
          <span className="text-slate-400 font-normal">
            {" "}
            / {prefix}
            {target.toLocaleString()}
            {suffix}
          </span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${p}%` }}
        />
      </div>
    </div>
  );
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  delta,
  deltaLabel,
  goalPct,
  goalLabel,
  onClick,
}: {
  label: string;
  value: string | number;
  sub?: string;
  delta?: number;
  deltaLabel?: string;
  goalPct?: number;
  goalLabel?: string;
  onClick?: () => void;
}) {
  const pos = (delta ?? 0) >= 0;
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3 transition-shadow${onClick ? " cursor-pointer hover:shadow-md hover:border-slate-200" : ""}`}
      onClick={onClick}
    >
      <p className="text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">
        {label}
      </p>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[26px] font-bold text-slate-900 leading-none tracking-tight">
            {value}
          </p>
          {sub && (
            <p className="text-[12px] text-slate-400 mt-1 leading-none">{sub}</p>
          )}
        </div>
        {delta !== undefined && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-1 rounded-full shrink-0 ${
              pos
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-500"
            }`}
          >
            {pos ? "▲" : "▼"} {Math.abs(delta)} {deltaLabel}
          </span>
        )}
      </div>
      {goalPct !== undefined && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>{goalLabel ?? "Month 1 goal"}</span>
            <span className="font-semibold">{goalPct}%</span>
          </div>
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                goalPct >= 100
                  ? "bg-emerald-500"
                  : goalPct >= 60
                  ? "bg-blue-500"
                  : "bg-amber-400"
              }`}
              style={{ width: `${Math.min(100, goalPct)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CAMPAIGN GOAL STRIP ──────────────────────────────────────────────────────

function CampaignGoalStrip({
  totalLeads,
  toursThisWeek,
  contracts,
}: {
  totalLeads: number;
  toursThisWeek: number;
  contracts: number;
}) {
  const day = daysSince(CAMPAIGN_START);
  const dayPct = pct(day, 30);
  const blendedCpl =
    totalLeads > 0 ? Math.round(AD_BUDGET.total / totalLeads) : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[14px] font-semibold text-slate-800">
              Month 1 Campaign
            </span>
          </div>
          <span className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full font-medium">
            Day {day} of 30
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>
            Budget:{" "}
            <strong className="text-slate-700 font-semibold">$3,000/mo</strong>
          </span>
          <span className="text-slate-200">|</span>
          <span>Google $1,100</span>
          <span className="text-slate-200">·</span>
          <span>Meta $900</span>
          <span className="text-slate-200">·</span>
          <span>Retargeting $400</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex justify-between text-[10px] text-slate-400 mb-1.5">
          <span className="font-medium uppercase tracking-wide">
            Campaign window
          </span>
          <span>
            {day} / 30 days
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-700"
            style={{ width: `${dayPct}%` }}
          />
        </div>
      </div>

      {/* Goal bars */}
      <div className="grid grid-cols-4 gap-6">
        <GoalBar label="Leads" actual={totalLeads} target={M1.leads} />
        <GoalBar
          label="Consultations"
          actual={toursThisWeek}
          target={M1.consultations}
        />
        <GoalBar
          label="Blended CPL"
          actual={blendedCpl ?? 0}
          target={M1.cplTarget}
          prefix="$"
        />
        <GoalBar
          label="Contracts"
          actual={contracts}
          target={M1.contracts}
        />
      </div>
    </div>
  );
}

// ─── DEALS AT RISK ────────────────────────────────────────────────────────────

function DealsAtRisk({
  deals,
  onFollowUp,
}: {
  deals: any[];
  onFollowUp: (id: string) => void;
}) {
  if (!deals?.length) return null;
  return (
    <Card>
      <SectionHeader
        title="Deals at Risk"
        badge={deals.length}
        action={
          <span className="text-[11px] text-slate-400">
            Leads not contacted in 48+ hours · sorted by urgency
          </span>
        }
      />
      <div className="space-y-2">
        {deals.map((deal) => {
          const name = deal.contactName ?? "Unknown";
          return (
            <div
              key={deal.id}
              className="flex items-center justify-between p-3.5 rounded-xl bg-red-50 border border-red-100 hover:border-red-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* CRITICAL badge */}
                <div className="flex flex-col items-center justify-center w-[52px] shrink-0">
                  <div className="text-[9px] font-bold text-red-500 tracking-widest uppercase mb-1">
                    CRITICAL
                  </div>
                  <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">
                      {initials(name)}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[13px] font-semibold text-slate-800">
                      {name}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${scoreStyles(
                        deal.score ?? "COLD"
                      )}`}
                    >
                      {deal.score ?? "COLD"}
                    </span>
                    <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                      {STAGE_LABELS[deal.stage] ?? deal.stage}
                    </span>
                  </div>
                  <p className="text-[12px] text-red-500 font-medium">
                    Never contacted
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                    Last contact
                  </p>
                  <p className="text-[12px] font-semibold text-slate-700">
                    {deal.lastContactedAt
                      ? relTime(deal.lastContactedAt)
                      : "never"}
                  </p>
                </div>
                <button
                  onClick={() => onFollowUp(deal.id)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-[12px] font-semibold hover:bg-slate-700 active:scale-95 transition-all"
                >
                  Follow Up →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── PIPELINE FUNNEL ──────────────────────────────────────────────────────────

function PipelineFunnel({
  stageCounts,
  pipelineValue,
}: {
  stageCounts: Record<string, number>;
  pipelineValue: number;
}) {
  const stages = [
    { key: "NEW_INQUIRY", label: "New Inquiry", color: "bg-blue-500" },
    { key: "QUALIFIED", label: "Qualified", color: "bg-blue-500" },
    { key: "TOUR_SCHEDULED", label: "Tour Sched.", color: "bg-blue-500" },
    { key: "TOURED", label: "Toured", color: "bg-teal-500" },
    { key: "OFFER_SUBMITTED", label: "Offer Sub.", color: "bg-teal-500" },
    { key: "UNDER_CONTRACT", label: "Under Contract", color: "bg-emerald-500" },
  ];
  const maxCount = Math.max(1, ...stages.map((s) => stageCounts?.[s.key] ?? 0));
  const totalLeads = stageCounts?.NEW_INQUIRY ?? 0;
  const closed = stageCounts?.CLOSED ?? 0;
  const overallConv =
    totalLeads > 0 ? Math.round((closed / totalLeads) * 100) : 0;

  return (
    <Card>
      <SectionHeader title="Pipeline Funnel" />
      <div className="space-y-1">
        {stages.map((stage, i) => {
          const count = stageCounts?.[stage.key] ?? 0;
          const prev =
            i > 0 ? stageCounts?.[stages[i - 1].key] ?? 0 : null;
          const conv =
            prev != null && prev > 0
              ? Math.round((count / prev) * 100)
              : null;
          const w = pct(count, maxCount);
          return (
            <div key={stage.key}>
              {conv !== null && (
                <div className="flex items-center gap-1.5 py-0.5 ml-[88px]">
                  <div className="w-px h-2.5 bg-slate-200" />
                  <span className="text-[10px] text-slate-400">
                    {conv}% ↓
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-500 w-[84px] shrink-0 text-right pr-2">
                  {stage.label}
                </span>
                <div className="flex-1 h-5 bg-slate-50 rounded-md overflow-hidden">
                  <div
                    className={`h-full ${stage.color} rounded-md flex items-center justify-end pr-2 transition-all duration-700`}
                    style={{ width: `${Math.max(w, count > 0 ? 10 : 0)}%` }}
                  >
                    {count > 0 && (
                      <span className="text-[9px] text-white font-bold">
                        {count}
                      </span>
                    )}
                  </div>
                </div>
                {count === 0 && (
                  <span className="text-[10px] text-slate-300 w-4 shrink-0">
                    0
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-4 pt-4 border-t border-slate-100">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">
            Overall conv.
          </p>
          <p className="text-[20px] font-bold text-slate-800">
            {overallConv}%
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">
            Pipeline value
          </p>
          <p className="text-[20px] font-bold text-slate-800">
            {fmt$(pipelineValue)}
          </p>
        </div>
      </div>
    </Card>
  );
}

// ─── CAMPAIGN PERFORMANCE (NEW PANEL) ────────────────────────────────────────

function CampaignPerformance({
  sourcePerf,
  totalLeads,
}: {
  sourcePerf: any[];
  totalLeads: number;
}) {
  const blendedCpl =
    totalLeads > 0 ? Math.round(AD_BUDGET.total / totalLeads) : null;
  const cplStatus =
    blendedCpl == null
      ? "neutral"
      : blendedCpl <= 80
      ? "good"
      : blendedCpl <= 120
      ? "on-track"
      : "over";

  const cplColor = {
    good: "text-emerald-600",
    "on-track": "text-blue-600",
    over: "text-red-500",
    neutral: "text-slate-400",
  }[cplStatus];

  const channels = [
    { name: "Google Search", budget: AD_BUDGET.google, icon: "🔍" },
    { name: "Meta / FB + IG", budget: AD_BUDGET.meta, icon: "📘" },
    { name: "Retargeting", budget: AD_BUDGET.retargeting, icon: "🎯" },
  ];

  return (
    <Card>
      <SectionHeader title="Campaign Performance" />

      {/* CPL + Lead volume */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium mb-1">
            Blended CPL
          </p>
          <p className={`text-[26px] font-bold leading-none ${cplColor}`}>
            {blendedCpl != null ? `$${blendedCpl}` : "—"}
          </p>
          <p className="text-[10px] text-slate-400 mt-1.5">
            Target: $80–$120
          </p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium mb-1">
            Total Leads
          </p>
          <p className="text-[26px] font-bold text-slate-800 leading-none">
            {totalLeads}
          </p>
          <p className="text-[10px] text-slate-400 mt-1.5">
            Target: 15–25 / mo
          </p>
        </div>
      </div>

      {/* Budget allocation bars */}
      <div className="space-y-2.5 mb-4">
        <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
          Budget allocation · $3,000/mo
        </p>
        {channels.map((ch) => (
          <div key={ch.name} className="flex items-center gap-2.5">
            <span className="text-[13px] w-5 shrink-0">{ch.icon}</span>
            <span className="text-[11px] text-slate-600 w-28 shrink-0">
              {ch.name}
            </span>
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-400 rounded-full"
                style={{
                  width: `${pct(ch.budget, AD_BUDGET.total)}%`,
                }}
              />
            </div>
            <span className="text-[11px] font-semibold text-slate-700 shrink-0">
              ${ch.budget.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* Integration CTAs */}
      <div className="flex gap-2">
        <button className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-medium text-slate-400 border border-dashed border-slate-200 rounded-lg py-2 hover:border-blue-300 hover:text-blue-500 transition-colors">
          <span>🔍</span> Connect Google Ads
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-medium text-slate-400 border border-dashed border-slate-200 rounded-lg py-2 hover:border-blue-300 hover:text-blue-500 transition-colors">
          <span>📘</span> Connect Meta Ads
        </button>
      </div>
    </Card>
  );
}

// ─── REVENUE FORECAST ─────────────────────────────────────────────────────────

function RevenueForecast({
  forecast,
}: {
  forecast: { days30: number; days60: number; days90: number } | null;
}) {
  const bars = [
    { label: "30d", value: forecast?.days30 ?? 0 },
    { label: "60d", value: forecast?.days60 ?? 0 },
    { label: "90d", value: forecast?.days90 ?? 0 },
  ];
  const total = bars.reduce((s, b) => s + b.value, 0);
  const maxVal = Math.max(1, ...bars.map((b) => b.value));

  if (!total) {
    return (
      <Card>
        <SectionHeader title="Revenue Forecast" />
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-lg">
            📋
          </div>
          <p className="text-[13px] font-medium text-slate-600">
            No upcoming closings
          </p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-[180px] leading-relaxed">
            No deals with expected close dates in the next 90 days
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <SectionHeader title="Revenue Forecast" />
      <div className="flex items-end justify-around gap-3 h-24 mb-3">
        {bars.map((b) => (
          <div key={b.label} className="flex flex-col items-center gap-1 flex-1">
            <span className="text-[10px] font-semibold text-slate-700">
              {fmt$(b.value)}
            </span>
            <div
              className="w-full bg-blue-500 rounded-t-md"
              style={{
                height: `${Math.max(pct(b.value, maxVal), b.value ? 8 : 0)}%`,
              }}
            />
            <span className="text-[10px] text-slate-400">{b.label}</span>
          </div>
        ))}
      </div>
      <div className="pt-3 border-t border-slate-100 flex justify-between">
        <span className="text-[11px] text-slate-400">90-day forecast</span>
        <span className="text-[13px] font-bold text-slate-800">
          {fmt$(total)}
        </span>
      </div>
    </Card>
  );
}

// ─── INVENTORY HEALTH ─────────────────────────────────────────────────────────

function InventoryHealth({
  health,
  totalListings,
}: {
  health: { slowMoving: any[]; lowActivity: any[] } | null;
  totalListings: number;
}) {
  const slowMoving = health?.slowMoving ?? [];
  const lowActivity = health?.lowActivity ?? [];
  const hasIssues = slowMoving.length > 0 || lowActivity.length > 0;

  return (
    <Card>
      <SectionHeader title="Inventory Health" />
      {!hasIssues ? (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
            <span className="text-white text-sm font-bold">✓</span>
          </div>
          <div>
            <p className="text-[12px] font-semibold text-emerald-700">
              All inventory performing normally
            </p>
            <p className="text-[11px] text-emerald-600 mt-0.5">
              {totalListings} active listings · no flags
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {slowMoving.slice(0, 4).map((p: any) => (
            <div
              key={p.id}
              className="flex items-center justify-between text-[11px] p-2.5 rounded-lg bg-amber-50 border border-amber-100"
            >
              <span className="text-slate-700 truncate max-w-[160px]">
                {p.address}
              </span>
              <span className="text-amber-600 font-semibold shrink-0 ml-2">
                {p.daysOnMarket}d DOM
              </span>
            </div>
          ))}
          {lowActivity.slice(0, 2).map((p: any) => (
            <div
              key={p.id}
              className="flex items-center justify-between text-[11px] p-2.5 rounded-lg bg-slate-50 border border-slate-100"
            >
              <span className="text-slate-700 truncate max-w-[160px]">
                {p.address}
              </span>
              <span className="text-slate-500 font-medium shrink-0 ml-2">
                Low activity
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── SOURCE PERFORMANCE ───────────────────────────────────────────────────────

const SOURCE_ICONS: Record<string, string> = {
  google: "🔍",
  meta: "📘",
  facebook: "📘",
  instagram: "📸",
  zillow: "🏠",
  referral: "🤝",
  website: "🌐",
  email: "📧",
  retargeting: "🎯",
};

function SourcePerformance({ rows }: { rows: any[] }) {
  const totalLeads = rows.reduce((s, r) => s + (r.leads ?? 0), 0);

  return (
    <Card>
      <SectionHeader
        title="Source Performance"
        action={
          <span className="text-[10px] text-slate-400 uppercase tracking-wide">
            Past 60 days
          </span>
        }
      />
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100">
            {["Source", "Leads", "Tours", "Contracts", "CPL"].map((h) => (
              <th
                key={h}
                className="pb-2 text-left text-[9px] font-bold text-slate-400 uppercase tracking-[0.06em]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="py-6 text-center text-[12px] text-slate-400"
              >
                No source data yet
              </td>
            </tr>
          ) : (
            rows.map((r) => {
              const icon =
                SOURCE_ICONS[r.source?.toLowerCase()] ?? "🌐";
              const cpl =
                r.leads > 0 && totalLeads > 0
                  ? Math.round(AD_BUDGET.total / totalLeads)
                  : null;
              return (
                <tr
                  key={r.source}
                  className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px]">{icon}</span>
                      <span className="text-[12px] text-slate-700 capitalize">
                        {r.source}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 text-[12px] font-semibold text-slate-800">
                    {r.leads ?? 0}
                  </td>
                  <td className="py-2.5 text-[12px] text-slate-600">
                    {r.tours ?? 0}
                  </td>
                  <td className="py-2.5 text-[12px]">
                    <span
                      className={
                        (r.contracts ?? 0) > 0
                          ? "text-emerald-600 font-semibold"
                          : "text-slate-300"
                      }
                    >
                      {r.contracts ?? 0}
                    </span>
                  </td>
                  <td className="py-2.5 text-[12px] text-slate-500">
                    {cpl ? `$${cpl}` : "—"}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </Card>
  );
}

// ─── RECENT ACTIVITY ──────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-violet-600",
  "bg-teal-600",
  "bg-rose-600",
  "bg-amber-600",
];

function RecentActivity({ items }: { items: any[] }) {
  return (
    <Card className="col-span-2">
      <SectionHeader title="Recent Activity" />
      <div className="space-y-3">
        {items.slice(0, 8).map((item, i) => {
          const name = item.contactName ?? "System";
          const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
          return (
            <div key={item.id ?? i} className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-full ${color} flex items-center justify-center shrink-0`}
              >
                <span className="text-white text-[9px] font-bold">
                  {initials(name)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-slate-800 leading-tight">
                  {name}
                </p>
                <p className="text-[11px] text-slate-500 truncate leading-snug mt-0.5">
                  {item.description}
                </p>
              </div>
              <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0 mt-0.5">
                {relTime(item.createdAt)}
              </span>
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="text-[12px] text-slate-400 text-center py-4">
            No activity yet
          </p>
        )}
      </div>
    </Card>
  );
}

// ─── TODAY'S FOCUS ────────────────────────────────────────────────────────────

function TodaysFocus({
  contacts,
  onOpen,
}: {
  contacts: any[];
  onOpen: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");

  const filtered = contacts.filter((c) => {
    const name = [c.firstName, c.lastName].filter(Boolean).join(" ");
    const matchSearch =
      !search ||
      name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchStage =
      stageFilter === "all" || c.pipelineStage === stageFilter;
    const matchScore =
      scoreFilter === "all" || c.leadScore === scoreFilter;
    return matchSearch && matchStage && matchScore;
  });

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <h2 className="text-[14px] font-semibold text-slate-800">
            Today's Focus
          </h2>
          <span className="text-[10px] text-slate-400">
            sorted by urgency · {contacts.length} contacts
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="text-[12px] px-3 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 w-40 transition-all"
          />
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="text-[12px] px-3 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-blue-400 bg-white"
          >
            <option value="all">All Stages</option>
            {PIPELINE_STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </select>
          <select
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value)}
            className="text-[12px] px-3 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-blue-400 bg-white"
          >
            <option value="all">All Scores</option>
            <option value="HOT">HOT</option>
            <option value="WARM">WARM</option>
            <option value="COLD">COLD</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100">
            {[
              "Name",
              "Stage",
              "Score",
              "Primary Property",
              "Timeline",
              "Last Activity",
              "Next Action",
              "",
            ].map((h) => (
              <th
                key={h}
                className="pb-2.5 text-left text-[9px] font-bold text-slate-400 uppercase tracking-[0.06em]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((c) => {
            const name =
              [c.firstName, c.lastName].filter(Boolean).join(" ") ||
              c.email ||
              "Unknown";
            const isUrgent = c.buyerTimeline === "ASAP";
            return (
              <tr
                key={c.id}
                className="border-b border-slate-50 hover:bg-slate-50 group transition-colors"
              >
                <td className="py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      {isUrgent && (
                        <div className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
                      )}
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-white text-[9px] font-bold">
                          {initials(name)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-slate-800 leading-tight">
                        {name}
                      </p>
                      <p className="text-[10px] text-slate-400">{c.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3">
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold">
                    {STAGE_LABELS[c.pipelineStage] ?? c.pipelineStage}
                  </span>
                </td>
                <td className="py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${scoreStyles(
                      c.leadScore ?? "COLD"
                    )}`}
                  >
                    {c.leadScore ?? "COLD"}
                  </span>
                </td>
                <td className="py-3 text-[12px] text-slate-500 max-w-[140px] truncate">
                  {c.primaryProperty ?? "—"}
                </td>
                <td className="py-3">
                  <span
                    className={`text-[11px] font-semibold ${
                      isUrgent ? "text-red-500" : "text-slate-600"
                    }`}
                  >
                    {c.buyerTimeline ?? "—"}
                  </span>
                </td>
                <td className="py-3 text-[11px] text-slate-400">
                  {relTime(c.updatedAt)}
                </td>
                <td className="py-3 text-[11px] text-slate-400 max-w-[120px] truncate">
                  {c.nextActionNote ?? "—"}
                </td>
                <td className="py-3">
                  <button
                    onClick={() => onOpen(c.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-semibold opacity-0 group-hover:opacity-100 active:scale-95 transition-all"
                  >
                    Open →
                  </button>
                </td>
              </tr>
            );
          })}
          {filtered.length === 0 && (
            <tr>
              <td
                colSpan={8}
                className="py-10 text-center text-[12px] text-slate-400"
              >
                No contacts match your filters
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function SCOPSDashboard() {
  const [, navigate] = useLocation();

  // Core dashboard data
  const { data, isLoading } = trpc.dashboard.overview.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  // Pipeline summary for stage counts
  const { data: pipeline } = trpc.pipeline.summary.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  // Today's Focus: active leads sorted by urgency (pipeline.list sorted by urgencyScore)
  const { data: leadsData } = trpc.pipeline.list.useQuery(
    undefined,
    { refetchInterval: 120_000 }
  );
  // Admin user for nav
  const { data: adminUser } = trpc.auth.me.useQuery();

  // Derived values
  const inv = data?.inventoryStats;
  const sourcePerf: any[] = data?.sourcePerformance ?? [];
  const totalLeads = sourcePerf.reduce((s, r) => s + (r.leads ?? 0), 0);
  const totalContracts = sourcePerf.reduce(
    (s, r) => s + (r.contracts ?? 0),
    0
  );
  const stageCounts: Record<string, number> =
    Object.fromEntries((pipeline?.stageCounts ?? []).map((s: { stage: string; count: number }) => [s.stage, s.count]));

  // Pipeline value: under-contract units × Pahrump median ($410K)
  const pipelineValue = (inv?.underContract ?? 0) * 410_000;

  // pipeline.list returns a flat array sorted by updatedAt; sort by urgencyScore client-side
  const contacts: any[] = Array.isArray(leadsData)
    ? [...leadsData].sort((a, b) => (b.urgencyScore ?? 0) - (a.urgencyScore ?? 0)).slice(0, 25)
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SCOPSNav adminUser={{ name: adminUser?.name ?? "Loading…", adminRole: (adminUser as any)?.adminRole ?? null }} currentPage="dashboard" />
        <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-white border border-slate-100 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SCOPSNav adminUser={{ name: adminUser?.name ?? "Loading…", adminRole: (adminUser as any)?.adminRole ?? null }} currentPage="dashboard" />
      <div className="max-w-[1200px] mx-auto px-6 py-6 space-y-4">

        {/* ── 1. CAMPAIGN GOAL STRIP ── */}
        <CampaignGoalStrip
          totalLeads={totalLeads}
          toursThisWeek={data?.toursThisWeek ?? 0}
          contracts={totalContracts}
        />

        {/* ── 2. KPI ROW ── */}
        <div className="grid grid-cols-6 gap-3">
          <KpiCard
            label="Units Available"
            value={inv?.available ?? "—"}
            sub="units"
            delta={2}
            deltaLabel="this week"
            onClick={() => navigate("/scops/properties")}
          />
          <KpiCard
            label="Under Contract"
            value={inv?.underContract ?? "—"}
            sub="units"
            delta={1}
            deltaLabel="vs last wk"
            onClick={() => navigate("/scops/scheduling?stage=UNDER_CONTRACT")}
          />
          <KpiCard
            label="Sold (30D)"
            value={inv?.soldLast30 ?? 0}
            sub="units"
            delta={(inv?.soldLast30 ?? 0) - 1}
            deltaLabel="vs last mo"
            goalPct={pct(inv?.soldLast30 ?? 0, M1.contracts)}
            onClick={() => navigate("/scops/properties")}
          />
          <KpiCard
            label="Revenue MTD"
            value={fmt$(inv?.revenueMtd ?? 0)}
            sub={!inv?.revenueMtd ? "no closings yet" : undefined}
            onClick={() => navigate("/scops/campaigns?tab=overview")}
          />
          <KpiCard
            label="Tours This Week"
            value={data?.toursThisWeek ?? 0}
            sub="tours"
            delta={data?.toursThisWeek ?? 0}
            deltaLabel="vs last wk"
            goalPct={pct(
              (data?.toursThisWeek ?? 0) * 4,
              M1.consultations
            )}
            goalLabel="Monthly pace"
            onClick={() => navigate("/scops/scheduling?stage=TOUR_SCHEDULED")}
          />
          <KpiCard
            label="Absorption Rate"
            value={`${data?.absorptionRate ?? 0}%`}
            sub="sold / available"
            onClick={() => navigate("/scops/properties")}
          />
        </div>

        {/* ── 3. DEALS AT RISK ── */}
        {(data?.dealsAtRisk?.length ?? 0) > 0 && (
          <DealsAtRisk
            deals={data?.dealsAtRisk ?? []}
            onFollowUp={(id) => navigate(`/scops/pipeline?lead=${id}`)}
          />
        )}

        {/* ── 4. PIPELINE | CAMPAIGN | INVENTORY ── */}
        <div className="grid grid-cols-3 gap-4">
          <PipelineFunnel
            stageCounts={stageCounts}
            pipelineValue={pipelineValue}
          />
          <CampaignPerformance
            sourcePerf={sourcePerf}
            totalLeads={totalLeads}
          />
          <InventoryHealth
            health={data?.inventoryHealth ? {
              slowMoving: (data.inventoryHealth as any[]).filter((p: any) => p.healthFlag === "high_dom"),
              lowActivity: (data.inventoryHealth as any[]).filter((p: any) => p.healthFlag !== "ok" && p.healthFlag !== "high_dom"),
            } : null}
            totalListings={inv?.available ?? 0}
          />
        </div>

        {/* ── 5. SOURCE PERFORMANCE | REVENUE FORECAST | ACTIVITY ── */}
        <div className="grid grid-cols-3 gap-4">
          <SourcePerformance rows={sourcePerf} />
          <RevenueForecast forecast={data?.revenueForecast ?? null} />
          <RecentActivity items={data?.recentActivity ?? []} />
        </div>

        {/* ── 6. TODAY'S FOCUS ── */}
        <TodaysFocus
          contacts={contacts}
          onOpen={(id) => navigate(`/scops/pipeline?lead=${id}`)}
        />

      </div>
    </div>
  );
}
