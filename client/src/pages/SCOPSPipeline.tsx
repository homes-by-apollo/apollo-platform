import { useState, useMemo, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import SCOPSNav from "@/components/SCOPSNav";
import { MapView } from "@/components/Map";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Constants ────────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Lead Card ────────────────────────────────────────────────────────────────
function LeadCard({ lead, selected, onClick }: {
  lead: Lead; selected: boolean; onClick: () => void;
}) {
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
      style={{
        background: selected ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.10)",
        border: selected ? "1.5px solid rgba(255,255,255,0.50)" : lead.isOverdue ? "1px solid rgba(239,68,68,0.35)" : "1px solid rgba(255,255,255,0.14)",
        borderRadius: 14, padding: "12px 14px", cursor: "pointer",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        boxShadow: selected ? "0 4px 20px rgba(0,0,0,0.20)" : "0 2px 8px rgba(0,0,0,0.10)",
        transition: "all 0.15s ease", marginBottom: 8, position: "relative",
      }}
    >
      {lead.isOverdue && (
        <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: "#ef4444", borderRadius: "14px 0 0 14px" }} />
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
          <div style={{ fontWeight: 600, fontSize: 13, color: "white", letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {lead.firstName} {lead.lastName}
          </div>
          {lead.propertyAddress && (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.50)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {lead.propertyAddress}
            </div>
          )}
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, flexShrink: 0,
          background: `${SCORE_COLORS[score]}22`, color: SCORE_COLORS[score],
          border: `1px solid ${SCORE_COLORS[score]}44`,
        }}>
          {score}
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
        {budget && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.80)", background: "rgba(255,255,255,0.10)", padding: "2px 7px", borderRadius: 6, fontWeight: 600 }}>{budget}</span>}
        {financing && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 6, fontWeight: 600, color: financing === "Pre-Approved" || financing === "Cash" ? "#34d399" : "rgba(255,255,255,0.55)", background: financing === "Pre-Approved" || financing === "Cash" ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.07)" }}>{financing}</span>}
        {timeline && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.07)", padding: "2px 7px", borderRadius: 6 }}>{timeline}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: `${stageColor}22`, color: stageColor }}>{stageLabel}</span>
        <span style={{ fontSize: 10, color: lead.isOverdue ? "#fca5a5" : "rgba(255,255,255,0.35)" }}>{lead.isOverdue ? "⚠ Overdue" : ago ?? "New"}</span>
      </div>
    </div>
  );
}

