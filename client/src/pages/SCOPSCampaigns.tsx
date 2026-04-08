/**
 * SCOPSCampaigns.tsx — Merged April 2026
 *
 * Absorbs the Email tab. Four sub-tabs:
 *   Overview  → Channel performance, Lead funnel, CPL tracker
 *   Content   → Blog posts, Landing pages
 *   Email     → Lists, Sequences, Analytics (Resend)
 *   UTM       → Builder + templates
 *
 * Nav change: remove "Email" tab, redirect /scops/email → /scops/campaigns?tab=email
 *
 * DROP-IN REPLACEMENT for client/src/pages/scops/SCOPSCampaigns.tsx
 */

import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import SCOPSNav from "@/components/SCOPSNav";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const CAMPAIGN_START = new Date("2026-04-08");
const AD_BUDGET = { google: 1100, meta: 900, retargeting: 400, total: 3000 };
const M1 = { leads: 20, consultations: 8, contracts: 1, cplTarget: 100 };

const CHANNEL_BUDGETS: Record<string, number> = {
  google: 1100, "google ads": 1100,
  meta: 900, facebook: 900, "facebook ads": 900,
  retargeting: 400,
};

const SOURCE_ICONS: Record<string, string> = {
  google: "🔍", "google ads": "🔍",
  meta: "📘", facebook: "📘", "facebook ads": "📘",
  instagram: "📸", zillow: "🏠", referral: "🤝",
  website: "🌐", email: "📧", retargeting: "🎯",
};

const LANDING_PAGES_CONFIG = [
  { label: "/get-in-touch — Contact Form", value: "https://apollohomebuilders.com/get-in-touch" },
  { label: "/find-your-home — Listings",   value: "https://apollohomebuilders.com/find-your-home" },
  { label: "/homes — Homes for Sale",      value: "https://apollohomebuilders.com/homes" },
  { label: "/lots — Available Lots",       value: "https://apollohomebuilders.com/lots" },
  { label: "/ — Homepage",                value: "https://apollohomebuilders.com" },
];

const UTM_TEMPLATES = [
  { label: "Google Search",    icon: "🔍", params: { source: "google",    medium: "cpc",        campaign: "pahrump-new-homes", content: "search-ad",      term: "pahrump+new+homes"    } },
  { label: "Google Brand",     icon: "🔍", params: { source: "google",    medium: "cpc",        campaign: "apollo-brand",       content: "brand-ad",       term: "apollo+home+builders" } },
  { label: "Facebook Lead",    icon: "📘", params: { source: "facebook",  medium: "social",     campaign: "pahrump-awareness",  content: "carousel-homes", term: ""                     } },
  { label: "Instagram Reel",   icon: "📸", params: { source: "instagram", medium: "social",     campaign: "pahrump-lifestyle",  content: "reel-video",     term: ""                     } },
  { label: "Email Newsletter", icon: "📧", params: { source: "email",     medium: "newsletter", campaign: "monthly-update",     content: "cta-button",     term: ""                     } },
];

const UTM_FIELDS = [
  { key: "source"   as const, label: "utm_source",   placeholder: "google",            hint: "The marketing channel · e.g. google, facebook, email" },
  { key: "medium"   as const, label: "utm_medium",   placeholder: "cpc",               hint: "The marketing medium · e.g. cpc, social, email" },
  { key: "campaign" as const, label: "utm_campaign", placeholder: "pahrump-new-homes", hint: "The ad group or campaign name" },
  { key: "content"  as const, label: "utm_content",  placeholder: "carousel-homes",    hint: "The specific ad or creative variant" },
  { key: "term"     as const, label: "utm_term",     placeholder: "pahrump+new+homes", hint: "Paid keyword — Google Ads only" },
];

