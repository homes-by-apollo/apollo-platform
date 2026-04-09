/**
 * SCOPSPipeline.tsx — Overhauled April 2026
 *
 * Changes vs previous version:
 * - Contained in max-w-[1200px] mx-auto (was full-bleed)
 * - KPI summary bar: Total Active, At Risk, Tours This Week, New This Week
 * - Search + stage filter bar
 * - Dense kanban cards: name, score, price range, financing, timeline,
 *   days in stage, last activity, overdue warning
 * - Column headers show lead count + pipeline value
 * - Empty columns have a real empty state, not just "Drop here"
 * - Slide-out detail panel on card click
 * - Quick Add lead sheet per column
 * - Drag-to-stage via onDragEnd → pipeline.updateStage
 *
 * DROP-IN REPLACEMENT for client/src/pages/scops/SCOPSPipeline.tsx
 */

import { useState, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import SCOPSNav from "@/components/SCOPSNav";

// ─── STAGE CONFIG ─────────────────────────────────────────────────────────────

const STAGES = [
  { key: "NEW_INQUIRY",     label: "New Inquiry",     color: "border-t-blue-500",    dot: "bg-blue-500",    text: "text-blue-700",  bg: "bg-blue-50"    },
  { key: "QUALIFIED",       label: "Qualified",       color: "border-t-violet-500",  dot: "bg-violet-500",  text: "text-violet-700",bg: "bg-violet-50"  },
  { key: "TOUR_SCHEDULED",  label: "Tour Scheduled",  color: "border-t-sky-500",     dot: "bg-sky-500",     text: "text-sky-700",   bg: "bg-sky-50"     },
  { key: "TOURED",          label: "Toured",          color: "border-t-teal-500",    dot: "bg-teal-500",    text: "text-teal-700",  bg: "bg-teal-50"    },
  { key: "OFFER_SUBMITTED", label: "Offer Submitted", color: "border-t-amber-500",   dot: "bg-amber-500",   text: "text-amber-700", bg: "bg-amber-50"   },
  { key: "UNDER_CONTRACT",  label: "Under Contract",  color: "border-t-emerald-500", dot: "bg-emerald-500", text: "text-emerald-700",bg: "bg-emerald-50" },
  { key: "CLOSED",          label: "Closed",          color: "border-t-green-600",   dot: "bg-green-600",   text: "text-green-700", bg: "bg-green-50"   },
  { key: "LOST",            label: "Lost",            color: "border-t-red-400",     dot: "bg-red-400",     text: "text-red-600",   bg: "bg-red-50"     },
] as const;

type StageKey = typeof STAGES[number]["key"];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function relTime(d: string | Date | null | undefined) {
  if (!d) return "never";
  const ms = Date.now() - new Date(d).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function daysInStage(d: string | Date | null | undefined) {
  if (!d) return 0;
  return Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
}

function fullName(c: any) {
  return [c.firstName, c.lastName].filter(Boolean).join(" ") || c.email || "Unknown";
}

function scoreColor(score: string) {
  if (score === "HOT")  return "bg-red-500 text-white";
  if (score === "WARM") return "bg-amber-500 text-white";
  return "bg-slate-400 text-white";
}

function stageConfig(key: string) {
  return STAGES.find((s) => s.key === key) ?? STAGES[0];
}

const AVATAR_PALETTE = [
  "bg-blue-600", "bg-violet-600", "bg-teal-600",
  "bg-rose-600", "bg-amber-600", "bg-emerald-600",
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

function priceLabel(range: string | null | undefined) {
  if (!range) return null;
  return range.replace("_", "–").replace("K", "K");
}

// ─── SHARED UI ────────────────────────────────────────────────────────────────

function KpiChip({ label, value, accent = false, onClick }: {
  label: string; value: string | number; accent?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start px-4 py-3 rounded-xl border transition-colors text-left ${
        accent
          ? "bg-red-50 border-red-200 hover:border-red-300"
          : "bg-white border-slate-100 hover:border-slate-200"
      } ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <span className={`text-[22px] font-bold leading-none ${accent ? "text-red-600" : "text-slate-900"}`}>
        {value}
      </span>
      <span className={`text-[10px] font-medium mt-1.5 uppercase tracking-wide ${accent ? "text-red-500" : "text-slate-400"}`}>
        {label}
      </span>
    </button>
  );
}

// ─── LEAD CARD ────────────────────────────────────────────────────────────────

function LeadCard({
  lead,
  onClick,
  onDragStart,
  onDragEnd,
  isSelected,
}: {
  lead: any;
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isSelected: boolean;
}) {
  const name   = fullName(lead);
  const days   = daysInStage(lead.stageEnteredAt ?? lead.updatedAt);
  const isOver = lead.isOverdue || days > 3;
  const score  = lead.leadScore ?? "COLD";
  const stage  = stageConfig(lead.pipelineStage);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`bg-white rounded-xl border shadow-sm cursor-pointer select-none transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] ${
        isSelected ? "border-blue-400 ring-2 ring-blue-100" : isOver ? "border-red-200" : "border-slate-100"
      }`}
    >
      {/* Overdue banner */}
      {isOver && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-t-xl border-b border-red-100">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span className="text-[10px] font-semibold text-red-500 uppercase tracking-wide">
            {days}d in stage — needs action
          </span>
        </div>
      )}

      <div className="p-3 space-y-2.5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-8 h-8 rounded-full ${avatarColor(name)} flex items-center justify-center shrink-0`}>
              <span className="text-white text-[10px] font-bold">{initials(name)}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-slate-900 truncate leading-tight">{name}</p>
              <p className="text-[10px] text-slate-400 truncate leading-tight">
                {lead.email ?? lead.phone ?? "No contact"}
              </p>
            </div>
          </div>
          <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${scoreColor(score)}`}>
            {score}
          </span>
        </div>

        {/* Data pills row */}
        <div className="flex flex-wrap gap-1.5">
          {lead.priceRange && (
            <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              {priceLabel(lead.priceRange)}
            </span>
          )}
          {lead.financingStatus && (
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
              lead.financingStatus === "PRE_APPROVED"
                ? "bg-emerald-50 text-emerald-700"
                : lead.financingStatus === "FINANCING_NEEDED"
                ? "bg-amber-50 text-amber-700"
                : "bg-slate-100 text-slate-500"
            }`}>
              {lead.financingStatus === "PRE_APPROVED" ? "Pre-Approved"
                : lead.financingStatus === "CASH" ? "Cash"
                : lead.financingStatus === "FINANCING_NEEDED" ? "Needs Financing"
                : lead.financingStatus}
            </span>
          )}
          {lead.buyerTimeline && (
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
              lead.buyerTimeline === "ASAP"
                ? "bg-red-50 text-red-600"
                : "bg-slate-100 text-slate-500"
            }`}>
              {lead.buyerTimeline}
            </span>
          )}
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-50">
          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${stage.bg} ${stage.text}`}>
            {stage.label}
          </span>
          <span className="text-[10px] text-slate-400">{relTime(lead.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── KANBAN COLUMN ────────────────────────────────────────────────────────────

function KanbanColumn({
  stage,
  leads,
  selectedId,
  onCardClick,
  onDragOver,
  onDrop,
  onDragStart,
  onDragEnd,
  onAdd,
}: {
  stage: typeof STAGES[number];
  leads: any[];
  selectedId: string | null;
  onCardClick: (lead: any) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragStart: (lead: any) => void;
  onDragEnd: () => void;
  onAdd: () => void;
}) {
  const [isOver, setIsOver] = useState(false);

  const totalValue = leads.reduce((s, l) => {
    const range = l.priceRange ?? "";
    const match = range.match(/\d+/);
    return s + (match ? parseInt(match[0]) * 1000 : 0);
  }, 0);

  const overdue = leads.filter((l) => {
    const days = daysInStage(l.stageEnteredAt ?? l.updatedAt);
    return l.isOverdue || days > 3;
  }).length;

  return (
    <div className="flex flex-col min-w-[200px] max-w-[200px] shrink-0">
      {/* Column header */}
      <div className={`bg-white rounded-t-xl border border-b-0 border-slate-100 border-t-4 ${stage.color} px-3 py-2.5`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-slate-800 leading-tight">{stage.label}</span>
            <span className="text-[10px] font-bold text-white bg-slate-400 rounded-full w-4 h-4 flex items-center justify-center">
              {leads.length}
            </span>
            {overdue > 0 && (
              <span className="text-[9px] font-bold text-white bg-red-500 rounded-full px-1.5">
                {overdue}!
              </span>
            )}
          </div>
          <button
            onClick={onAdd}
            className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors shrink-0"
          >
            <span className="text-slate-500 text-[12px] font-bold leading-none">+</span>
          </button>
        </div>
        {totalValue > 0 && (
          <p className="text-[9px] text-slate-400 font-medium">
            ~${(totalValue / 1_000_000).toFixed(1)}M pipeline
          </p>
        )}
      </div>

      {/* Cards area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsOver(true); onDragOver(e); }}
        onDragLeave={() => setIsOver(false)}
        onDrop={() => { setIsOver(false); onDrop(); }}
        className={`flex-1 border border-t-0 border-slate-100 rounded-b-xl p-2 space-y-2 min-h-[120px] transition-colors ${
          isOver ? "bg-blue-50 border-blue-200" : "bg-slate-50/50"
        }`}
      >
        {leads.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-6 rounded-lg border-2 border-dashed transition-colors ${
            isOver ? "border-blue-300 bg-blue-50" : "border-slate-200"
          }`}>
            <div className={`w-6 h-6 rounded-full ${stage.dot} opacity-20 mb-1.5`} />
            <p className="text-[10px] text-slate-300 font-medium">No leads</p>
          </div>
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={() => onCardClick(lead)}
              onDragStart={() => onDragStart(lead)}
              onDragEnd={onDragEnd}
              isSelected={selectedId === lead.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── DETAIL PANEL ─────────────────────────────────────────────────────────────

function DetailPanel({
  lead,
  onClose,
  onNavigate,
}: {
  lead: any;
  onClose: () => void;
  onNavigate: (id: string) => void;
}) {
  const name    = fullName(lead);
  const stage   = stageConfig(lead.pipelineStage);
  const [note, setNote]   = useState("");
  const addActivity = trpc.pipeline.addActivity?.useMutation?.();

  function submitNote() {
    if (!note.trim()) return;
    addActivity?.mutate?.({ contactId: lead.id, activityType: "NOTE_ADDED", description: note });
    setNote("");
  }

  return (
    <div className="w-[300px] shrink-0 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-9 h-9 rounded-full ${avatarColor(name)} flex items-center justify-center shrink-0`}>
            <span className="text-white text-[11px] font-bold">{initials(name)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-slate-900 truncate leading-tight">{name}</p>
            <span className={`inline-flex text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 ${scoreColor(lead.leadScore ?? "COLD")}`}>
              {lead.leadScore ?? "COLD"}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors shrink-0">
          <span className="text-slate-400 text-[14px]">✕</span>
        </button>
      </div>

      {/* Stage */}
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Stage</p>
        <span className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full ${stage.bg} ${stage.text}`}>
          {stage.label}
        </span>
      </div>

      {/* Contact info */}
      <div className="px-4 py-3 border-b border-slate-100 space-y-1.5">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Contact</p>
        {lead.email && <p className="text-[11px] text-slate-600 truncate">{lead.email}</p>}
        {lead.phone && <p className="text-[11px] text-slate-600">{lead.phone}</p>}
        {!lead.email && !lead.phone && <p className="text-[11px] text-slate-400">No contact info</p>}
      </div>

      {/* Buyer profile */}
      <div className="px-4 py-3 border-b border-slate-100 space-y-2">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Buyer Profile</p>
        {[
          ["Budget",    priceLabel(lead.priceRange)],
          ["Timeline",  lead.buyerTimeline],
          ["Financing", lead.financingStatus?.replace(/_/g, " ")],
          ["Source",    lead.source],
          ["In stage",  `${daysInStage(lead.stageEnteredAt ?? lead.updatedAt)}d`],
        ].map(([label, val]) => val ? (
          <div key={label} className="flex items-baseline justify-between">
            <span className="text-[10px] text-slate-400">{label}</span>
            <span className="text-[11px] font-medium text-slate-700">{val}</span>
          </div>
        ) : null)}
      </div>

      {/* Quick note */}
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-2">Quick Note</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note..."
          rows={2}
          className="w-full text-[11px] px-2.5 py-2 rounded-lg border border-slate-200 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-none transition-all"
        />
        <button
          onClick={submitNote}
          disabled={!note.trim()}
          className={`mt-1.5 w-full py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${note.trim() ? "bg-slate-900 text-white hover:bg-slate-700" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
        >
          Save Note
        </button>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 space-y-2 mt-auto">
        <button
          onClick={() => onNavigate(lead.id)}
          className="w-full py-2 rounded-xl bg-blue-600 text-white text-[12px] font-semibold hover:bg-blue-700 transition-colors"
        >
          Open Full Profile →
        </button>
        <a
          href={`tel:${lead.phone}`}
          className={`block w-full py-2 rounded-xl text-[12px] font-semibold text-center transition-colors border ${lead.phone ? "border-slate-200 text-slate-700 hover:bg-slate-50" : "border-slate-100 text-slate-300 cursor-not-allowed pointer-events-none"}`}
        >
          📞 Call {lead.phone ? lead.phone : "—"}
        </a>
      </div>
    </div>
  );
}

// ─── QUICK ADD SHEET ──────────────────────────────────────────────────────────

function QuickAddSheet({
  defaultStage,
  onClose,
  onSuccess,
}: {
  defaultStage: StageKey;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    priceRange: "", buyerTimeline: "", pipelineStage: defaultStage,
  });

  const create = trpc.pipeline.quickCreate?.useMutation?.({
    onSuccess: () => { onSuccess(); onClose(); },
  });

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[420px] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-slate-900">New Lead</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center">
            <span className="text-slate-400">✕</span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[["firstName","First Name"],["lastName","Last Name"]].map(([k,l]) => (
            <div key={k}>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">{l}</label>
              <input value={(form as any)[k]} onChange={(e) => set(k, e.target.value)} placeholder={l}
                className="w-full text-[12px] px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-blue-400 transition-all" />
            </div>
          ))}
        </div>
        {[["email","Email","email"],["phone","Phone","tel"]].map(([k,l,t]) => (
          <div key={k}>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">{l}</label>
            <input type={t} value={(form as any)[k]} onChange={(e) => set(k, e.target.value)} placeholder={l}
              className="w-full text-[12px] px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-blue-400 transition-all" />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">Stage</label>
            <select value={form.pipelineStage} onChange={(e) => set("pipelineStage", e.target.value)}
              className="w-full text-[12px] px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-blue-400 bg-white">
              {STAGES.filter(s => s.key !== "LOST").map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">Timeline</label>
            <select value={form.buyerTimeline} onChange={(e) => set("buyerTimeline", e.target.value)}
              className="w-full text-[12px] px-3 py-2 rounded-lg border border-slate-200 outline-none focus:border-blue-400 bg-white">
              <option value="">Unknown</option>
              <option value="ASAP">ASAP</option>
              <option value="1_3_MONTHS">1–3 months</option>
              <option value="3_6_MONTHS">3–6 months</option>
              <option value="6_PLUS_MONTHS">6+ months</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button
            onClick={() => create?.mutate?.(form as any)}
            disabled={!form.firstName && !form.email}
            className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${
              form.firstName || form.email
                ? "bg-slate-900 text-white hover:bg-slate-700"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            Add Lead
          </button>
          <button onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-[12px] font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function SCOPSPipeline() {
  const [, navigate]   = useLocation();
  const searchString   = useSearch();
  const urlParams      = new URLSearchParams(searchString);
  const focusLeadId    = urlParams.get("lead");

  const [search,      setSearch]      = useState("");
  const [stageFilter, setStageFilter] = useState<StageKey | "ALL">("ALL");
  const [scoreFilter, setScoreFilter] = useState<"ALL" | "HOT" | "WARM" | "COLD">("ALL");
  const [selectedLead,setSelectedLead] = useState<any | null>(null);
  const [dragging,    setDragging]    = useState<any | null>(null);
   const [addStage,    setAddStage]    = useState<StageKey | null>(null);
  // Auth
  const { data: adminUser } = trpc.auth.me.useQuery();
  // Data
  const { data: summary, refetch: refetchSummary } = trpc.pipeline.summary.useQuery(undefined, { refetchInterval: 60_000 });
  const { data: leadsData, refetch: refetchLeads } = trpc.pipeline.list.useQuery(
    { search: search || undefined, stage: stageFilter === "ALL" ? undefined : stageFilter } as any,
    { refetchInterval: 60_000 }
  );

  const updateStage = trpc.pipeline.updateStage?.useMutation?.({
    onSuccess: () => { refetchLeads(); refetchSummary(); },
  });

  const leads: any[] = (leadsData as any)?.leads ?? (leadsData as any)?.contacts ?? (Array.isArray(leadsData) ? leadsData : []);

  // Filter client-side for score
  const filtered = leads.filter((l) => {
    const matchScore = scoreFilter === "ALL" || l.leadScore === scoreFilter;
    return matchScore;
  });

  // Group by stage
  const byStage: Record<string, any[]> = {};
  STAGES.forEach((s) => { byStage[s.key] = []; });
  filtered.forEach((l) => {
    const k = l.pipelineStage ?? "NEW_INQUIRY";
    if (byStage[k]) byStage[k].push(l);
    else byStage["NEW_INQUIRY"].push(l);
  });

  // Open lead from URL param
  const focusedLead = focusLeadId ? leads.find((l) => l.id === focusLeadId) ?? null : null;
  const activeLead = selectedLead ?? focusedLead;

  function handleDrop(targetStage: StageKey) {
    if (!dragging || dragging.pipelineStage === targetStage) return;
    updateStage?.mutate?.({ id: dragging.id, stage: targetStage });
    setDragging(null);
  }

  function refetchAll() { refetchLeads(); refetchSummary(); }

  const kpis = summary as any;

  return (
    <div className="min-h-screen bg-slate-50">
      <SCOPSNav currentPage="pipeline" adminUser={{ name: adminUser?.name ?? "Loading…", adminRole: (adminUser as any)?.adminRole ?? null }} />

      <div className="max-w-[1200px] mx-auto px-6 py-6 space-y-4">

        {/* ── PAGE HEADER ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Pipeline</h1>
            <p className="text-[13px] text-slate-400 mt-0.5">
              {kpis?.totalActive ?? leads.length} active leads
            </p>
          </div>
          <button
            onClick={() => setAddStage("NEW_INQUIRY")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-[12px] font-semibold hover:bg-slate-700 transition-colors"
          >
            + Add Lead
          </button>
        </div>

        {/* ── KPI BAR ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiChip label="Total Active"    value={kpis?.totalActive    ?? leads.length} />
          <KpiChip label="At Risk (48h+)"  value={kpis?.atRisk         ?? 0} accent={kpis?.atRisk > 0} />
          <KpiChip label="Tours This Week" value={kpis?.toursThisWeek  ?? 0} />
          <KpiChip label="New This Week"   value={kpis?.newThisWeek    ?? 0} />
        </div>

        {/* ── SEARCH + FILTERS ── */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[13px]">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads..."
              className="w-full text-[12px] pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as any)}
            className="text-[12px] px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-400 transition-all"
          >
            <option value="ALL">All Stages</option>
            {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1">
            {(["ALL","HOT","WARM","COLD"] as const).map((s) => (
              <button key={s} onClick={() => setScoreFilter(s)}
                className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  scoreFilter === s ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {s === "ALL" ? "All" : s}
              </button>
            ))}
          </div>
          {(search || stageFilter !== "ALL" || scoreFilter !== "ALL") && (
            <button
              onClick={() => { setSearch(""); setStageFilter("ALL"); setScoreFilter("ALL"); }}
              className="text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
            >
              Clear ✕
            </button>
          )}
          <span className="text-[11px] text-slate-400 ml-auto">
            {filtered.length} lead{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ── KANBAN + DETAIL PANEL ── */}
        <div className="flex gap-4 items-start">
          {/* Kanban scroll area */}
          <div className="flex-1 overflow-x-auto pb-2">
            <div className="flex gap-3 min-w-max">
              {STAGES.map((stage) => (
                <KanbanColumn
                  key={stage.key}
                  stage={stage}
                  leads={byStage[stage.key] ?? []}
                  selectedId={activeLead?.id ?? null}
                  onCardClick={(lead) => setSelectedLead(lead)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(stage.key)}
                  onDragStart={(lead) => setDragging(lead)}
                  onDragEnd={() => setDragging(null)}
                  onAdd={() => setAddStage(stage.key)}
                />
              ))}
            </div>
          </div>

          {/* Detail panel */}
          {activeLead && (
            <DetailPanel
              lead={activeLead}
              onClose={() => { setSelectedLead(null); navigate("/scops/pipeline", { replace: true }); }}
              onNavigate={(id) => navigate(`/scops/pipeline/${id}`)}
            />
          )}
        </div>

      </div>

      {/* ── QUICK ADD SHEET ── */}
      {addStage && (
        <QuickAddSheet
          defaultStage={addStage}
          onClose={() => setAddStage(null)}
          onSuccess={refetchAll}
        />
      )}
    </div>
  );
}