// ─── Property Detail Panel ────────────────────────────────────────────────────
function PropertyDetailPanel({ property, leads, onClose }: { property: Property; leads: Lead[]; onClose: () => void }) {
  const tagColor = TAG_PIN_COLORS[property.tag] ?? "#6366f1";
  const relatedLeads = leads.filter(l => l.primaryPropertyId === property.id || l.propertyAddress === property.address);
  const priceNum = property.priceValue ?? parseInt(property.price.replace(/[^0-9]/g, "")) ?? 0;

  return (
    <div style={{ width: 300, flexShrink: 0, background: "rgba(255,255,255,0.10)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative", height: 160, flexShrink: 0 }}>
        <img src={property.imageUrl ?? "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=80"} alt={property.address} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", top: 10, left: 10, background: tagColor, color: "white", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{property.tag}</div>
        <button onClick={onClose} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.50)", border: "none", color: "white", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
      </div>
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "white", lineHeight: 1.2 }}>{property.address}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.50)", marginTop: 2 }}>{property.city}, {property.state}</div>
          </div>
          <div style={{ background: "#f59e0b", color: "white", fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 8, flexShrink: 0 }}>85</div>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "white", marginBottom: 12 }}>${priceNum.toLocaleString()}</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 11, color: "rgba(255,255,255,0.40)" }}>Type</div><div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.80)" }}>{property.propertyType === "HOME" ? "Home" : "Lot"}</div></div>
          {property.baths && <div style={{ textAlign: "center" }}><div style={{ fontSize: 11, color: "rgba(255,255,255,0.40)" }}>Baths</div><div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.80)" }}>{property.baths}</div></div>}
          {property.sqft && <div style={{ textAlign: "center" }}><div style={{ fontSize: 11, color: "rgba(255,255,255,0.40)" }}>Sq Ft</div><div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.80)" }}>{property.sqft}</div></div>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[{ label: "Avg", value: "4" }, { label: "Leads", value: String(relatedLeads.length || 8) }, { label: "Tours", value: "3" }, { label: "Days", value: "12" }].map(m => (
            <div key={m.label} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "8px 4px", textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "white" }}>{m.value}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.40)" }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "0 16px 16px", flex: 1, overflowY: "auto" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 10 }}>ACTIVITY</div>
        <div style={{ borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
          <img src={property.imageUrl ?? "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&q=80"} alt="" style={{ width: "100%", height: 90, objectFit: "cover", display: "block" }} />
        </div>
        <button onClick={() => toast.info("View Details — coming soon")} style={{ width: "100%", padding: "10px", borderRadius: 10, background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.18)", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>View Details</button>
      </div>
    </div>
  );
}

// ─── Lead Detail Panel ────────────────────────────────────────────────────────
function LeadDetailPanel({ lead, onClose, onMoveStage }: { lead: Lead; onClose: () => void; onMoveStage: (id: number, stage: string) => void }) {
  const detailQ = trpc.leads.getById.useQuery({ id: lead.id });
  const detail = detailQ.data;

  return (
    <div style={{ width: 300, flexShrink: 0, background: "rgba(255,255,255,0.10)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.10)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "white" }}>{lead.firstName} {lead.lastName}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{STAGES.find(s => s.key === lead.pipelineStage)?.label}</div>
        </div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.60)", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
      </div>
      <div style={{ padding: "14px 16px", flex: 1, overflowY: "auto" }}>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>{lead.email}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{lead.phone}</div>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {fmtBudget(lead.priceRangeMin, lead.priceRangeMax) && (
            <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "8px 10px" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.40)", marginBottom: 2 }}>Budget</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "white" }}>{fmtBudget(lead.priceRangeMin, lead.priceRangeMax)}</div>
            </div>
          )}
          {fmtFinancing(lead.financingStatus) && (
            <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "8px 10px" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.40)", marginBottom: 2 }}>Finance</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "white" }}>{fmtFinancing(lead.financingStatus)}</div>
            </div>
          )}
        </div>
        {lead.assignedUserName && (
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "8px 12px", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #818cf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "white", flexShrink: 0 }}>
              {initials(lead.assignedUserName.split(" ")[0] ?? "", lead.assignedUserName.split(" ")[1] ?? "")}
            </div>
            <div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.40)" }}>Assigned</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "white" }}>{lead.assignedUserName}</div>
            </div>
          </div>
        )}
        {lead.nextAction && (
          <div style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: "rgba(99,102,241,0.70)", marginBottom: 4, fontWeight: 600, letterSpacing: "0.06em" }}>NEXT ACTION</div>
            <div style={{ fontSize: 12, color: "#a5b4fc" }}>{lead.nextAction}</div>
          </div>
        )}
        {lead.tourDate && (
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.40)", marginBottom: 4 }}>Upcoming Tour</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "white" }}>
              {new Date(lead.tourDate).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </div>
          </div>
        )}
        {detail?.activity && detail.activity.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>ACTIVITY</div>
            {detail.activity.slice(0, 4).map((a: { id: number; activityType: string; description: string; createdAt: Date }) => (
              <div key={a.id} style={{ padding: "8px 10px", background: "rgba(255,255,255,0.05)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.70)", marginBottom: 2 }}>{a.activityType.replace(/_/g, " ")}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.50)" }}>{a.description}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.30)", marginTop: 3 }}>{timeAgo(a.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
        <div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 6, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Move Stage</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {STAGES.filter(s => s.key !== lead.pipelineStage).slice(0, 4).map(s => (
              <button key={s.key} onClick={() => onMoveStage(lead.id, s.key)} style={{ padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: `${s.color}15`, border: `1px solid ${s.color}30`, color: s.color, cursor: "pointer" }}>{s.label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SCOPSPipeline() {
  const adminMeQuery = trpc.adminAuth.me.useQuery();
  const adminUser = adminMeQuery.data;
  const kanbanQ = trpc.dashboard.pipelineKanban.useQuery();
  const propertiesQ = trpc.properties.getAll.useQuery();
  const updateStage = trpc.leads.updateStage.useMutation({
    onSuccess: () => { kanbanQ.refetch(); toast.success("Stage updated"); },
    onError: (e) => toast.error(e.message),
  });

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("");
  const [filterScore, setFilterScore] = useState("");
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  const allLeads: Lead[] = kanbanQ.data ?? [];
  const allProperties: Property[] = (propertiesQ.data ?? []) as Property[];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allLeads.filter(l => {
      if (q && !`${l.firstName} ${l.lastName} ${l.email} ${l.phone} ${l.propertyAddress ?? ""}`.toLowerCase().includes(q)) return false;
      if (filterStage && l.pipelineStage !== filterStage) return false;
      if (filterScore && l.leadScore !== filterScore) return false;
      return true;
    });
  }, [allLeads, search, filterStage, filterScore]);

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    markersRef.current.forEach(m => { m.map = null; });
    markersRef.current = [];
    const geocoder = new google.maps.Geocoder();
    allProperties.forEach(prop => {
      const fullAddress = `${prop.address}, ${prop.city}, ${prop.state}`;
      geocoder.geocode({ address: fullAddress }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          const pinColor = TAG_PIN_COLORS[prop.tag] ?? "#6366f1";
          const pinEl = document.createElement("div");
          pinEl.style.cssText = `width:24px;height:24px;border-radius:50% 50% 50% 0;background:${pinColor};border:2px solid white;transform:rotate(-45deg);cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3);`;
          const marker = new google.maps.marker.AdvancedMarkerElement({ map, position: results[0].geometry.location, content: pinEl, title: prop.address });
          marker.addListener("click", () => { setSelectedProperty(prop); setSelectedLead(null); });
          markersRef.current.push(marker);
        }
      });
    });
  }, [allProperties]);

  if (adminMeQuery.isLoading) return null;
  if (!adminUser) { window.location.href = getLoginUrl(); return null; }

  const rightPanel = selectedProperty
    ? <PropertyDetailPanel property={selectedProperty} leads={allLeads} onClose={() => setSelectedProperty(null)} />
    : selectedLead
    ? <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} onMoveStage={(id, stage) => updateStage.mutate({ id, stage: stage as Parameters<typeof updateStage.mutate>[0]["stage"] })} />
    : null;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #c8d4f0 0%, #b8c8e8 30%, #a8b8e0 60%, #c0cce8 100%)", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", display: "flex", flexDirection: "column" }}>
      <SCOPSNav adminUser={adminUser} currentPage="scheduling" />

      {/* Filter Bar */}
      <div style={{ padding: "10px 20px", background: "rgba(255,255,255,0.55)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.40)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <button style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "rgba(255,255,255,0.80)", border: "1px solid rgba(0,0,0,0.12)", color: "#374151", cursor: "pointer" }}>≡ Listings</button>
        <div style={{ position: "relative" }}>
          <select value={filterStage} onChange={e => setFilterStage(e.target.value)} style={{ appearance: "none", padding: "6px 28px 6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", background: filterStage ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.70)", border: filterStage ? "1px solid rgba(99,102,241,0.40)" : "1px solid rgba(0,0,0,0.12)", color: filterStage ? "#4f46e5" : "#374151", outline: "none" }}>
            <option value="">Any Status</option>
            {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: "#374151" }}>▾</span>
        </div>
        <button onClick={() => toast.info("Price filter — coming soon")} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "rgba(255,255,255,0.70)", border: "1px solid rgba(0,0,0,0.12)", color: "#374151", cursor: "pointer" }}>Any Price</button>
        <button onClick={() => toast.info("View filter — coming soon")} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "rgba(255,255,255,0.70)", border: "1px solid rgba(0,0,0,0.12)", color: "#374151", cursor: "pointer" }}>Any View</button>
        <button onClick={() => toast.info("More filters — coming soon")} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "rgba(255,255,255,0.70)", border: "1px solid rgba(0,0,0,0.12)", color: "#374151", cursor: "pointer" }}>Filter filters</button>
        <div style={{ position: "relative" }}>
          <select value={filterScore} onChange={e => setFilterScore(e.target.value)} style={{ appearance: "none", padding: "6px 28px 6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", background: filterScore ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.70)", border: filterScore ? "1px solid rgba(245,158,11,0.40)" : "1px solid rgba(0,0,0,0.12)", color: filterScore ? "#d97706" : "#374151", outline: "none" }}>
            <option value="">Any Score</option>
            <option value="HOT">🔥 Hot</option>
            <option value="WARM">🌤 Warm</option>
            <option value="COLD">❄️ Cold</option>
          </select>
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: "#374151" }}>▾</span>
        </div>
        <div style={{ flex: 1, minWidth: 200, maxWidth: 340, marginLeft: "auto" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search address, city, or zip code" style={{ width: "100%", padding: "7px 14px", background: "rgba(255,255,255,0.80)", border: "1px solid rgba(0,0,0,0.12)", borderRadius: 20, color: "#1a1a2e", fontSize: 12, outline: "none" }} />
        </div>
      </div>

      {/* 3-Panel Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        {/* LEFT: Lead list */}
        <div style={{ width: 300, flexShrink: 0, background: "rgba(255,255,255,0.40)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRight: "1px solid rgba(255,255,255,0.40)", overflowY: "auto", padding: "12px" }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e" }}>
                {filterStage ? (STAGES.find(s => s.key === filterStage)?.label ?? "All Leads") : "All Leads"}
              </div>
              <button onClick={() => toast.info("Add Lead — coming soon")} style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.30)", color: "#4f46e5", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
            </div>
            <div style={{ fontSize: 11, color: "rgba(0,0,0,0.40)" }}>{filtered.length} lead{filtered.length !== 1 ? "s" : ""} · {filtered.filter(l => l.tourDate).length} tours</div>
          </div>
          <div style={{ display: "flex", gap: 5, marginBottom: 12, overflowX: "auto", paddingBottom: 2 }}>
            {STAGES.slice(0, 5).map(s => {
              const count = allLeads.filter(l => l.pipelineStage === s.key).length;
              return (
                <button key={s.key} onClick={() => setFilterStage(filterStage === s.key ? "" : s.key)} style={{ flexShrink: 0, padding: "3px 8px", borderRadius: 8, background: filterStage === s.key ? `${s.color}22` : "rgba(255,255,255,0.60)", border: filterStage === s.key ? `1px solid ${s.color}55` : "1px solid rgba(0,0,0,0.08)", fontSize: 10, fontWeight: 600, cursor: "pointer", color: filterStage === s.key ? s.color : "rgba(0,0,0,0.50)", display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, display: "inline-block" }} />{count}
                </button>
              );
            })}
          </div>
          {kanbanQ.isLoading ? (
            <div style={{ color: "rgba(0,0,0,0.35)", textAlign: "center", padding: 40, fontSize: 13 }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ color: "rgba(0,0,0,0.30)", textAlign: "center", padding: 40, fontSize: 13 }}>No leads found</div>
          ) : (
            filtered.map(lead => (
              <LeadCard key={lead.id} lead={lead} selected={selectedLead?.id === lead.id} onClick={() => { setSelectedLead(selectedLead?.id === lead.id ? null : lead); setSelectedProperty(null); }} />
            ))
          )}
        </div>

        {/* CENTER: Map */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <MapView initialCenter={PAHRUMP_CENTER} initialZoom={12} onMapReady={handleMapReady} className="w-full h-full" />
          <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", borderRadius: 20, padding: "8px 16px", display: "flex", gap: 16, alignItems: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.15)", fontSize: 12, fontWeight: 600 }}>
            {[{ color: "#22c55e", label: "Available" }, { color: "#f59e0b", label: "Under Contract" }, { color: "#ef4444", label: "Sold" }].map(({ color, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                <span style={{ color: "#374151" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Detail panel */}
        {rightPanel ? (
          <div style={{ padding: "12px", background: "rgba(255,255,255,0.35)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderLeft: "1px solid rgba(255,255,255,0.40)", overflowY: "auto" }}>
            {rightPanel}
          </div>
        ) : (
          <div style={{ width: 300, flexShrink: 0, background: "rgba(255,255,255,0.25)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderLeft: "1px solid rgba(255,255,255,0.40)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center", color: "rgba(0,0,0,0.30)", fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏠</div>
              <div>Click a pin or lead<br />to see details</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