const FUNNEL_STAGES = [
  { key: "NEW_INQUIRY",     label: "New Inquiry",     color: "bg-blue-500"    },
  { key: "QUALIFIED",       label: "Qualified",       color: "bg-blue-400"    },
  { key: "TOUR_SCHEDULED",  label: "Tour Scheduled",  color: "bg-teal-500"    },
  { key: "TOURED",          label: "Toured",          color: "bg-teal-400"    },
  { key: "OFFER_SUBMITTED", label: "Offer Submitted", color: "bg-emerald-500" },
  { key: "UNDER_CONTRACT",  label: "Under Contract",  color: "bg-emerald-600" },
  { key: "CLOSED",          label: "Closed",          color: "bg-emerald-700" },
];

// Known Resend audience lists (from GTM setup)
const KNOWN_LISTS = [
  { id: "8281a905-19a8-4e2c-9711-ef6b67318d1f", name: "2026 Buyers Guide",   description: "Downloaded the Pahrump Home Buyer's Guide", source: "Homepage email capture" },
  { id: "newsletter",                             name: "Newsletter",          description: "General site newsletter subscribers",       source: "Footer subscribe form"  },
];

// GTM email sequences (from strategy doc)
const EMAIL_SEQUENCES = [
  { name: "New Lead Welcome",          trigger: "Contact form submission",   emails: 5, window: "14 days",  goal: "Book a consultation",     status: "active" },
  { name: "Newsletter Welcome Series", trigger: "Newsletter sign-up",        emails: 3, window: "7 days",   goal: "Build trust + showcase",  status: "active" },
  { name: "Consultation Confirmation", trigger: "Calendly booking",          emails: 2, window: "24 hours", goal: "Reduce no-shows",         status: "active" },
  { name: "Post-Consult Re-engage",    trigger: "No contract after consult", emails: 4, window: "30 days",  goal: "Re-engage warm leads",    status: "active" },
  { name: "New Listing Alert",         trigger: "Property published",        emails: 1, window: "Same day", goal: "Drive listing traffic",   status: "active" },
  { name: "Tour Reminder",             trigger: "Appointment scheduled",     emails: 2, window: "48 hours", goal: "Reduce no-shows",         status: "draft"  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function daysSince(d: Date) { return Math.max(1, Math.floor((Date.now() - d.getTime()) / 86_400_000) + 1); }
function pct(a: number, t: number) { return t === 0 ? 0 : Math.min(100, Math.round((a / t) * 100)); }

function buildUtmUrl(base: string, p: { source: string; medium: string; campaign: string; content: string; term: string }) {
  if (!base) return "";
  const q = new URLSearchParams();
  if (p.source)   q.set("utm_source",   p.source);
  if (p.medium)   q.set("utm_medium",   p.medium);
  if (p.campaign) q.set("utm_campaign", p.campaign);
  if (p.content)  q.set("utm_content",  p.content);
  if (p.term)     q.set("utm_term",     p.term);
  const qs = q.toString();
  return qs ? `${base}?${qs}` : base;
}

// ─── SHARED UI ────────────────────────────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 ${className}`}>{children}</div>;
}

function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h2 className="text-[14px] font-semibold text-slate-800 tracking-tight">{title}</h2>
        {sub && <span className="text-[10px] text-slate-400 uppercase tracking-wide">{sub}</span>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-lg">{icon}</div>
      <p className="text-[13px] font-medium text-slate-600">{title}</p>
      <p className="text-[11px] text-slate-400 mt-1 max-w-[220px] leading-relaxed">{sub}</p>
    </div>
  );
}

