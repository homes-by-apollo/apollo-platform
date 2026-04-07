import { useState, useMemo, useRef, useCallback, DragEvent } from "react";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import SCOPSNav from "@/components/SCOPSNav";
import { toast } from "sonner";

// ------------------------------------------------------------
function QuickAddSheet({ onClose, onSuccess, initialStage }: { onClose: () => void; onSuccess: () => void; initialStage?: string }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", priceRangeMax: "", financingStatus: "" as "" | "PRE_APPROVED" | "IN_PROCESS" | "NOT_STARTED" | "CASH_BUYER", source: "" as "" | "WEBSITE" | "ZILLOW" | "MLS" | "REFERRAL" | "AGENT" | "BILLBOARD" | "WALK_IN" | "OTHER", notes: "" });
  const create = trpc.pipeline.quickCreate.useMutation({
    onSuccess: () => { utils.pipeline.list.invalidate(); utils.pipeline.summary.invalidate(); toast.success(`${form.firstName} ${form.lastName} added to pipeline`); onSuccess(); },
    onError: (err) => toast.error(err.message),
  });
  const inputStyle: React.CSSProperties = { width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "#fff", padding: "9px 12px", fontSize: "13px", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { color: "rgba(255,255,255,0.5)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: "4px" };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "linear-gradient(135deg, rgba(30,41,59,0.98), rgba(15,23,42,0.98))", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "24px 24px 0 0", padding: "24px", width: "100%", maxWidth: "480px", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: "18px" }}>Quick Add Lead{initialStage ? <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 8, background: "rgba(255,255,255,0.12)", padding: "2px 8px", borderRadius: 6, color: "rgba(255,255,255,0.7)" }}>{initialStage.replace(/_/g, " ")}</span> : null}</div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "8px", color: "rgba(255,255,255,0.6)", cursor: "pointer", padding: "6px 12px", fontSize: "14px" }}>✕</button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); create.mutate({ firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, priceRangeMax: form.priceRangeMax ? Number(form.priceRangeMax) : undefined, financingStatus: form.financingStatus || undefined, source: form.source || undefined, notes: form.notes || undefined, initialStage: (initialStage as Parameters<typeof create.mutate>[0]["initialStage"]) || undefined }); }} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div><label style={labelStyle}>First Name *</label><input required value={form.firstName} onChange={(e) => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="Ryan" style={inputStyle} /></div>
            <div><label style={labelStyle}>Last Name *</label><input required value={form.lastName} onChange={(e) => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Turner" style={inputStyle} /></div>
          </div>
          <div><label style={labelStyle}>Email *</label><input required type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="ryan@example.com" style={inputStyle} /></div>
          <div><label style={labelStyle}>Phone *</label><input required value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(702) 555-0100" style={inputStyle} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div><label style={labelStyle}>Max Budget</label><input type="number" value={form.priceRangeMax} onChange={(e) => setForm(f => ({ ...f, priceRangeMax: e.target.value }))} placeholder="500000" style={inputStyle} /></div>
            <div><label style={labelStyle}>Financing</label><select value={form.financingStatus} onChange={(e) => setForm(f => ({ ...f, financingStatus: e.target.value as typeof form.financingStatus }))} style={{ ...inputStyle, cursor: "pointer" }}><option value="" style={{ background: "#1e293b" }}>Select…</option><option value="PRE_APPROVED" style={{ background: "#1e293b" }}>Pre-Approved</option><option value="IN_PROCESS" style={{ background: "#1e293b" }}>In Process</option><option value="NOT_STARTED" style={{ background: "#1e293b" }}>Not Started</option><option value="CASH_BUYER" style={{ background: "#1e293b" }}>Cash Buyer</option></select></div>
          </div>
          <div><label style={labelStyle}>Source</label><select value={form.source} onChange={(e) => setForm(f => ({ ...f, source: e.target.value as typeof form.source }))} style={{ ...inputStyle, cursor: "pointer" }}><option value="" style={{ background: "#1e293b" }}>Select source…</option><option value="WEBSITE" style={{ background: "#1e293b" }}>Website</option><option value="ZILLOW" style={{ background: "#1e293b" }}>Zillow</option><option value="MLS" style={{ background: "#1e293b" }}>MLS</option><option value="REFERRAL" style={{ background: "#1e293b" }}>Referral</option><option value="AGENT" style={{ background: "#1e293b" }}>Agent</option><option value="BILLBOARD" style={{ background: "#1e293b" }}>Billboard</option><option value="WALK_IN" style={{ background: "#1e293b" }}>Walk-In</option><option value="OTHER" style={{ background: "#1e293b" }}>Other</option></select></div>
          <div><label style={labelStyle}>Notes</label><textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Initial notes…" rows={3} style={{ ...inputStyle, resize: "none" }} /></div>
          <button type="submit" disabled={create.isPending} style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", border: "none", borderRadius: "12px", color: "#fff", cursor: create.isPending ? "not-allowed" : "pointer", padding: "12px", fontSize: "14px", fontWeight: 700, opacity: create.isPending ? 0.7 : 1 }}>{create.isPending ? "Adding…" : "Add to Pipeline"}</button>
        </form>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
type Lead = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  pipelineStage: string;
  leadScore: string | null;
  timeline: string | null;
  financingStatus: string | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  nextAction: string | null;
  lastContactedAt: Date | null;
  tourDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  assignedTo: number | null;
  primaryPropertyId: number | null;
  propertyAddress: string | null;
  propertyPrice: string | null;
  assignedUserName: string | null;
  isOverdue: boolean;
  urgencyScore: number;
  lastActivityAt: Date | string | null;
};

type Property = {
  id: number;
  address: string;
  city: string;
  state: string;
  tag: string;
  price: string;
  priceValue: number | null;
  beds: number | null;
  baths: number | null;
  sqft: string | null;
  imageUrl: string | null;
  propertyType: string;
};

// ------------------------------------------------------------
const STAGES = [
  { key: "NEW_INQUIRY",      label: "New Inquiry",      color: "#6366f1" },
  { key: "QUALIFIED",        label: "Qualified",        color: "#3b82f6" },
  { key: "TOUR_SCHEDULED",   label: "Tour Scheduled",   color: "#0ea5e9" },
  { key: "TOURED",           label: "Toured",           color: "#14b8a6" },
  { key: "OFFER_SUBMITTED",  label: "Offer Submitted",  color: "#f59e0b" },
  { key: "UNDER_CONTRACT",   label: "Under Contract",   color: "#10b981" },
  { key: "CLOSED",           label: "Closed",           color: "#22c55e" },
  { key: "LOST",             label: "Lost",             color: "#ef4444" },
];

const SCORE_COLORS: Record<string, string> = {
  HOT:  "#ef4444",
  WARM: "#f59e0b",
  COLD: "#818cf8",
};

const TAG_PIN_COLORS: Record<string, string> = {
  "Available":       "#22c55e",
  "Under Contract":  "#f59e0b",
  "Sold":            "#ef4444",
  "Coming Soon":     "#6366f1",
};

const PAHRUMP_CENTER = { lat: 36.2083, lng: -115.9839 };

// ------------------------------------------------------------
function fmtBudget(min: number | null, max: number | null) {
  const fmt = (n: number) => n >= 1000000 ? `$${(n/1000000).toFixed(1)}M` : n >= 1000 ? `$${Math.round(n/1000)}K` : `$${n}`;
  if (!max && !min) return null;
  if (min && max) return `${fmt(min)}–${fmt(max)}`;
  if (max) return `Up to ${fmt(max)}`;
  return `From ${fmt(min!)}`;
}
function fmtTimeline(t: string | null) {
  const map: Record<string, string> = {
    ASAP: "ASAP", "1_3_MONTHS": "1–3 mo", "3_6_MONTHS": "3–6 mo",
    "6_12_MONTHS": "6–12 mo", JUST_BROWSING: "Browsing",
    "3_MONTHS": "3 mo", "6_MONTHS": "6 mo", "12_MONTHS": "12 mo",
  };
  return t ? (map[t] ?? t) : null;
}
function fmtFinancing(f: string | null) {
  const map: Record<string, string> = {
    PRE_APPROVED: "Pre-Approved", IN_PROCESS: "In Process",
    NOT_STARTED: "Not Started", CASH_BUYER: "Cash",
    CASH: "Cash", NEEDS_FINANCING: "Needs financing",
    PRE_QUALIFIED: "Pre-qualified",
  };
  return f ? (map[f] ?? f) : null;
}
function timeAgo(d: Date | string | null) {
  if (!d) return null;
  const ms = Date.now() - new Date(d).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

// ------------------------------------------------------------
function LeadCard({ lead, selected, dimmed, onClick, onDragStart, checked, onCheck }: { lead: Lead; selected: boolean; dimmed?: boolean; onClick: () => void; onDragStart?: (e: DragEvent<HTMLDivElement>, lead: Lead) => void; checked?: boolean; onCheck?: (id: number, checked: boolean) => void }) {
  const budget = fmtBudget(lead.priceRangeMin, lead.priceRangeMax);
  const financing = fmtFinancing(lead.financingStatus);
  const timeline = fmtTimeline(lead.timeline);
  const ago = timeAgo(lead.lastActivityAt);
  const score = lead.leadScore ?? "COLD";
  const stageColor = STAGES.find(s => s.key === lead.pipelineStage)?.color ?? "#6366f1";
  const stageLabel = STAGES.find(s => s.key === lead.pipelineStage)?.label ?? lead.pipelineStage;

  return (
    <div
      onClick={onClick}
      draggable
      onDragStart={(e) => onDragStart?.(e, lead)}
      style={{
        background: checked ? "rgba(99,102,241,0.08)" : selected ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.65)",
        border: checked ? "1.5px solid rgba(99,102,241,0.50)" : selected ? "1.5px solid rgba(255,255,255,0.95)" : lead.isOverdue ? "1px solid rgba(239,68,68,0.35)" : "1px solid rgba(255,255,255,0.80)",
        borderRadius: 14, padding: "12px 14px 12px 34px", cursor: "grab",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        boxShadow: selected ? "0 4px 20px rgba(100,130,200,0.18)" : "0 2px 8px rgba(100,130,200,0.08)",
        transition: "all 0.15s ease", marginBottom: 8, position: "relative",
        opacity: dimmed ? 0.28 : 1,
        pointerEvents: dimmed ? "none" : "auto",
      }}
    >
      {/* Checkbox for bulk select */}
      <div
        onClick={e => { e.stopPropagation(); onCheck?.(lead.id, !checked); }}
        style={{ position: "absolute", top: 12, left: 10, zIndex: 2, width: 16, height: 16, borderRadius: 4, border: checked ? "2px solid #6366f1" : "2px solid rgba(15,32,68,0.20)", background: checked ? "#6366f1" : "rgba(255,255,255,0.80)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.12s", flexShrink: 0 }}
      >
        {checked && <svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.2 5.8L8 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      {lead.isOverdue && (
        <>
          <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: "#ef4444", borderRadius: "14px 0 0 14px" }} />
          <div style={{ position: "absolute", top: 8, right: 8, background: "#ef4444", color: "white", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 6, letterSpacing: "0.05em", zIndex: 1 }}>OVERDUE</div>
        </>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #6366f1, #818cf8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: "white",
        }}>
          {initials(lead.firstName, lead.lastName)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(15,32,68,0.90)", letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {lead.firstName} {lead.lastName}
          </div>
          {lead.propertyAddress && (
            <div style={{ fontSize: 11, color: "rgba(15,32,68,0.50)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {lead.propertyAddress}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
          {/* Numeric urgency score badge */}
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: lead.urgencyScore >= 80 ? "#ef4444" : lead.urgencyScore >= 60 ? "#f59e0b" : "#6366f1",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, color: "white",
          }}>
            {lead.urgencyScore}
          </div>
          {/* HOT/WARM/COLD label */}
          <span style={{
            fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 6,
            background: `${SCORE_COLORS[score]}22`, color: SCORE_COLORS[score],
          }}>
            {score}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
        {budget && <span style={{ fontSize: 10, color: "rgba(15,32,68,0.80)", background: "rgba(15,32,68,0.07)", padding: "2px 7px", borderRadius: 6, fontWeight: 600 }}>{budget}</span>}
        {financing && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 6, fontWeight: 600, color: financing === "Pre-Approved" || financing === "Cash" ? "#059669" : "rgba(15,32,68,0.55)", background: financing === "Pre-Approved" || financing === "Cash" ? "rgba(5,150,105,0.10)" : "rgba(15,32,68,0.06)" }}>{financing}</span>}
        {timeline && <span style={{ fontSize: 10, color: "rgba(15,32,68,0.50)", background: "rgba(15,32,68,0.06)", padding: "2px 7px", borderRadius: 6 }}>{timeline}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: `${stageColor}18`, color: stageColor }}>{stageLabel}</span>
        <span style={{ fontSize: 10, color: lead.isOverdue ? "#dc2626" : "rgba(15,32,68,0.35)" }}>{lead.isOverdue ? "⚠ Overdue" : ago ?? "New"}</span>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
function PropertyDetailPanel({ property, leads, onClose }: { property: Property; leads: Lead[]; onClose: () => void }) {
  const tagColor = TAG_PIN_COLORS[property.tag] ?? "#6366f1";
  const relatedLeads = leads.filter(l => l.primaryPropertyId === property.id || l.propertyAddress === property.address);
  const priceNum = property.priceValue ?? parseInt(property.price.replace(/[^0-9]/g, "")) ?? 0;

  return (
    <div style={{ width: 300, flexShrink: 0, background: "rgba(255,255,255,0.70)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.85)", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 4px 24px rgba(100,130,200,0.12)" }}>
      <div style={{ position: "relative", height: 160, flexShrink: 0 }}>
        <img src={property.imageUrl ?? "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=80"} alt={property.address} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", top: 10, left: 10, background: tagColor, color: "white", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{property.tag}</div>
        <button onClick={onClose} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.40)", border: "none", color: "white", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
      </div>
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "rgba(15,32,68,0.90)", lineHeight: 1.2 }}>{property.address}</div>
            <div style={{ fontSize: 13, color: "rgba(15,32,68,0.50)", marginTop: 2 }}>{property.city}, {property.state}</div>
          </div>
          <div style={{ background: "#f59e0b", color: "white", fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 8, flexShrink: 0 }}>85</div>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "rgba(15,32,68,0.90)", marginBottom: 12 }}>${priceNum.toLocaleString()}</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid rgba(15,32,68,0.08)" }}>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 11, color: "rgba(15,32,68,0.40)" }}>Type</div><div style={{ fontSize: 12, fontWeight: 600, color: "rgba(15,32,68,0.80)" }}>{property.propertyType === "HOME" ? "Home" : "Lot"}</div></div>
          {property.baths && <div style={{ textAlign: "center" }}><div style={{ fontSize: 11, color: "rgba(15,32,68,0.40)" }}>Baths</div><div style={{ fontSize: 12, fontWeight: 600, color: "rgba(15,32,68,0.80)" }}>{property.baths}</div></div>}
          {property.sqft && <div style={{ textAlign: "center" }}><div style={{ fontSize: 11, color: "rgba(15,32,68,0.40)" }}>Sq Ft</div><div style={{ fontSize: 12, fontWeight: 600, color: "rgba(15,32,68,0.80)" }}>{property.sqft}</div></div>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[{ label: "Avg", value: "4" }, { label: "Leads", value: String(relatedLeads.length || 8) }, { label: "Tours", value: "3" }, { label: "Days", value: "12" }].map(m => (
            <div key={m.label} style={{ background: "rgba(15,32,68,0.05)", borderRadius: 8, padding: "8px 4px", textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(15,32,68,0.85)" }}>{m.value}</div>
              <div style={{ fontSize: 10, color: "rgba(15,32,68,0.40)" }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "0 16px 16px", flex: 1, overflowY: "auto" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(15,32,68,0.35)", marginBottom: 10 }}>ACTIVITY</div>
        <div style={{ borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
          <img src={property.imageUrl ?? "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&q=80"} alt="" style={{ width: "100%", height: 90, objectFit: "cover", display: "block" }} />
        </div>
        <button onClick={() => toast.info("View Details — coming soon")} style={{ width: "100%", padding: "10px", borderRadius: 10, background: "rgba(15,32,68,0.06)", border: "1px solid rgba(15,32,68,0.12)", color: "rgba(15,32,68,0.80)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>View Details</button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
function ScheduleTourForm({ lead, onClose, onSuccess }: { lead: Lead; onClose: () => void; onSuccess: () => void }) {
  const utils = trpc.useUtils();
  const now = new Date();
  const defaultDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const defaultDateStr = `${defaultDate.getFullYear()}-${pad(defaultDate.getMonth() + 1)}-${pad(defaultDate.getDate())}`;
  const [dateStr, setDateStr] = useState(defaultDateStr);
  const [timeStr, setTimeStr] = useState("10:00");
  const [location, setLocation] = useState(lead.propertyAddress ?? "");

  const scheduleTour = trpc.scheduling.create.useMutation({
    onSuccess: () => {
      utils.pipeline.detail.invalidate({ id: lead.id });
      utils.pipeline.list.invalidate();
      toast.success(`Tour scheduled for ${lead.firstName} ${lead.lastName}`);
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const startTime = new Date(`${dateStr}T${timeStr}:00`);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour
    scheduleTour.mutate({
      inviteeName: `${lead.firstName} ${lead.lastName}`,
      inviteeEmail: lead.email,
      inviteePhone: lead.phone,
      eventName: "Home Tour",
      startTime,
      endTime,
      location: location || undefined,
      contactId: lead.id,
    });
  };

  return (
    <div style={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(15,32,68,0.12)", borderRadius: 12, padding: "14px", marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(15,32,68,0.80)", marginBottom: 10 }}>Schedule Tour</div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          <div>
            <div style={{ fontSize: 10, color: "rgba(15,32,68,0.45)", marginBottom: 3 }}>Date</div>
            <input type="date" value={dateStr} onChange={e => setDateStr(e.target.value)} required
              style={{ width: "100%", padding: "6px 8px", borderRadius: 8, border: "1px solid rgba(15,32,68,0.15)", fontSize: 11, color: "rgba(15,32,68,0.85)", background: "white", boxSizing: "border-box" }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: "rgba(15,32,68,0.45)", marginBottom: 3 }}>Time</div>
            <input type="time" value={timeStr} onChange={e => setTimeStr(e.target.value)} required
              style={{ width: "100%", padding: "6px 8px", borderRadius: 8, border: "1px solid rgba(15,32,68,0.15)", fontSize: 11, color: "rgba(15,32,68,0.85)", background: "white", boxSizing: "border-box" }} />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "rgba(15,32,68,0.45)", marginBottom: 3 }}>Location (optional)</div>
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Property address…"
            style={{ width: "100%", padding: "6px 8px", borderRadius: 8, border: "1px solid rgba(15,32,68,0.15)", fontSize: 11, color: "rgba(15,32,68,0.85)", background: "white", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: "7px", borderRadius: 8, background: "rgba(15,32,68,0.06)", border: "1px solid rgba(15,32,68,0.12)", color: "rgba(15,32,68,0.60)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button type="submit" disabled={scheduleTour.isPending} style={{ flex: 2, padding: "7px", borderRadius: 8, background: "#2563eb", border: "none", color: "white", fontSize: 11, fontWeight: 700, cursor: scheduleTour.isPending ? "not-allowed" : "pointer", opacity: scheduleTour.isPending ? 0.7 : 1 }}>
            {scheduleTour.isPending ? "Scheduling…" : "Confirm Tour"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ------------------------------------------------------------
function QuickNoteInput({ leadId }: { leadId: number }) {
  const utils = trpc.useUtils();
  const [note, setNote] = useState("");
  const addActivity = trpc.pipeline.addActivity.useMutation({
    onSuccess: () => {
      utils.pipeline.detail.invalidate({ id: leadId });
      setNote("");
      toast.success("Note saved");
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ fontSize: 10, color: "rgba(15,32,68,0.35)", marginBottom: 5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Log a Note</div>
      <div style={{ display: "flex", gap: 6 }}>
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && note.trim()) {
              addActivity.mutate({ contactId: leadId, activityType: "NOTE_ADDED", description: note.trim() });
            }
          }}
          placeholder="Type a note and press Enter…"
          style={{
            flex: 1, padding: "7px 10px", borderRadius: 9,
            border: "1px solid rgba(15,32,68,0.14)",
            background: "rgba(255,255,255,0.70)",
            fontSize: 12, color: "rgba(15,32,68,0.85)",
            outline: "none",
          }}
        />
        <button
          disabled={!note.trim() || addActivity.isPending}
          onClick={() => { if (note.trim()) addActivity.mutate({ contactId: leadId, activityType: "NOTE_ADDED", description: note.trim() }); }}
          style={{
            padding: "7px 12px", borderRadius: 9, border: "none",
            background: note.trim() ? "#2563eb" : "rgba(15,32,68,0.10)",
            color: note.trim() ? "white" : "rgba(15,32,68,0.30)",
            fontSize: 12, fontWeight: 700, cursor: note.trim() ? "pointer" : "default",
            transition: "all 0.12s",
          }}
        >{addActivity.isPending ? "…" : "Save"}</button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
function LeadDetailPanel({ lead, onClose, onMoveStage }: { lead: Lead; onClose: () => void; onMoveStage: (id: number, stage: string) => void }) {
  const utils = trpc.useUtils();
  const detailQ = trpc.pipeline.detail.useQuery({ id: lead.id });
  const detail = detailQ.data;
  const [showTourForm, setShowTourForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: lead.firstName,
    lastName: lead.lastName,
    phone: lead.phone,
    priceRangeMin: lead.priceRangeMin != null ? String(lead.priceRangeMin) : "",
    priceRangeMax: lead.priceRangeMax != null ? String(lead.priceRangeMax) : "",
    financingStatus: (lead.financingStatus ?? "") as "" | "PRE_APPROVED" | "IN_PROCESS" | "NOT_STARTED" | "CASH_BUYER",
  });

  const updateLead = trpc.pipeline.updateLead.useMutation({
    onSuccess: () => {
      utils.pipeline.list.invalidate();
      utils.pipeline.detail.invalidate({ id: lead.id });
      toast.success("Lead updated");
      setEditMode(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const tours = detail?.tours ?? [];
  const activity = detail?.activity ?? [];
  const interests = detail?.interests ?? [];
  const contact = detail?.contact;

  return (
    <div style={{ width: 300, flexShrink: 0, background: "rgba(255,255,255,0.70)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.85)", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 4px 24px rgba(100,130,200,0.12)" }}>
      {/* Header */}
      <div style={{ padding: "16px", borderBottom: "1px solid rgba(15,32,68,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #4a90d9, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "white", flexShrink: 0 }}>
            {initials(lead.firstName, lead.lastName)}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(15,32,68,0.90)" }}>{lead.firstName} {lead.lastName}</div>
            <div style={{ fontSize: 11, color: "rgba(15,32,68,0.45)", marginTop: 1 }}>{STAGES.find(s => s.key === lead.pipelineStage)?.label}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setEditMode(e => !e)} style={{ background: editMode ? "rgba(37,99,235,0.12)" : "rgba(15,32,68,0.06)", border: `1px solid ${editMode ? "rgba(37,99,235,0.30)" : "rgba(15,32,68,0.12)"}`, color: editMode ? "#2563eb" : "rgba(15,32,68,0.50)", borderRadius: 8, padding: "0 10px", height: 30, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>{editMode ? "Cancel" : "Edit"}</button>
          <button onClick={onClose} style={{ background: "rgba(15,32,68,0.06)", border: "1px solid rgba(15,32,68,0.12)", color: "rgba(15,32,68,0.50)", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
      </div>

      <div style={{ padding: "14px 16px", flex: 1, overflowY: "auto" }}>
        {/* Edit Form */}
        {editMode ? (
          <div style={{ background: "rgba(37,99,235,0.05)", border: "1px solid rgba(37,99,235,0.18)", borderRadius: 12, padding: "12px", marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#2563eb", marginBottom: 10 }}>EDIT LEAD</div>
            {([
              { label: "First Name", key: "firstName" as const },
              { label: "Last Name", key: "lastName" as const },
              { label: "Phone", key: "phone" as const },
              { label: "Budget Min ($)", key: "priceRangeMin" as const },
              { label: "Budget Max ($)", key: "priceRangeMax" as const },
            ] as { label: string; key: keyof typeof editForm }[]).map(({ label, key }) => (
              <div key={key} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: "rgba(15,32,68,0.45)", marginBottom: 3 }}>{label}</div>
                <input
                  value={editForm[key] as string}
                  onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{ width: "100%", padding: "6px 8px", borderRadius: 7, border: "1px solid rgba(37,99,235,0.25)", fontSize: 12, background: "rgba(255,255,255,0.80)", color: "rgba(15,32,68,0.85)", boxSizing: "border-box" }}
                />
              </div>
            ))}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: "rgba(15,32,68,0.45)", marginBottom: 3 }}>Financing Status</div>
              <select
                value={editForm.financingStatus}
                onChange={e => setEditForm(f => ({ ...f, financingStatus: e.target.value as typeof f.financingStatus }))}
                style={{ width: "100%", padding: "6px 8px", borderRadius: 7, border: "1px solid rgba(37,99,235,0.25)", fontSize: 12, background: "rgba(255,255,255,0.80)", color: "rgba(15,32,68,0.85)" }}
              >
                <option value="">— Not set —</option>
                <option value="PRE_APPROVED">Pre-Approved</option>
                <option value="IN_PROCESS">In Process</option>
                <option value="NOT_STARTED">Not Started</option>
                <option value="CASH_BUYER">Cash Buyer</option>
              </select>
            </div>
            <button
              disabled={updateLead.isPending}
              onClick={() => updateLead.mutate({
                id: lead.id,
                firstName: editForm.firstName || undefined,
                lastName: editForm.lastName || undefined,
                phone: editForm.phone || undefined,
                priceRangeMin: editForm.priceRangeMin ? Number(editForm.priceRangeMin) : undefined,
                priceRangeMax: editForm.priceRangeMax ? Number(editForm.priceRangeMax) : undefined,
                financingStatus: (editForm.financingStatus || null) as "PRE_APPROVED" | "IN_PROCESS" | "NOT_STARTED" | "CASH_BUYER" | null | undefined,
              })}
              style={{ width: "100%", padding: "8px", borderRadius: 8, background: "linear-gradient(135deg, #2563eb, #1d4ed8)", border: "none", color: "white", fontSize: 12, fontWeight: 700, cursor: updateLead.isPending ? "not-allowed" : "pointer", opacity: updateLead.isPending ? 0.7 : 1 }}
            >
              {updateLead.isPending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        ) : (
          <>
            {/* Contact info */}
            <div style={{ background: "rgba(15,32,68,0.04)", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "rgba(15,32,68,0.55)", marginBottom: 3 }}>{lead.email}</div>
              <div style={{ fontSize: 11, color: "rgba(15,32,68,0.55)" }}>{lead.phone}</div>
            </div>

            {/* Budget + Financing */}
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {fmtBudget(lead.priceRangeMin, lead.priceRangeMax) && (
                <div style={{ flex: 1, background: "rgba(15,32,68,0.04)", borderRadius: 10, padding: "8px 10px" }}>
                  <div style={{ fontSize: 10, color: "rgba(15,32,68,0.40)", marginBottom: 2 }}>Budget</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(15,32,68,0.85)" }}>{fmtBudget(lead.priceRangeMin, lead.priceRangeMax)}</div>
                </div>
              )}
              {fmtFinancing(lead.financingStatus) && (
                <div style={{ flex: 1, background: "rgba(15,32,68,0.04)", borderRadius: 10, padding: "8px 10px" }}>
                  <div style={{ fontSize: 10, color: "rgba(15,32,68,0.40)", marginBottom: 2 }}>Finance</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(15,32,68,0.85)" }}>{fmtFinancing(lead.financingStatus)}</div>
                </div>
              )}
            </div>

        {/* Assigned rep */}
        {lead.assignedUserName && (
          <div style={{ background: "rgba(15,32,68,0.04)", borderRadius: 10, padding: "8px 12px", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg, #4a90d9, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "white", flexShrink: 0 }}>
              {initials(lead.assignedUserName.split(" ")[0] ?? "", lead.assignedUserName.split(" ")[1] ?? "")}
            </div>
            <div>
              <div style={{ fontSize: 10, color: "rgba(15,32,68,0.40)" }}>Assigned</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(15,32,68,0.85)" }}>{lead.assignedUserName}</div>
            </div>
          </div>
        )}

        {/* Next Action */}
        {(contact?.nextAction ?? lead.nextAction) && (
          <div style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.20)", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: "rgba(37,99,235,0.70)", marginBottom: 4, fontWeight: 600, letterSpacing: "0.06em" }}>NEXT ACTION</div>
            <div style={{ fontSize: 12, color: "#1d4ed8" }}>{contact?.nextAction ?? lead.nextAction}</div>
          </div>
        )}

        {/* Schedule Tour Quick Action */}
        <div style={{ marginBottom: 10 }}>
          {showTourForm ? (
            <ScheduleTourForm lead={lead} onClose={() => setShowTourForm(false)} onSuccess={() => setShowTourForm(false)} />
          ) : (
            <button onClick={() => setShowTourForm(true)} style={{ width: "100%", padding: "9px", borderRadius: 10, background: "linear-gradient(135deg, #2563eb, #1d4ed8)", border: "none", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>📅</span> Schedule Tour
            </button>
          )}
        </div>

        {/* Upcoming Tours from pipeline.detail */}
        {tours.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(15,32,68,0.35)", marginBottom: 6 }}>UPCOMING TOURS</div>
            {tours.slice(0, 3).map((t: { id: number; eventName: string | null; startTime: Date; status: string; location: string | null }) => (
              <div key={t.id} style={{ padding: "8px 10px", background: t.status === "ACTIVE" ? "rgba(5,150,105,0.07)" : "rgba(15,32,68,0.04)", borderRadius: 8, border: `1px solid ${t.status === "ACTIVE" ? "rgba(5,150,105,0.20)" : "rgba(15,32,68,0.08)"}`, marginBottom: 5 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: t.status === "ACTIVE" ? "#065f46" : "rgba(15,32,68,0.50)" }}>{t.eventName ?? "Home Tour"}</div>
                <div style={{ fontSize: 11, color: "rgba(15,32,68,0.55)", marginTop: 2 }}>
                  {new Date(t.startTime).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </div>
                {t.location && <div style={{ fontSize: 10, color: "rgba(15,32,68,0.40)", marginTop: 1 }}>{t.location}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Property Interests from pipeline.detail */}
        {interests.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(15,32,68,0.35)", marginBottom: 6 }}>PROPERTY INTERESTS</div>
            {interests.slice(0, 3).map((p: { id: number; address: string | null; price: string | null; imageUrl: string | null; tag: string | null; interestLevel: string | null; isPrimaryInterest: number | boolean | null }) => (
              <div key={p.id} style={{ padding: "8px 10px", background: "rgba(15,32,68,0.04)", borderRadius: 8, border: "1px solid rgba(15,32,68,0.08)", marginBottom: 5, display: "flex", gap: 8, alignItems: "center" }}>
                {p.imageUrl && <img src={p.imageUrl} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(15,32,68,0.80)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.address ?? "Property"}</div>
                  <div style={{ fontSize: 10, color: "rgba(15,32,68,0.45)" }}>{p.price ?? ""} {p.isPrimaryInterest ? "· Primary" : ""}</div>
                </div>
                {p.tag && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 6, background: (TAG_PIN_COLORS[p.tag] ?? "#6366f1") + "18", color: TAG_PIN_COLORS[p.tag] ?? "#6366f1" }}>{p.tag}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Activity Log from pipeline.detail */}
        {activity.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(15,32,68,0.35)", marginBottom: 8 }}>ACTIVITY LOG</div>
            {activity.slice(0, 6).map((a: { id: number; activityType: string; description: string; createdAt: Date }) => (
              <div key={a.id} style={{ padding: "8px 10px", background: "rgba(15,32,68,0.04)", borderRadius: 8, border: "1px solid rgba(15,32,68,0.08)", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(15,32,68,0.70)" }}>{a.activityType.replace(/_/g, " ")}</div>
                  <div style={{ fontSize: 10, color: "rgba(15,32,68,0.30)" }}>{timeAgo(a.createdAt)}</div>
                </div>
                <div style={{ fontSize: 11, color: "rgba(15,32,68,0.50)" }}>{a.description}</div>
              </div>
            ))}
          </div>
        )}

        {/* Move Stage */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "rgba(15,32,68,0.35)", marginBottom: 6, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Move Stage</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {STAGES.filter(s => s.key !== lead.pipelineStage).slice(0, 4).map(s => (
              <button key={s.key} onClick={() => onMoveStage(lead.id, s.key)} style={{ padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: `${s.color}12`, border: `1px solid ${s.color}35`, color: s.color, cursor: "pointer" }}>{s.label}</button>
            ))}
          </div>
        </div>

        {/* Quick Note Input */}
        <QuickNoteInput leadId={lead.id} />
          </>
        )}
      </div>
    </div>
  );
}

// // ------------------------------------------------------------
function EmailBlastSheet({ stage, onClose }: { stage: string; onClose: () => void }) {
  const stageLabel = STAGES.find(s => s.key === stage)?.label ?? stage.replace(/_/g, " ");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const sendBlast = trpc.leads.sendBulkEmail.useMutation({
    onSuccess: (data) => {
      toast.success(`Sent to ${data.sent} lead${data.sent !== 1 ? 's' : ''}${data.failed > 0 ? ` (${data.failed} failed)` : ''}`);
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });
  const inputStyle: React.CSSProperties = { width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 10, color: "#fff", padding: "9px 12px", fontSize: 13, boxSizing: "border-box", outline: "none" };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "linear-gradient(135deg, rgba(30,41,59,0.98), rgba(15,23,42,0.98))", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "24px 24px 0 0", padding: "24px", width: "100%", maxWidth: 520, maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>Email Blast</div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 2 }}>Sending to all <strong style={{ color: "rgba(255,255,255,0.75)" }}>{stageLabel}</strong> leads</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, color: "rgba(255,255,255,0.6)", cursor: "pointer", padding: "6px 12px", fontSize: 14 }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>Subject</div>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. New homes available in Pahrump…" style={inputStyle} />
          </div>
          <div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>Message</div>
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message here…" rows={7} style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <button
            disabled={!subject.trim() || !body.trim() || sendBlast.isPending}
            onClick={() => sendBlast.mutate({ stage, subject: subject.trim(), body: body.trim() })}
            style={{ background: subject.trim() && body.trim() ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "rgba(255,255,255,0.10)", border: "none", borderRadius: 12, color: subject.trim() && body.trim() ? "#fff" : "rgba(255,255,255,0.30)", cursor: subject.trim() && body.trim() ? "pointer" : "default", padding: 14, fontSize: 14, fontWeight: 700, opacity: sendBlast.isPending ? 0.7 : 1 }}
          >{sendBlast.isPending ? "Sending…" : `Send to ${stageLabel} Leads`}</button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
export default function SCOPSPipeline() {
  const adminMeQuery = trpc.adminAuth.me.useQuery();
  const adminUser = adminMeQuery.data;
  // Use new pipeline.list for live data with stage/search filtering
  const [filterStage, setFilterStage] = useState("");
  const [filterScore, setFilterScore] = useState("");
  const [search, setSearch] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddStage, setQuickAddStage] = useState<string | undefined>(undefined);
  const [showBlastSheet, setShowBlastSheet] = useState(false);
  const [blastStage, setBlastStage] = useState<string>("");
  // Collapse/expand state: columns with 10+ leads show top 5 by default
  const [expandedCols, setExpandedCols] = useState<Set<string>>(new Set());
  const COLLAPSE_THRESHOLD = 10;
  const COLLAPSED_SHOW = 5;
  // Kanban: always fetch all stages; client-side filter handles search + score
  const pipelineQ = trpc.pipeline.list.useQuery(
    { search: search || undefined },
    { refetchInterval: 30_000 }
  );
  const summaryQ = trpc.pipeline.summary.useQuery(undefined, { refetchInterval: 60_000 });
  const utils = trpc.useUtils();
  const updateStage = trpc.pipeline.updateStage.useMutation({
    onSuccess: () => { utils.pipeline.list.invalidate(); utils.pipeline.summary.invalidate(); toast.success("Stage updated"); },
    onError: (e) => toast.error(e.message),
  });

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  // Bulk select state
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [bulkTargetStage, setBulkTargetStage] = useState<string>("");
  const bulkMove = trpc.pipeline.bulkMoveStage.useMutation({
    onSuccess: (data) => {
      utils.pipeline.list.invalidate();
      utils.pipeline.summary.invalidate();
      toast.success(`Moved ${data.moved} lead${data.moved !== 1 ? "s" : ""} to ${STAGES.find(s => s.key === bulkTargetStage)?.label ?? bulkTargetStage}`);
      setCheckedIds(new Set());
    },
    onError: (e) => toast.error(e.message),
  });
  const handleCheck = useCallback((id: number, checked: boolean) => {
    setCheckedIds(prev => { const next = new Set(prev); if (checked) next.add(id); else next.delete(id); return next; });
  }, []);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const dragLeadRef = useRef<Lead | null>(null);
  const handleLeadDragStart = useCallback((e: DragEvent<HTMLDivElement>, lead: Lead) => {
    dragLeadRef.current = lead;
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleStageDrop = useCallback((stage: string) => {
    const lead = dragLeadRef.current;
    if (!lead || lead.pipelineStage === stage) { setDragOverStage(null); return; }
    updateStage.mutate({ id: lead.id, stage: stage as Parameters<typeof updateStage.mutate>[0]["stage"] });
    setDragOverStage(null);
    dragLeadRef.current = null;
  }, [updateStage]);

  const allLeads: Lead[] = (pipelineQ.data ?? []) as Lead[];
  const summary = summaryQ.data;

  // Build a set of matching IDs for dimming non-matches
  const matchingIds = useMemo(() => {
    const q = search.toLowerCase();
    const hasQuery = q.length > 0 || filterStage !== "" || filterScore !== "";
    if (!hasQuery) return null; // null = all match
    return new Set(
      allLeads
        .filter(l => {
          if (q && !`${l.firstName} ${l.lastName} ${l.email} ${l.phone} ${l.propertyAddress ?? ""}`.toLowerCase().includes(q)) return false;
          if (filterStage && l.pipelineStage !== filterStage) return false;
          if (filterScore && l.leadScore !== filterScore) return false;
          return true;
        })
        .map(l => l.id)
    );
  }, [allLeads, search, filterStage, filterScore]);

  // filtered is now all leads (for Kanban columns); dimming handled per-card
  const filtered = allLeads;

  if (adminMeQuery.isLoading) return null;
  if (!adminUser) { window.location.href = getLoginUrl(); return null; }

  const rightPanel = selectedLead
    ? <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} onMoveStage={(id, stage) => updateStage.mutate({ id, stage: stage as Parameters<typeof updateStage.mutate>[0]["stage"] })} />
    : null;

  return (
    <div className="scops-bg" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", display: "flex", flexDirection: "column" }}>
      {showQuickAdd && <QuickAddSheet onClose={() => { setShowQuickAdd(false); setQuickAddStage(undefined); }} onSuccess={() => { setShowQuickAdd(false); setQuickAddStage(undefined); }} initialStage={quickAddStage} />}
      <SCOPSNav adminUser={{ name: adminUser.name, adminRole: adminUser.adminRole }} currentPage="scheduling" />

      {/* KPI Summary Bar + Conversion Rate Widget */}
      {summary && (() => {
        // Compute conversion rates between adjacent active stages
        const FUNNEL = [
          { key: "NEW_INQUIRY",     label: "New Inquiry" },
          { key: "QUALIFIED",       label: "Qualified" },
          { key: "TOUR_SCHEDULED",  label: "Tour Sched." },
          { key: "TOURED",          label: "Toured" },
          { key: "OFFER_SUBMITTED", label: "Offer" },
          { key: "UNDER_CONTRACT",  label: "Contract" },
          { key: "CLOSED",          label: "Closed" },
        ];
        const stageMap: Record<string, number> = {};
        (summary.stageCounts as { stage: string; count: number }[]).forEach(s => { stageMap[s.stage] = s.count; });
        const conversions = FUNNEL.slice(0, -1).map((s, i) => {
          const from = stageMap[s.key] ?? 0;
          const to = stageMap[FUNNEL[i + 1].key] ?? 0;
          const rate = from > 0 ? Math.round((to / from) * 100) : 0;
          return { from: s.label, to: FUNNEL[i + 1].label, rate, fromCount: from, toCount: to };
        });
        const maxRate = Math.max(...conversions.map(c => c.rate), 1);
        return (
          <div style={{ background: "rgba(255,255,255,0.45)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.70)" }}>
            {/* Row 1: KPI numbers */}
            <div style={{ padding: "8px 20px", display: "flex", gap: 24, alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.50)" }}>
              {[
                { label: "Total Leads", value: summary.totalActive, color: "#2563eb" },
                { label: "At Risk", value: summary.atRisk, color: "#dc2626" },
                { label: "Tours This Week", value: summary.toursThisWeek, color: "#059669" },
                { label: "New This Week", value: summary.newThisWeek, color: "#d97706" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
                  <div style={{ fontSize: 11, color: "rgba(15,32,68,0.45)", lineHeight: 1.2 }}>{label}</div>
                </div>
              ))}
              <div style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: "rgba(15,32,68,0.30)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Stage Conversion Rates</div>
            </div>
            {/* Row 2: Conversion rate mini bar chart */}
            <div style={{ padding: "8px 20px 10px", display: "flex", gap: 6, alignItems: "flex-end", overflowX: "auto" }}>
              {conversions.map(c => {
                const barH = Math.max(4, Math.round((c.rate / maxRate) * 36));
                const barColor = c.rate >= 60 ? "#10b981" : c.rate >= 35 ? "#f59e0b" : "#ef4444";
                // Map label back to stage key for filtering
                const fromKey = FUNNEL.find(f => f.label === c.from)?.key ?? "";
                const isActive = filterStage === fromKey;
                return (
                  <div
                    key={c.from + c.to}
                    title={`Click to filter: ${c.from} → ${c.to}: ${c.rate}% (${c.toCount}/${c.fromCount})`}
                    onClick={() => setFilterStage(isActive ? "" : fromKey)}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", minWidth: 54, borderRadius: 6, padding: "4px 2px", background: isActive ? `${barColor}18` : "transparent", outline: isActive ? `1.5px solid ${barColor}` : "none", transition: "background 0.15s" }}
                  >
                    {/* Rate label above bar */}
                    <div style={{ fontSize: 10, fontWeight: 700, color: barColor }}>{c.rate}%</div>
                    {/* Bar */}
                    <div style={{ width: 36, height: barH, background: barColor, borderRadius: "3px 3px 0 0", opacity: isActive ? 1 : 0.75, transition: "height 0.3s, opacity 0.15s" }} />
                    {/* Baseline */}
                    <div style={{ width: 36, height: 1, background: "rgba(15,32,68,0.15)" }} />
                    {/* Stage label */}
                    <div style={{ fontSize: 9, color: isActive ? "rgba(15,32,68,0.70)" : "rgba(15,32,68,0.40)", textAlign: "center", lineHeight: 1.2, maxWidth: 52, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: isActive ? 700 : 400 }}>{c.from}</div>
                    <div style={{ fontSize: 8, color: "rgba(15,32,68,0.25)", textAlign: "center" }}>→ {c.to}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Filter Bar */}
      <div style={{ padding: "10px 20px", background: "rgba(255,255,255,0.50)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.75)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <button style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "rgba(255,255,255,0.70)", border: "1px solid rgba(255,255,255,0.85)", color: "rgba(15,32,68,0.75)", cursor: "pointer" }}>≡ Stage</button>
        <div style={{ position: "relative" }}>
          <select value={filterStage} onChange={e => setFilterStage(e.target.value)} style={{ appearance: "none", padding: "6px 28px 6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", background: filterStage ? "rgba(37,99,235,0.12)" : "rgba(255,255,255,0.70)", border: filterStage ? "1px solid rgba(37,99,235,0.35)" : "1px solid rgba(255,255,255,0.85)", color: filterStage ? "#1d4ed8" : "rgba(15,32,68,0.65)", outline: "none" }}>
            <option value="">All Stages</option>
            {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: "rgba(15,32,68,0.40)" }}>▾</span>
        </div>
        <button onClick={() => toast.info("Price filter — coming soon")} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "rgba(255,255,255,0.70)", border: "1px solid rgba(255,255,255,0.85)", color: "rgba(15,32,68,0.60)", cursor: "pointer" }}>Any Price</button>
        <button onClick={() => toast.info("Rep filter — coming soon")} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "rgba(255,255,255,0.70)", border: "1px solid rgba(255,255,255,0.85)", color: "rgba(15,32,68,0.60)", cursor: "pointer" }}>All Reps</button>
        <div style={{ position: "relative" }}>
          <select value={filterScore} onChange={e => setFilterScore(e.target.value)} style={{ appearance: "none", padding: "6px 28px 6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", background: filterScore ? "rgba(217,119,6,0.12)" : "rgba(255,255,255,0.70)", border: filterScore ? "1px solid rgba(217,119,6,0.35)" : "1px solid rgba(255,255,255,0.85)", color: filterScore ? "#b45309" : "rgba(15,32,68,0.65)", outline: "none" }}>
            <option value="">Any Score</option>
            <option value="HOT">🔥 Hot</option>
            <option value="WARM">🌤 Warm</option>
            <option value="COLD">❄️ Cold</option>
          </select>
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: "rgba(15,32,68,0.40)" }}>▾</span>
        </div>
        <button onClick={() => setShowQuickAdd(true)} style={{ marginLeft: "auto", padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: "#0f2044", border: "none", color: "white", cursor: "pointer" }}>+ Add Lead</button>
        <div style={{ minWidth: 200, maxWidth: 300 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads…" style={{ width: "100%", padding: "7px 14px", background: "rgba(255,255,255,0.70)", border: "1px solid rgba(255,255,255,0.85)", borderRadius: 20, color: "rgba(15,32,68,0.85)", fontSize: 12, outline: "none" }} />
        </div>
      </div>

      {/* Kanban + Detail Panel Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        {/* KANBAN COLUMNS */}
        <div style={{ flex: 1, overflowX: "auto", overflowY: "hidden", display: "flex", gap: 0, padding: "16px 16px 0", alignItems: "flex-start" }}>
          {STAGES.map(stage => {
            const colLeads = filtered.filter(l => l.pipelineStage === stage.key);
            const isDragTarget = dragOverStage === stage.key;
            return (
              <div
                key={stage.key}
                onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage.key); }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverStage(null); }}
                onDrop={() => handleStageDrop(stage.key)}
                style={{
                  width: 230, flexShrink: 0, marginRight: 10,
                  background: isDragTarget ? `${stage.color}10` : "rgba(255,255,255,0.40)",
                  backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                  border: isDragTarget ? `2px solid ${stage.color}60` : "1px solid rgba(255,255,255,0.75)",
                  borderRadius: 16, display: "flex", flexDirection: "column",
                  maxHeight: "calc(100vh - 180px)",
                  transition: "border-color 0.15s, background 0.15s",
                  boxShadow: isDragTarget ? `0 0 0 3px ${stage.color}20` : "0 2px 12px rgba(100,130,200,0.08)",
                }}
              >
                {/* Column header */}
                {(() => {
                  const overdueCount = colLeads.filter(l => l.isOverdue).length;
                  return (
                  <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid rgba(255,255,255,0.70)", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(15,32,68,0.85)" }}>{stage.label}</div>
                        {overdueCount > 0 && (
                          <div title={`${overdueCount} overdue lead${overdueCount > 1 ? 's' : ''}`} style={{ background: "#ef4444", color: "white", fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 5, letterSpacing: "0.04em" }}>{overdueCount}</div>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${stage.color}20`, border: `1px solid ${stage.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: stage.color }}>
                          {colLeads.length}
                        </div>
                        {/* Send-to-Stage email blast button */}
                        <button
                          onClick={() => { setBlastStage(stage.key); setShowBlastSheet(true); }}
                          title={`Email all ${stage.label} leads`}
                          style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.70)", border: "1px solid rgba(255,255,255,0.90)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 11, color: "rgba(15,32,68,0.45)", boxShadow: "0 1px 4px rgba(100,130,200,0.10)" }}
                        >✉</button>
                        {/* Per-column Add Lead button */}
                        <button
                          onClick={() => { setQuickAddStage(stage.key); setShowQuickAdd(true); }}
                          title={`Add lead to ${stage.label}`}
                          style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.70)", border: "1px solid rgba(255,255,255,0.90)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "rgba(15,32,68,0.55)", lineHeight: 1, boxShadow: "0 1px 4px rgba(100,130,200,0.12)", transition: "all 0.12s" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${stage.color}18`; (e.currentTarget as HTMLButtonElement).style.color = stage.color; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.70)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(15,32,68,0.55)"; }}
                        >+</button>
                      </div>
                    </div>
                    <div style={{ width: 28, height: 2, background: stage.color, borderRadius: 2, marginTop: 6, opacity: 0.7 }} />
                  </div>
                  );
                })()}
                {/* Cards */}
                {(() => {
                  const isExpanded = expandedCols.has(stage.key);
                  const shouldCollapse = colLeads.length >= COLLAPSE_THRESHOLD && !isExpanded;
                  const visibleLeads = shouldCollapse
                    ? [...colLeads].sort((a, b) => b.urgencyScore - a.urgencyScore).slice(0, COLLAPSED_SHOW)
                    : colLeads;
                  const hiddenCount = colLeads.length - COLLAPSED_SHOW;
                  return (
                    <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px 10px" }}>
                      {pipelineQ.isLoading ? (
                        <div style={{ color: "rgba(15,32,68,0.30)", textAlign: "center", padding: 20, fontSize: 12 }}>Loading…</div>
                      ) : colLeads.length === 0 ? (
                        <div style={{ color: "rgba(15,32,68,0.20)", textAlign: "center", padding: "20px 10px", fontSize: 11, border: "2px dashed rgba(15,32,68,0.10)", borderRadius: 10 }}>
                          Drop here
                        </div>
                      ) : (
                        <>
                          {visibleLeads.map(lead => (
                            <LeadCard key={lead.id} lead={lead} selected={selectedLead?.id === lead.id}
                              dimmed={matchingIds !== null && !matchingIds.has(lead.id)}
                              checked={checkedIds.has(lead.id)}
                              onCheck={handleCheck}
                              onClick={() => { setSelectedLead(selectedLead?.id === lead.id ? null : lead); }}
                              onDragStart={handleLeadDragStart}
                            />
                          ))}
                          {shouldCollapse && hiddenCount > 0 && (
                            <button
                              onClick={() => setExpandedCols(prev => { const next = new Set(prev); next.add(stage.key); return next; })}
                              style={{ width: "100%", padding: "8px", borderRadius: 10, background: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.80)", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "rgba(15,32,68,0.55)", marginTop: 4, transition: "all 0.12s" }}
                            >
                              Show {hiddenCount} more
                            </button>
                          )}
                          {isExpanded && colLeads.length >= COLLAPSE_THRESHOLD && (
                            <button
                              onClick={() => setExpandedCols(prev => { const next = new Set(prev); next.delete(stage.key); return next; })}
                              style={{ width: "100%", padding: "8px", borderRadius: 10, background: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.80)", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "rgba(15,32,68,0.45)", marginTop: 4 }}
                            >
                              Show less
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>

        {/* RIGHT: Detail panel */}
        {rightPanel && (
          <div style={{ width: 320, flexShrink: 0, background: "rgba(255,255,255,0.45)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderLeft: "1px solid rgba(255,255,255,0.75)", overflowY: "auto", padding: "12px" }}>
            {rightPanel}
          </div>
        )}
      </div>

      {/* Email Blast Sheet */}
      {showBlastSheet && blastStage && (
        <EmailBlastSheet stage={blastStage} onClose={() => setShowBlastSheet(false)} />
      )}

      {/* Bulk Stage-Move Action Bar */}
      {checkedIds.size > 0 && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 500, background: "linear-gradient(135deg, rgba(15,23,42,0.97), rgba(30,41,59,0.97))", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 18, padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 8px 40px rgba(0,0,0,0.35)", backdropFilter: "blur(20px)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.90)" }}>
            {checkedIds.size} lead{checkedIds.size !== 1 ? "s" : ""} selected
          </div>
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.15)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Move to</div>
            <div style={{ position: "relative" }}>
              <select
                value={bulkTargetStage}
                onChange={e => setBulkTargetStage(e.target.value)}
                style={{ appearance: "none", background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.20)", borderRadius: 10, color: bulkTargetStage ? "#fff" : "rgba(255,255,255,0.45)", padding: "7px 28px 7px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", outline: "none" }}
              >
                <option value="" style={{ background: "#1e293b" }}>Select stage…</option>
                {STAGES.map(s => <option key={s.key} value={s.key} style={{ background: "#1e293b" }}>{s.label}</option>)}
              </select>
              <span style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: "rgba(255,255,255,0.40)" }}>▾</span>
            </div>
            <button
              disabled={!bulkTargetStage || bulkMove.isPending}
              onClick={() => {
                if (!bulkTargetStage) return;
                bulkMove.mutate({ ids: Array.from(checkedIds), stage: bulkTargetStage as Parameters<typeof bulkMove.mutate>[0]["stage"] });
              }}
              style={{ padding: "7px 18px", borderRadius: 10, fontSize: 12, fontWeight: 700, background: bulkTargetStage ? "#6366f1" : "rgba(255,255,255,0.10)", border: "none", color: bulkTargetStage ? "#fff" : "rgba(255,255,255,0.30)", cursor: bulkTargetStage ? "pointer" : "not-allowed", transition: "all 0.15s" }}
            >
              {bulkMove.isPending ? "Moving…" : "Apply"}
            </button>
          </div>
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.15)" }} />
          <button
            onClick={() => setCheckedIds(new Set())}
            style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, color: "rgba(255,255,255,0.50)", cursor: "pointer", padding: "6px 10px", fontSize: 12 }}
          >✕ Clear</button>
        </div>
      )}
    </div>
  );
}
