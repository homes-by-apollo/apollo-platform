/**
 * SCOPSCampaigns.tsx — Redesigned April 2026
 *
 * Restructured as an ad performance command center.
 * Layout priority: performance first, content management second.
 *
 * DROP-IN REPLACEMENT for client/src/pages/scops/SCOPSCampaigns.tsx
 * Adjust import paths to match your project structure.
 */

import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import SCOPSNav from "@/components/SCOPSNav";

// ─── GTM CONSTANTS ────────────────────────────────────────────────────────────

const CAMPAIGN_START = new Date("2026-04-08");

const AD_BUDGET = {
  google: 1100,
  meta: 900,
  retargeting: 400,
  total: 3000,
};

const M1_TARGETS = {
  leads: 20,
  cpl: 100,
  consultations: 8,
  contracts: 1,
};

// GTM channel budget allocation
const CHANNEL_BUDGETS: Record<string, number> = {
  google: 1100,
  "google ads": 1100,
  meta: 900,
  facebook: 900,
  "facebook ads": 900,
  retargeting: 400,
  website: 0,
  referral: 0,
  zillow: 0,
  email: 0,
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
  if (!d) return "—";
  const ms = Date.now() - new Date(d).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function buildUtmUrl(
  base: string,
  params: {
    source: string;
    medium: string;
    campaign: string;
    content: string;
    term: string;
  }
): string {
  if (!base) return "";
  const p = new URLSearchParams();
  if (params.source) p.set("utm_source", params.source);
  if (params.medium) p.set("utm_medium", params.medium);
  if (params.campaign) p.set("utm_campaign", params.campaign);
  if (params.content) p.set("utm_content", params.content);
  if (params.term) p.set("utm_term", params.term);
  const qs = p.toString();
  return qs ? `${base}?${qs}` : base;
}

const SOURCE_ICONS: Record<string, string> = {
  google: "🔍",
  "google ads": "🔍",
  meta: "📘",
  facebook: "📘",
  "facebook ads": "📘",
  instagram: "📸",
  zillow: "🏠",
  referral: "🤝",
  website: "🌐",
  email: "📧",
  retargeting: "🎯",
};

// ─── SHARED UI ────────────────────────────────────────────────────────────────

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h2 className="text-[14px] font-semibold text-slate-800 tracking-tight">
          {title}
        </h2>
        {sub && (
          <span className="text-[10px] text-slate-400 uppercase tracking-wide">
            {sub}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}

function StatChip({
  label,
  value,
  color = "slate",
}: {
  label: string;
  value: string | number;
  color?: "slate" | "blue" | "emerald" | "amber" | "red";
}) {
  const colors = {
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <div className={`flex flex-col items-center px-4 py-2.5 rounded-xl border ${colors[color]}`}>
      <span className="text-[18px] font-bold leading-none">{value}</span>
      <span className="text-[10px] font-medium mt-1 opacity-70">{label}</span>
    </div>
  );
}

// ─── 1. CAMPAIGN STATUS BAR ───────────────────────────────────────────────────

function CampaignStatusBar({ totalLeads }: { totalLeads: number }) {
  const day = daysSince(CAMPAIGN_START);
  const blendedCpl =
    totalLeads > 0 ? Math.round(AD_BUDGET.total / totalLeads) : null;
  const cplGood = blendedCpl != null && blendedCpl <= 120;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
      <div className="flex items-center justify-between">
        {/* Left: status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[13px] font-semibold text-slate-800">
              Month 1 Campaign Active
            </span>
          </div>
          <span className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full">
            Day {day} of 30
          </span>
          <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${pct(day, 30)}%` }}
            />
          </div>
        </div>

        {/* Right: key numbers */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">
              Budget / mo
            </p>
            <p className="text-[13px] font-bold text-slate-800">$3,000</p>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">
              Leads MTD
            </p>
            <p className="text-[13px] font-bold text-slate-800">
              {totalLeads}
              <span className="text-slate-400 font-normal"> / 20</span>
            </p>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">
              Blended CPL
            </p>
            <p
              className={`text-[13px] font-bold ${
                blendedCpl == null
                  ? "text-slate-400"
                  : cplGood
                  ? "text-emerald-600"
                  : "text-red-500"
              }`}
            >
              {blendedCpl != null ? `$${blendedCpl}` : "—"}
              <span className="text-slate-400 font-normal"> target $80–120</span>
            </p>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div className="flex gap-2">
            <button className="text-[10px] font-medium text-slate-400 border border-dashed border-slate-200 rounded-lg px-3 py-1.5 hover:border-blue-300 hover:text-blue-500 transition-colors">
              🔍 Connect Google Ads
            </button>
            <button className="text-[10px] font-medium text-slate-400 border border-dashed border-slate-200 rounded-lg px-3 py-1.5 hover:border-blue-300 hover:text-blue-500 transition-colors">
              📘 Connect Meta Ads
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 2. CHANNEL PERFORMANCE ───────────────────────────────────────────────────

function ChannelPerformance({
  rows,
  period,
  onPeriodChange,
}: {
  rows: any[];
  period: string;
  onPeriodChange: (p: string) => void;
}) {
  const totalLeads = rows.reduce((s, r) => s + (r.leads ?? 0), 0);
  const maxLeads = Math.max(1, ...rows.map((r) => r.leads ?? 0));

  return (
    <Card className="col-span-2">
      <SectionHeader
        title="Channel Performance"
        action={
          <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-100">
            {["7d", "30d", "60d", "All"].map((p) => (
              <button
                key={p}
                onClick={() => onPeriodChange(p)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors ${
                  period === p
                    ? "bg-white text-slate-800 shadow-sm border border-slate-200"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        }
      />

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-[13px] font-medium text-slate-600">
            No channel data yet
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Leads will appear here once UTM tracking is live
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows
            .sort((a, b) => (b.leads ?? 0) - (a.leads ?? 0))
            .map((r) => {
              const icon =
                SOURCE_ICONS[r.source?.toLowerCase()] ?? "🌐";
              const budget =
                CHANNEL_BUDGETS[r.source?.toLowerCase()] ?? 0;
              const cpl =
                r.leads > 0 && budget > 0
                  ? Math.round(budget / r.leads)
                  : null;
              const barW = pct(r.leads ?? 0, maxLeads);
              const convRate =
                r.leads > 0
                  ? Math.round(((r.tours ?? 0) / r.leads) * 100)
                  : 0;

              return (
                <div key={r.source} className="flex items-center gap-4">
                  {/* Source label */}
                  <div className="flex items-center gap-2 w-32 shrink-0">
                    <span className="text-[15px]">{icon}</span>
                    <span className="text-[12px] text-slate-700 capitalize truncate">
                      {r.source}
                    </span>
                  </div>

                  {/* Bar */}
                  <div className="flex-1 h-6 bg-slate-50 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-lg flex items-center justify-end pr-2 transition-all duration-700"
                      style={{
                        width: `${Math.max(barW, (r.leads ?? 0) > 0 ? 6 : 0)}%`,
                      }}
                    >
                      {(r.leads ?? 0) > 0 && (
                        <span className="text-[10px] text-white font-bold">
                          {r.leads}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right w-10">
                      <p className="text-[11px] font-semibold text-slate-800">
                        {r.leads ?? 0}
                      </p>
                      <p className="text-[9px] text-slate-400">leads</p>
                    </div>
                    <div className="text-right w-10">
                      <p className="text-[11px] font-semibold text-slate-800">
                        {r.tours ?? 0}
                      </p>
                      <p className="text-[9px] text-slate-400">tours</p>
                    </div>
                    <div className="text-right w-16">
                      <p
                        className={`text-[11px] font-semibold ${
                          cpl != null && cpl <= 120
                            ? "text-emerald-600"
                            : cpl != null
                            ? "text-red-500"
                            : "text-slate-300"
                        }`}
                      >
                        {cpl != null ? `$${cpl}` : "—"}
                      </p>
                      <p className="text-[9px] text-slate-400">CPL</p>
                    </div>
                    <div className="text-right w-10">
                      <p
                        className={`text-[11px] font-semibold ${
                          (r.contracts ?? 0) > 0
                            ? "text-emerald-600"
                            : "text-slate-300"
                        }`}
                      >
                        {r.contracts ?? 0}
                      </p>
                      <p className="text-[9px] text-slate-400">contracts</p>
                    </div>
                  </div>
                </div>
              );
            })}

          {/* Totals row */}
          <div className="flex items-center gap-4 pt-3 border-t border-slate-100 mt-1">
            <span className="text-[11px] font-bold text-slate-500 w-32 shrink-0">
              TOTAL
            </span>
            <div className="flex-1" />
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right w-10">
                <p className="text-[12px] font-bold text-slate-800">
                  {totalLeads}
                </p>
              </div>
              <div className="text-right w-10">
                <p className="text-[12px] font-bold text-slate-800">
                  {rows.reduce((s, r) => s + (r.tours ?? 0), 0)}
                </p>
              </div>
              <div className="text-right w-16">
                <p className="text-[12px] font-bold text-slate-800">
                  {totalLeads > 0
                    ? `$${Math.round(AD_BUDGET.total / totalLeads)}`
                    : "—"}
                </p>
              </div>
              <div className="text-right w-10">
                <p className="text-[12px] font-bold text-emerald-600">
                  {rows.reduce((s, r) => s + (r.contracts ?? 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── 3. LEAD FUNNEL ───────────────────────────────────────────────────────────

const FUNNEL_STAGES = [
  { key: "NEW_INQUIRY", label: "New Inquiry", color: "bg-blue-500" },
  { key: "QUALIFIED", label: "Qualified", color: "bg-blue-400" },
  { key: "TOUR_SCHEDULED", label: "Tour Scheduled", color: "bg-teal-500" },
  { key: "TOURED", label: "Toured", color: "bg-teal-400" },
  { key: "OFFER_SUBMITTED", label: "Offer Submitted", color: "bg-emerald-500" },
  { key: "UNDER_CONTRACT", label: "Under Contract", color: "bg-emerald-600" },
  { key: "CLOSED", label: "Closed", color: "bg-emerald-700" },
];

function LeadFunnel({ stageCounts }: { stageCounts: Record<string, number> }) {
  const topCount = stageCounts?.NEW_INQUIRY ?? 0;
  const totalActive = Object.values(stageCounts).reduce(
    (s, v) => s + (v ?? 0),
    0
  );

  return (
    <Card>
      <SectionHeader
        title="Lead Funnel"
        sub="Live · All Time"
      />
      <div className="space-y-1.5">
        {FUNNEL_STAGES.map((stage) => {
          const count = stageCounts?.[stage.key] ?? 0;
          const w = topCount > 0 ? pct(count, topCount) : 0;
          return (
            <div key={stage.key} className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 w-24 shrink-0 text-right pr-1">
                {stage.label}
              </span>
              <div className="flex-1 h-5 bg-slate-50 rounded-md overflow-hidden">
                <div
                  className={`h-full ${stage.color} rounded-md flex items-center justify-end pr-1.5 transition-all duration-700`}
                  style={{ width: `${Math.max(w, count > 0 ? 8 : 0)}%` }}
                >
                  {count > 0 && (
                    <span className="text-[9px] text-white font-bold">{count}</span>
                  )}
                </div>
              </div>
              {count === 0 && (
                <span className="text-[10px] text-slate-200 w-4">0</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="pt-3 mt-3 border-t border-slate-100 flex justify-between">
        <span className="text-[11px] text-slate-400">Total active leads</span>
        <span className="text-[13px] font-bold text-slate-800">{totalActive}</span>
      </div>
    </Card>
  );
}

// ─── 4. LANDING PAGES ─────────────────────────────────────────────────────────

const LANDING_ICONS: Record<string, string> = {
  zillow: "🏠",
  facebook: "📘",
  google: "🔍",
  email: "📧",
};

function LandingPages({ rows }: { rows: any[] }) {
  const totals = useMemo(
    () => ({
      visitors: rows.reduce((s, r) => s + (r.visitors ?? 0), 0),
      leads: rows.reduce((s, r) => s + (r.leads ?? 0), 0),
    }),
    [rows]
  );

  return (
    <Card>
      <SectionHeader
        title="Landing Pages"
        sub="Past 60 Days"
      />
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100">
            {["Page", "Visitors", "Leads", "Conv. Rate"].map((h) => (
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
          {rows.map((r) => {
            const icon =
              LANDING_ICONS[r.title?.toLowerCase().split(" ")[0]] ?? "🌐";
            const conv =
              r.visitors > 0
                ? ((r.leads / r.visitors) * 100).toFixed(1)
                : "0.0";
            const convNum = parseFloat(conv);
            return (
              <tr
                key={r.title}
                className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
              >
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px]">{icon}</span>
                    <span className="text-[12px] text-slate-700 truncate max-w-[140px]">
                      {r.title}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 text-[12px] font-semibold text-slate-800">
                  {(r.visitors ?? 0).toLocaleString()}
                </td>
                <td className="py-2.5 text-[12px] text-slate-600">
                  {r.leads ?? 0}
                </td>
                <td className="py-2.5">
                  <span
                    className={`text-[11px] font-semibold ${
                      convNum >= 5
                        ? "text-emerald-600"
                        : convNum >= 2
                        ? "text-blue-600"
                        : "text-slate-400"
                    }`}
                  >
                    {conv}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-200">
            <td className="pt-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              TOTAL
            </td>
            <td className="pt-2.5 text-[12px] font-bold text-slate-800">
              {totals.visitors.toLocaleString()}
            </td>
            <td className="pt-2.5 text-[12px] font-bold text-slate-800">
              {totals.leads}
            </td>
            <td className="pt-2.5 text-[11px] font-bold text-slate-800">
              {totals.visitors > 0
                ? ((totals.leads / totals.visitors) * 100).toFixed(1)
                : "0.0"}
              %
            </td>
          </tr>
        </tfoot>
      </table>
    </Card>
  );
}

// ─── 5. BLOG POSTS ────────────────────────────────────────────────────────────

function BlogPosts({
  posts,
  onNew,
  onPreview,
  onEdit,
  onTogglePublish,
}: {
  posts: any[];
  onNew: () => void;
  onPreview: (slug: string) => void;
  onEdit: (id: string) => void;
  onTogglePublish: (id: number, current: string) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = posts.filter(
    (p) =>
      !search ||
      p.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-[14px] font-semibold text-slate-800">Blog Posts</h2>
          <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
            {posts.filter((p) => p.status === "published").length} published
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="text-[12px] px-3 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-blue-400 w-36 transition-all"
          />
          <button
            onClick={onNew}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[12px] font-semibold hover:bg-slate-700 transition-colors"
          >
            + New Post
          </button>
        </div>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100">
            {["Title", "Status", "Views", "Leads", ""].map((h) => (
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
          {filtered.map((post) => (
            <tr
              key={post.id}
              className="border-b border-slate-50 hover:bg-slate-50 transition-colors group"
            >
              <td className="py-3">
                <div className="flex items-center gap-3">
                  {post.coverImageUrl && (
                    <img
                      src={post.coverImageUrl}
                      alt=""
                      className="w-10 h-7 rounded-md object-cover shrink-0 border border-slate-100"
                    />
                  )}
                  <div>
                    <p className="text-[12px] font-semibold text-slate-800 truncate max-w-[240px]">
                      {post.title}
                    </p>
                    {post.excerpt && (
                      <p className="text-[10px] text-slate-400 truncate max-w-[240px] mt-0.5">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </div>
              </td>
              <td className="py-3">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    post.status === "published"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}
                >
                  {post.status === "published" ? "Published" : "Draft"}
                </span>
              </td>
              <td className="py-3 text-[12px] text-slate-600">
                {(post.viewCount ?? 0).toLocaleString()}
              </td>
              <td className="py-3 text-[12px] text-slate-600">
                {post.leadCount ?? 0}
              </td>
              <td className="py-3">
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onPreview(post.slug)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => onEdit(post.id)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onTogglePublish(post.id, post.status)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                      post.status === "published"
                        ? "text-amber-600 border border-amber-200 hover:bg-amber-50"
                        : "text-emerald-600 border border-emerald-200 hover:bg-emerald-50"
                    }`}
                  >
                    {post.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="py-8 text-center text-[12px] text-slate-400"
              >
                {search ? "No posts match your search" : "No blog posts yet"}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}

// ─── 6. UTM BUILDER ──────────────────────────────────────────────────────────

const LANDING_PAGES = [
  { label: "/get-in-touch — Contact Form", value: "https://apollohomebuilders.com/get-in-touch" },
  { label: "/find-your-home — Listings", value: "https://apollohomebuilders.com/find-your-home" },
  { label: "/homes — Homes for Sale", value: "https://apollohomebuilders.com/homes" },
  { label: "/lots — Available Lots", value: "https://apollohomebuilders.com/lots" },
  { label: "/ — Homepage", value: "https://apollohomebuilders.com" },
];

const UTM_TEMPLATES = [
  {
    label: "Google Search",
    icon: "🔍",
    params: {
      source: "google",
      medium: "cpc",
      campaign: "pahrump-new-homes",
      content: "search-ad",
      term: "pahrump+new+homes",
    },
  },
  {
    label: "Google Brand",
    icon: "🔍",
    params: {
      source: "google",
      medium: "cpc",
      campaign: "apollo-brand",
      content: "brand-ad",
      term: "apollo+home+builders",
    },
  },
  {
    label: "Facebook Lead",
    icon: "📘",
    params: {
      source: "facebook",
      medium: "social",
      campaign: "pahrump-awareness",
      content: "carousel-homes",
      term: "",
    },
  },
  {
    label: "Instagram Reel",
    icon: "📸",
    params: {
      source: "instagram",
      medium: "social",
      campaign: "pahrump-lifestyle",
      content: "reel-video",
      term: "",
    },
  },
  {
    label: "Email Newsletter",
    icon: "📧",
    params: {
      source: "email",
      medium: "newsletter",
      campaign: "monthly-update",
      content: "cta-button",
      term: "",
    },
  },
];

const UTM_FIELDS = [
  {
    key: "source",
    label: "utm_source",
    placeholder: "google",
    hint: "The marketing channel. e.g. google, facebook, instagram",
  },
  {
    key: "medium",
    label: "utm_medium",
    placeholder: "cpc",
    hint: "The marketing medium. e.g. cpc, social, email",
  },
  {
    key: "campaign",
    label: "utm_campaign",
    placeholder: "pahrump-new-homes",
    hint: "The ad group or campaign. e.g. pahrump-new-homes",
  },
  {
    key: "content",
    label: "utm_content",
    placeholder: "carousel-homes",
    hint: "The specific ad or creative. e.g. carousel-homes",
  },
  {
    key: "term",
    label: "utm_term",
    placeholder: "pahrump+new+homes",
    hint: "Paid keyword (Google only). e.g. pahrump+new+homes",
  },
] as const;

function UtmBuilder() {
  const [landingPage, setLandingPage] = useState(LANDING_PAGES[0].value);
  const [params, setParams] = useState({
    source: "google",
    medium: "cpc",
    campaign: "pahrump-new-homes",
    content: "carousel-homes",
    term: "pahrump+new+homes",
  });
  const [copied, setCopied] = useState(false);

  const generatedUrl = buildUtmUrl(landingPage, params);

  function applyTemplate(t: (typeof UTM_TEMPLATES)[number]) {
    setParams({ ...params, ...t.params });
  }

  function handleCopy() {
    navigator.clipboard.writeText(generatedUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleReset() {
    setParams({ source: "", medium: "", campaign: "", content: "", term: "" });
    setCopied(false);
  }

  return (
    <Card>
      <SectionHeader title="UTM Builder" />

      <div className="grid grid-cols-3 gap-8">
        {/* Left: inputs */}
        <div className="col-span-2 space-y-4">
          {/* Landing page */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.07em] mb-1.5">
              Landing Page
            </label>
            <select
              value={landingPage}
              onChange={(e) => setLandingPage(e.target.value)}
              className="w-full text-[12px] px-3 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white transition-all"
            >
              {LANDING_PAGES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* UTM fields grid */}
          <div className="grid grid-cols-2 gap-3">
            {UTM_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="block text-[10px] font-bold text-blue-500 uppercase tracking-[0.07em] mb-1.5">
                  {f.label}
                </label>
                <input
                  value={params[f.key]}
                  onChange={(e) =>
                    setParams({ ...params, [f.key]: e.target.value })
                  }
                  placeholder={f.placeholder}
                  className="w-full text-[12px] px-3 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            ))}
          </div>

          {/* Generated URL */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.07em] mb-1.5">
              Generated URL
            </label>
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 min-h-[40px]">
              <p className="flex-1 text-[11px] text-slate-600 break-all font-mono leading-relaxed">
                {generatedUrl || (
                  <span className="text-slate-300">
                    Fill in fields above to generate URL
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              disabled={!generatedUrl}
              className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                copied
                  ? "bg-emerald-500 text-white"
                  : generatedUrl
                  ? "bg-slate-900 text-white hover:bg-slate-700"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              {copied ? "✓ Copied!" : "Copy URL"}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl text-[12px] font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Reset
            </button>
            {generatedUrl && (
              <a
                href={generatedUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl text-[12px] font-semibold text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors"
              >
                Preview ↗
              </a>
            )}
          </div>
        </div>

        {/* Right: templates + guide */}
        <div className="space-y-5">
          {/* Quick templates */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.07em] mb-2">
              Quick Templates
            </p>
            <div className="space-y-1.5">
              {UTM_TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  onClick={() => applyTemplate(t)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all text-left"
                >
                  <span>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Parameter guide */}
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.07em] mb-2">
              Parameter Guide
            </p>
            <div className="space-y-2.5">
              {UTM_FIELDS.map((f) => (
                <div key={f.key}>
                  <p className="text-[10px] font-bold text-blue-500 mb-0.5">
                    {f.label}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    {f.hint}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function SCOPSCampaigns() {
  const [, navigate] = useLocation();
  const [period, setPeriod] = useState("60d");
  // Admin user for nav
  const { data: adminUser } = trpc.auth.me.useQuery();
  // Source/channel performance
  const { data: dashData } = trpc.dashboard.overview.useQuery(undefined, {
    refetchInterval: 120_000,
  });

  // Pipeline stage counts for lead funnel
  const { data: pipelineData } = trpc.pipeline.summary.useQuery(undefined, {
    refetchInterval: 120_000,
  });

  // Blog posts
   const { data: blogData, refetch: refetchBlog } = trpc.blog.getAll.useQuery(
    undefined,
    { refetchInterval: 60_000 }
  );
  // Mutations — blog.setStatus handles both publish and unpublish
  const publishMutation = trpc.blog.setStatus.useMutation({
    onSuccess: () => refetchBlog(),
  });
  const unpublishMutation = trpc.blog.setStatus.useMutation({
    onSuccess: () => refetchBlog(),
  });

  // Data
  const sourcePerf: any[] = dashData?.sourcePerformance ?? [];
  const stageCounts: Record<string, number> =
    Object.fromEntries((pipelineData?.stageCounts ?? []).map((s: { stage: string; count: number }) => [s.stage, s.count]));
  const totalLeads = sourcePerf.reduce((s, r) => s + (r.leads ?? 0), 0);

  const posts: any[] = Array.isArray(blogData) ? blogData : [];

  // Landing pages — sourced from dashboard or hardcoded until UTM attribution is live
  const landingPages = [
    { title: "Zillow Organic", visitors: 0, leads: 0 },
    { title: "Facebook Retargeting", visitors: 0, leads: 0 },
    { title: "Google Search", visitors: 0, leads: 0 },
    { title: "Email Newsletter", visitors: 0, leads: 0 },
  ];

  function handleTogglePublish(id: number, currentStatus: string) {
    if (currentStatus === "published") {
      unpublishMutation.mutate({ id, status: "draft" });
    } else {
      publishMutation.mutate({ id, status: "published" });
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SCOPSNav adminUser={{ name: adminUser?.name ?? "Loading…", adminRole: (adminUser as any)?.adminRole ?? null }} currentPage="utm-builder" />

      <div className="max-w-[1200px] mx-auto px-6 py-6 space-y-4">

        {/* ── 1. CAMPAIGN STATUS BAR ── */}
        <CampaignStatusBar totalLeads={totalLeads} />

        {/* ── 2. BLOG POSTS + LANDING PAGES (content row) ── */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <BlogPosts
              posts={posts}
              onNew={() => navigate("/scops/blog?new=1")}
              onPreview={(slug) =>
                window.open(`/blog/${slug}`, "_blank")
              }
              onEdit={(id) => navigate(`/scops/blog?edit=${id}`)}
              onTogglePublish={handleTogglePublish}
            />
          </div>
          <LandingPages rows={landingPages} />
        </div>

        {/* ── 3. CHANNEL PERFORMANCE + LEAD FUNNEL ── */}
        <div className="grid grid-cols-3 gap-4">
          <ChannelPerformance
            rows={sourcePerf}
            period={period}
            onPeriodChange={setPeriod}
          />
          <LeadFunnel stageCounts={stageCounts} />
        </div>

        {/* ── 4. UTM BUILDER ── */}
        <UtmBuilder />

      </div>
    </div>
  );
}