function GoalBar({ label, actual, target, prefix = "" }: { label: string; actual: number; target: number; prefix?: string }) {
  const p = pct(actual, target);
  const color = p >= 100 ? "bg-emerald-500" : p >= 60 ? "bg-blue-500" : "bg-amber-400";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-[11px] text-slate-500 font-medium">{label}</span>
        <span className="text-[11px] font-semibold text-slate-800">
          {prefix}{actual}<span className="text-slate-400 font-normal"> / {prefix}{target}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

// ─── CAMPAIGN STATUS BAR (shared across all tabs) ────────────────────────────

function CampaignStatusBar({ totalLeads }: { totalLeads: number }) {
  const day = daysSince(CAMPAIGN_START);
  const blendedCpl = totalLeads > 0 ? Math.round(AD_BUDGET.total / totalLeads) : null;
  const cplOk = blendedCpl != null && blendedCpl <= 120;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[13px] font-semibold text-slate-800">Month 1 Campaign Active</span>
          </div>
          <span className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full">Day {day} of 30</span>
          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct(day, 30)}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-[12px]">
            <span className="text-slate-400">Budget <strong className="text-slate-700">$3,000/mo</strong></span>
            <span className="w-px h-4 bg-slate-200 inline-block" />
            <span className="text-slate-500">Leads <strong className="text-slate-800">{totalLeads}</strong><span className="text-slate-400"> / 20</span></span>
            <span className="w-px h-4 bg-slate-200 inline-block" />
            <span className="text-slate-500">CPL <strong className={blendedCpl == null ? "text-slate-400" : cplOk ? "text-emerald-600" : "text-red-500"}>{blendedCpl != null ? `$${blendedCpl}` : "—"}</strong><span className="text-slate-400"> target $80–120</span></span>
          </div>
          <div className="flex gap-2">
            <button className="text-[10px] font-medium text-slate-400 border border-dashed border-slate-200 rounded-lg px-3 py-1.5 hover:border-blue-300 hover:text-blue-500 transition-colors">🔍 Connect Google Ads</button>
            <button className="text-[10px] font-medium text-slate-400 border border-dashed border-slate-200 rounded-lg px-3 py-1.5 hover:border-blue-300 hover:text-blue-500 transition-colors">📘 Connect Meta Ads</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────

function ChannelPerformance({ rows, period, onPeriodChange }: { rows: any[]; period: string; onPeriodChange: (p: string) => void }) {
  const totalLeads = rows.reduce((s, r) => s + (r.leads ?? 0), 0);
  const maxLeads   = Math.max(1, ...rows.map((r) => r.leads ?? 0));

  return (
    <Card className="col-span-2">
      <SectionHeader title="Channel Performance" action={
        <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-100">
          {["7d", "30d", "60d", "All"].map((p) => (
            <button key={p} onClick={() => onPeriodChange(p)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors ${period === p ? "bg-white text-slate-800 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"}`}>
              {p}
            </button>
          ))}
        </div>
      } />
      {rows.length === 0
        ? <EmptyState icon="📊" title="No channel data yet" sub="Leads appear here once UTM tracking is live and ads are running" />
        : (
          <div className="space-y-3">
            {[...rows].sort((a, b) => (b.leads ?? 0) - (a.leads ?? 0)).map((r) => {
              const icon   = SOURCE_ICONS[r.source?.toLowerCase()] ?? "🌐";
              const budget = CHANNEL_BUDGETS[r.source?.toLowerCase()] ?? 0;
              const cpl    = r.leads > 0 && budget > 0 ? Math.round(budget / r.leads) : null;
              return (
                <div key={r.source} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 w-32 shrink-0">
                    <span className="text-[14px]">{icon}</span>
                    <span className="text-[12px] text-slate-700 capitalize truncate">{r.source}</span>
                  </div>
                  <div className="flex-1 h-6 bg-slate-50 rounded-lg overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-lg flex items-center justify-end pr-2 transition-all duration-700"
                      style={{ width: `${Math.max(pct(r.leads ?? 0, maxLeads), (r.leads ?? 0) > 0 ? 6 : 0)}%` }}>
                      {(r.leads ?? 0) > 0 && <span className="text-[10px] text-white font-bold">{r.leads}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="w-10 text-right"><p className="text-[11px] font-semibold text-slate-800">{r.leads ?? 0}</p><p className="text-[9px] text-slate-400">leads</p></div>
                    <div className="w-10 text-right"><p className="text-[11px] font-semibold text-slate-800">{r.tours ?? 0}</p><p className="text-[9px] text-slate-400">tours</p></div>
                    <div className="w-16 text-right">
                      <p className={`text-[11px] font-semibold ${cpl != null && cpl <= 120 ? "text-emerald-600" : cpl != null ? "text-red-500" : "text-slate-300"}`}>{cpl != null ? `$${cpl}` : "—"}</p>
                      <p className="text-[9px] text-slate-400">CPL</p>
                    </div>
                    <div className="w-10 text-right">
                      <p className={`text-[11px] font-semibold ${(r.contracts ?? 0) > 0 ? "text-emerald-600" : "text-slate-300"}`}>{r.contracts ?? 0}</p>
                      <p className="text-[9px] text-slate-400">contracts</p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide w-32 shrink-0">TOTAL</span>
              <div className="flex-1" />
              <div className="flex items-center gap-4 shrink-0">
                <div className="w-10 text-right"><p className="text-[12px] font-bold text-slate-800">{totalLeads}</p></div>
                <div className="w-10 text-right"><p className="text-[12px] font-bold text-slate-800">{rows.reduce((s, r) => s + (r.tours ?? 0), 0)}</p></div>
                <div className="w-16 text-right"><p className="text-[12px] font-bold text-slate-800">{totalLeads > 0 ? `$${Math.round(AD_BUDGET.total / totalLeads)}` : "—"}</p></div>
                <div className="w-10 text-right"><p className="text-[12px] font-bold text-emerald-600">{rows.reduce((s, r) => s + (r.contracts ?? 0), 0)}</p></div>
              </div>
            </div>
          </div>
        )}
    </Card>
  );
}

function LeadFunnel({ stageCounts }: { stageCounts: Record<string, number> }) {
  const topCount   = stageCounts?.NEW_INQUIRY ?? 0;
  const totalActive = Object.values(stageCounts).reduce((s, v) => s + (v ?? 0), 0);
  return (
    <Card>
      <SectionHeader title="Lead Funnel" sub="Live · All Time" />
      <div className="space-y-1.5">
        {FUNNEL_STAGES.map((stage) => {
          const count = stageCounts?.[stage.key] ?? 0;
          const w = topCount > 0 ? pct(count, topCount) : 0;
          return (
            <div key={stage.key} className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 w-24 shrink-0 text-right pr-1">{stage.label}</span>
              <div className="flex-1 h-5 bg-slate-50 rounded-md overflow-hidden">
                <div className={`h-full ${stage.color} rounded-md flex items-center justify-end pr-1.5 transition-all duration-700`}
                  style={{ width: `${Math.max(w, count > 0 ? 8 : 0)}%` }}>
                  {count > 0 && <span className="text-[9px] text-white font-bold">{count}</span>}
                </div>
              </div>
              {count === 0 && <span className="text-[10px] text-slate-200 w-4">0</span>}
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

function GoalPanel({ totalLeads, toursThisWeek, contracts }: { totalLeads: number; toursThisWeek: number; contracts: number }) {
  const blendedCpl = totalLeads > 0 ? Math.round(AD_BUDGET.total / totalLeads) : 0;
  return (
    <Card>
      <SectionHeader title="Month 1 Goals" />
      <div className="space-y-4">
        <GoalBar label="Leads"         actual={totalLeads}    target={M1.leads}        />
        <GoalBar label="Consultations" actual={toursThisWeek} target={M1.consultations} />
        <GoalBar label="CPL"           actual={blendedCpl}    target={M1.cplTarget}    prefix="$" />
        <GoalBar label="Contracts"     actual={contracts}     target={M1.contracts}    />
      </div>
      <div className="mt-5 pt-4 border-t border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.06em] mb-3">Budget allocation</p>
        {([["Google Search", AD_BUDGET.google], ["Meta Ads", AD_BUDGET.meta], ["Retargeting", AD_BUDGET.retargeting]] as [string, number][]).map(([name, budget]) => (
          <div key={name} className="flex items-center gap-2 mb-2">
            <span className="text-[11px] text-slate-500 w-24 shrink-0">{name}</span>
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-400 rounded-full" style={{ width: `${pct(budget, AD_BUDGET.total)}%` }} />
            </div>
            <span className="text-[11px] font-semibold text-slate-700 w-14 text-right">${budget.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function OverviewTab({ sourcePerf, stageCounts, toursThisWeek, period, onPeriodChange }: {
  sourcePerf: any[]; stageCounts: Record<string, number>; toursThisWeek: number; period: string; onPeriodChange: (p: string) => void;
}) {
  const totalLeads     = sourcePerf.reduce((s, r) => s + (r.leads ?? 0), 0);
  const totalContracts = sourcePerf.reduce((s, r) => s + (r.contracts ?? 0), 0);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <ChannelPerformance rows={sourcePerf} period={period} onPeriodChange={onPeriodChange} />
        <LeadFunnel stageCounts={stageCounts} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {/* Landing pages quick view */}
        <Card className="col-span-2">
          <SectionHeader title="Landing Pages" sub="Past 60 Days" />
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {["Page", "Visitors", "Leads", "Conv. Rate"].map((h) => (
                  <th key={h} className="pb-2 text-left text-[9px] font-bold text-slate-400 uppercase tracking-[0.06em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { title: "Zillow Organic",       icon: "🏠", visitors: 0, leads: 0 },
                { title: "Facebook Retargeting", icon: "📘", visitors: 0, leads: 0 },
                { title: "Google Search",        icon: "🔍", visitors: 0, leads: 0 },
                { title: "Email Newsletter",     icon: "📧", visitors: 0, leads: 0 },
              ].map((r) => {
                const conv = r.visitors > 0 ? ((r.leads / r.visitors) * 100).toFixed(1) : "0.0";
                return (
                  <tr key={r.title} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 flex items-center gap-2"><span className="text-[13px]">{r.icon}</span><span className="text-[12px] text-slate-700">{r.title}</span></td>
                    <td className="py-2.5 text-[12px] font-semibold text-slate-800">{r.visitors.toLocaleString()}</td>
                    <td className="py-2.5 text-[12px] text-slate-600">{r.leads}</td>
                    <td className="py-2.5 text-[11px] text-slate-400">{conv}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
        <GoalPanel totalLeads={totalLeads} toursThisWeek={toursThisWeek} contracts={totalContracts} />
      </div>
    </div>
  );
}

// ─── CONTENT TAB ──────────────────────────────────────────────────────────────

function ContentTab({ posts, onNew, onPreview, onEdit, onTogglePublish }: {
  posts: any[]; onNew: () => void; onPreview: (slug: string) => void;
  onEdit: (id: string) => void; onTogglePublish: (id: number, status: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = posts.filter((p) => !search || p.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-[14px] font-semibold text-slate-800">Blog Posts</h2>
            <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
              {posts.filter((p) => p.status === "published").length} published
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search posts..."
              className="text-[12px] px-3 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-blue-400 w-36 transition-all" />
            <button onClick={onNew} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[12px] font-semibold hover:bg-slate-700 transition-colors">
              + New Post
            </button>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              {["Title", "Status", "Views", "Leads", ""].map((h) => (
                <th key={h} className="pb-2 text-left text-[9px] font-bold text-slate-400 uppercase tracking-[0.06em]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((post) => (
              <tr key={post.id} className="border-b border-slate-50 hover:bg-slate-50 group transition-colors">
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    {post.coverImageUrl && <img src={post.coverImageUrl} alt="" className="w-10 h-7 rounded-md object-cover border border-slate-100 shrink-0" />}
                    <div>
                      <p className="text-[12px] font-semibold text-slate-800 truncate max-w-[280px]">{post.title}</p>
                      {post.author && <p className="text-[10px] text-slate-400 mt-0.5">{post.author}</p>}
                    </div>
                  </div>
                </td>
                <td className="py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${post.status === "published" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                    {post.status === "published" ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="py-3 text-[12px] text-slate-600">{(post.viewCount ?? 0).toLocaleString()}</td>
                <td className="py-3 text-[12px] text-slate-600">{post.leadCount ?? 0}</td>
                <td className="py-3">
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onPreview(post.slug)} className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50">Preview</button>
                    <button onClick={() => onEdit(post.id)} className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50">Edit</button>
                    <button onClick={() => onTogglePublish(post.id, post.status)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors ${post.status === "published" ? "text-amber-600 border border-amber-200 hover:bg-amber-50" : "text-emerald-600 border border-emerald-200 hover:bg-emerald-50"}`}>
                      {post.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-[12px] text-slate-400">{search ? "No posts match your search" : "No blog posts yet"}</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── EMAIL TAB ────────────────────────────────────────────────────────────────

type EmailSubTab = "lists" | "sequences" | "analytics";

function EmailTab() {
  const [sub, setSub] = useState<EmailSubTab>("lists");
  const [selectedList, setSelectedList] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Sub-nav */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-100 shadow-sm p-1 w-fit">
        {([["lists", "👥", "Lists"], ["sequences", "📨", "Sequences"], ["analytics", "📈", "Analytics"]] as [EmailSubTab, string, string][]).map(([key, icon, label]) => (
          <button key={key} onClick={() => setSub(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors ${sub === key ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
            <span>{icon}</span>{label}
          </button>
        ))}
      </div>

      {/* Lists */}
      {sub === "lists" && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[12px] font-bold text-slate-700 uppercase tracking-[0.07em]">Lists</h3>
              <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-700 transition-colors">+ New List</button>
            </div>
            <div className="space-y-2">
              {KNOWN_LISTS.map((list) => (
                <button key={list.id} onClick={() => setSelectedList(list.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${selectedList === list.id ? "border-blue-300 bg-blue-50" : "border-slate-100 hover:border-slate-200 bg-slate-50"}`}>
                  <p className="text-[12px] font-semibold text-slate-800">{list.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{list.description}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Source: {list.source}</p>
                </button>
              ))}
            </div>
          </Card>
          <Card className="col-span-2">
            {selectedList ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-[14px] font-semibold text-slate-800">{KNOWN_LISTS.find((l) => l.id === selectedList)?.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Managed via Resend</p>
                  </div>
                  <a href="https://resend.com/audiences" target="_blank" rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors">
                    View in Resend ↗
                  </a>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[["Subscribers", "—"], ["Avg Open Rate", "—"], ["Avg Click Rate", "—"]].map(([label, val]) => (
                    <div key={label} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">{label}</p>
                      <p className="text-[24px] font-bold text-slate-700 mt-1">{val}</p>
                    </div>
                  ))}
                </div>
                <EmptyState icon="📧" title="Wire Resend API for live member data" sub="Subscriber count and engagement metrics will appear once the Resend Audiences API is connected" />
              </>
            ) : (
              <EmptyState icon="📋" title="Select a list to view members" sub="Choose a list on the left to see subscribers and engagement data" />
            )}
          </Card>
        </div>
      )}

      {/* Sequences */}
      {sub === "sequences" && (
        <Card>
          <SectionHeader title="Email Sequences" sub="Powered by Resend" action={
            <button className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-700 transition-colors">+ New Sequence</button>
          } />
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {["Sequence", "Trigger", "Emails", "Window", "Goal", "Status"].map((h) => (
                  <th key={h} className="pb-2 text-left text-[9px] font-bold text-slate-400 uppercase tracking-[0.06em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EMAIL_SEQUENCES.map((seq) => (
                <tr key={seq.name} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 text-[12px] font-semibold text-slate-800">{seq.name}</td>
                  <td className="py-3 text-[12px] text-slate-500">{seq.trigger}</td>
                  <td className="py-3 text-[12px] text-slate-600">{seq.emails}</td>
                  <td className="py-3 text-[11px] text-slate-500">{seq.window}</td>
                  <td className="py-3 text-[11px] text-slate-500 max-w-[160px] truncate">{seq.goal}</td>
                  <td className="py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${seq.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                      {seq.status === "active" ? "Active" : "Draft"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Analytics */}
      {sub === "analytics" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[["Total Subscribers", "—", "Across all lists"], ["Avg Open Rate", "—", "Industry avg: 21%"], ["Avg Click Rate", "—", "Industry avg: 2.5%"]].map(([label, val, sub]) => (
              <Card key={label}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-2">{label}</p>
                <p className="text-[32px] font-bold text-slate-400">{val}</p>
                <p className="text-[11px] text-slate-400 mt-1">{sub}</p>
              </Card>
            ))}
          </div>
          <Card>
            <SectionHeader title="Email Performance Over Time" />
            <EmptyState icon="📈" title="Analytics available once emails are sending" sub="Open rates, click rates, and unsubscribes will appear here once your sequences are active and Resend data is flowing" />
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── UTM TAB ──────────────────────────────────────────────────────────────────

function UtmTab() {
  const [landingPage, setLandingPage] = useState(LANDING_PAGES_CONFIG[0].value);
  const [params, setParams] = useState({ source: "google", medium: "cpc", campaign: "pahrump-new-homes", content: "carousel-homes", term: "pahrump+new+homes" });
  const [copied, setCopied] = useState(false);

  const generatedUrl = buildUtmUrl(landingPage, params);

  function handleCopy() {
    navigator.clipboard.writeText(generatedUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  return (
    <Card>
      <SectionHeader title="UTM Builder" sub="Paid · Social · Email" />
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.07em] mb-1.5">Landing Page</label>
            <select value={landingPage} onChange={(e) => setLandingPage(e.target.value)}
              className="w-full text-[12px] px-3 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white transition-all">
              {LANDING_PAGES_CONFIG.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {UTM_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="block text-[10px] font-bold text-blue-500 uppercase tracking-[0.07em] mb-1.5">{f.label}</label>
                <input value={params[f.key]} onChange={(e) => setParams({ ...params, [f.key]: e.target.value })} placeholder={f.placeholder}
                  className="w-full text-[12px] px-3 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.07em] mb-1.5">Generated URL</label>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 min-h-[40px]">
              <p className="text-[11px] text-slate-600 break-all font-mono leading-relaxed">
                {generatedUrl || <span className="text-slate-300">Fill in fields above to generate URL</span>}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCopy} disabled={!generatedUrl}
              className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${copied ? "bg-emerald-500 text-white" : generatedUrl ? "bg-slate-900 text-white hover:bg-slate-700" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}>
              {copied ? "✓ Copied!" : "Copy URL"}
            </button>
            <button onClick={() => setParams({ source: "", medium: "", campaign: "", content: "", term: "" })}
              className="px-4 py-2.5 rounded-xl text-[12px] font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors">Reset</button>
            {generatedUrl && (
              <a href={generatedUrl} target="_blank" rel="noreferrer"
                className="px-4 py-2.5 rounded-xl text-[12px] font-semibold text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors">Preview ↗</a>
            )}
          </div>
        </div>
        <div className="space-y-5">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.07em] mb-2">Quick Templates</p>
            <div className="space-y-1.5">
              {UTM_TEMPLATES.map((t) => (
                <button key={t.label} onClick={() => setParams({ ...params, ...t.params })}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all text-left">
                  <span>{t.icon}</span>{t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.07em] mb-2">Parameter Guide</p>
            <div className="space-y-2.5">
              {UTM_FIELDS.map((f) => (
                <div key={f.key}>
                  <p className="text-[10px] font-bold text-blue-500 mb-0.5">{f.label}</p>
                  <p className="text-[10px] text-slate-500 leading-relaxed">{f.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

type MainTab = "overview" | "content" | "email" | "utm";

export default function SCOPSCampaigns() {
  const [, navigate]   = useLocation();
  const searchString   = useSearch();
  const urlParams      = new URLSearchParams(searchString);
  const initialTab     = (urlParams.get("tab") as MainTab) ?? "overview";

  const [activeTab, setActiveTab] = useState<MainTab>(initialTab);
  const [period, setPeriod]       = useState("60d");

  const { data: dashData }               = trpc.dashboard.overview.useQuery(undefined, { refetchInterval: 120_000 });
  const { data: pipelineData }           = trpc.pipeline.summary.useQuery(undefined,   { refetchInterval: 120_000 });
  const { data: blogData, refetch: rb }  = trpc.blog.getAll.useQuery(undefined,         { refetchInterval: 60_000  });
  const publishMutation   = trpc.blog.setStatus.useMutation({ onSuccess: () => rb() });
  const unpublishMutation = trpc.blog.setStatus.useMutation({ onSuccess: () => rb() });
  const { data: adminUser } = trpc.auth.me.useQuery();;

  const sourcePerf: any[]                  = dashData?.sourcePerformance ?? [];
  const stageCounts: Record<string,number> = Object.fromEntries((pipelineData?.stageCounts ?? []).map((s: { stage: string; count: number }) => [s.stage, s.count]));
  const toursThisWeek: number              = dashData?.toursThisWeek ?? 0;
  const totalLeads                         = sourcePerf.reduce((s, r) => s + (r.leads ?? 0), 0);
  const posts: any[] = Array.isArray(blogData) ? blogData : [];

  function switchTab(tab: MainTab) {
    setActiveTab(tab);
    navigate(`/scops/campaigns?tab=${tab}`, { replace: true });
  }

  function handleTogglePublish(id: number, status: string) {
    if (status === "published") {
      unpublishMutation.mutate({ id, status: "draft" });
    } else {
      publishMutation.mutate({ id, status: "published" });
    }
  }

  const TABS: { key: MainTab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "content",  label: "Content"  },
    { key: "email",    label: "Email"    },
    { key: "utm",      label: "UTM"      },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <SCOPSNav adminUser={{ name: adminUser?.name ?? "Loading…", adminRole: (adminUser as any)?.adminRole ?? null }} currentPage="campaigns" />

      <div className="max-w-[1200px] mx-auto px-6 py-6 space-y-4">

        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Campaigns</h1>
            <p className="text-[13px] text-slate-400 mt-0.5">Blog posts, landing pages, UTM tracking &amp; channel performance</p>
          </div>
          {activeTab === "content" && (
            <button onClick={() => navigate("/scops/blog?new=1")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-[12px] font-semibold hover:bg-slate-700 transition-colors">
              + New Post
            </button>
          )}
        </div>

        {/* Campaign status bar */}
        <CampaignStatusBar totalLeads={totalLeads} />

        {/* Main sub-nav */}
        <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-100 shadow-sm p-1 w-fit">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => switchTab(t.key)}
              className={`px-5 py-2 rounded-lg text-[12px] font-semibold transition-colors ${activeTab === t.key ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "overview" && <OverviewTab sourcePerf={sourcePerf} stageCounts={stageCounts} toursThisWeek={toursThisWeek} period={period} onPeriodChange={setPeriod} />}
        {activeTab === "content"  && <ContentTab posts={posts} onNew={() => navigate("/scops/blog?new=1")} onPreview={(slug) => window.open(`/blog/${slug}`, "_blank")} onEdit={(id) => navigate(`/scops/blog?edit=${id}`)} onTogglePublish={handleTogglePublish} />}
        {activeTab === "email"    && <EmailTab />}
        {activeTab === "utm"      && <UtmTab />}

      </div>
    </div>
  );
}
