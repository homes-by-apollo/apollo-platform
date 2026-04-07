import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import SCOPSNav from "@/components/SCOPSNav";
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
  HOT:  "rgba(239,68,68,0.15)",
  WARM: "rgba(245,158,11,0.15)",
  COLD: "rgba(99,102,241,0.12)",
};
const SCORE_TEXT: Record<string, string> = {
  HOT:  "#ef4444",
  WARM: "#f59e0b",
  COLD: "#818cf8",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBudget(min: number | null, max: number | null) {
  if (!max && !min) return null;
  const fmt = (n: number) => n >= 1_000_000 ? `$${(n/1_000_000).toFixed(1)}M` : `$${Math.round(n/1000)}k`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (max) return `Up to ${fmt(max)}`;
  return `From ${fmt(min!)}`;
}

function fmtTimeline(t: string | null) {
  const map: Record<string, string> = {
    ASAP: "ASAP",
    "1_3_MONTHS": "1–3 mo",
    "3_6_MONTHS": "3–6 mo",
    "6_12_MONTHS": "6–12 mo",
    JUST_BROWSING: "Browsing",
  };
  return t ? (map[t] ?? t) : null;
}

function fmtFinancing(f: string | null) {
  const map: Record<string, string> = {
    PRE_APPROVED: "Pre-Approved",
    IN_PROCESS: "In Process",
    NOT_STARTED: "Not Started",
    CASH_BUYER: "Cash",
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

function fmtMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1000)}k`;
  return `$${n}`;
}

// ─── Lead Card ────────────────────────────────────────────────────────────────

function LeadCard({
  lead,
  selected,
  onClick,
  onMoveStage,
}: {
  lead: Lead;
  selected: boolean;
  onClick: () => void;
  onMoveStage: (id: number, stage: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const score = lead.leadScore ?? "COLD";
  const budget = fmtBudget(lead.priceRangeMin, lead.priceRangeMax);
  const timeline = fmtTimeline(lead.timeline);
  const financing = fmtFinancing(lead.financingStatus);
  const ago = timeAgo(lead.lastActivityAt);

  const currentIdx = STAGES.findIndex(s => s.key === lead.pipelineStage);
  const nextStage = currentIdx < STAGES.length - 1 ? STAGES[currentIdx + 1] : null;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      style={{
        background: selected
          ? "rgba(255,255,255,0.22)"
          : "rgba(255,255,255,0.10)",
        border: selected
          ? "1px solid rgba(255,255,255,0.50)"
          : lead.isOverdue
          ? "1px solid rgba(239,68,68,0.40)"
          : "1px solid rgba(255,255,255,0.18)",
        borderRadius: 12,
        padding: "12px 14px",
        cursor: "pointer",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: selected
          ? "0 4px 24px rgba(0,0,0,0.18)"
          : "0 2px 8px rgba(0,0,0,0.10)",
        transition: "all 0.15s ease",
        position: "relative",
        marginBottom: 8,
      }}
    >
      {/* Overdue stripe */}
      {lead.isOverdue && (
        <div style={{
          position: "absolute", top: 0, left: 0, width: 3,
          height: "100%", background: "#ef4444",
          borderRadius: "12px 0 0 12px",
        }} />
      )}

      {/* Top row: name + score */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: "rgba(255,255,255,0.95)", letterSpacing: "-0.01em" }}>
          {lead.firstName} {lead.lastName}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
          padding: "2px 7px", borderRadius: 20,
          background: SCORE_COLORS[score],
          color: SCORE_TEXT[score],
          border: `1px solid ${SCORE_TEXT[score]}33`,
        }}>
          {score}
        </span>
      </div>

      {/* Property */}
      {lead.propertyAddress && (
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.60)", marginBottom: 5, display: "flex", alignItems: "center", gap: 4 }}>
          <span>🏠</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {lead.propertyAddress}
          </span>
        </div>
      )}

      {/* Budget / timeline / financing */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
        {budget && (
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: 6 }}>
            {budget}
          </span>
        )}
        {timeline && (
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 6 }}>
            {timeline}
          </span>
        )}
        {financing && (
          <span style={{
            fontSize: 10,
            color: financing === "Pre-Approved" || financing === "Cash" ? "#34d399" : "rgba(255,255,255,0.55)",
            background: financing === "Pre-Approved" || financing === "Cash" ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.06)",
            padding: "2px 6px", borderRadius: 6,
          }}>
            {financing}
          </span>
        )}
      </div>

      {/* Bottom row: last activity + overdue */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, color: lead.isOverdue ? "#fca5a5" : "rgba(255,255,255,0.40)" }}>
          {lead.isOverdue ? "⚠ Overdue" : ago ? `Last: ${ago}` : "No activity"}
        </span>
        {lead.nextAction && (
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            → {lead.nextAction}
          </span>
        )}
      </div>

      {/* Hover quick actions */}
      {showActions && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: "absolute", bottom: -1, left: 0, right: 0,
            background: "rgba(15,20,40,0.92)",
            backdropFilter: "blur(16px)",
            borderRadius: "0 0 12px 12px",
            border: "1px solid rgba(255,255,255,0.15)",
            borderTop: "none",
            display: "flex",
            padding: "8px 10px",
            gap: 6,
            zIndex: 10,
          }}
        >
          <ActionBtn label="Log Activity" onClick={() => toast.info(`Log activity for ${lead.firstName}`)} />
          <ActionBtn label="Schedule Tour" onClick={() => toast.info(`Schedule tour for ${lead.firstName}`)} />
          {nextStage && (
            <ActionBtn
              label={`→ ${nextStage.label}`}
              onClick={() => onMoveStage(lead.id, nextStage.key)}
              accent
            />
          )}
        </div>
      )}
    </div>
  );
}

function ActionBtn({ label, onClick, accent }: { label: string; onClick: () => void; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 10, fontWeight: 600, padding: "4px 8px",
        borderRadius: 6, border: "none", cursor: "pointer",
        background: accent ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.10)",
        color: accent ? "#a5b4fc" : "rgba(255,255,255,0.70)",
        transition: "background 0.1s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const detailQ = trpc.leads.getById.useQuery({ id: lead.id });
  const detail = detailQ.data;

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0,
      width: 420,
      background: "rgba(10,14,30,0.75)",
      backdropFilter: "blur(32px)",
      WebkitBackdropFilter: "blur(32px)",
      borderLeft: "1px solid rgba(255,255,255,0.14)",
      zIndex: 100,
      overflowY: "auto",
      boxShadow: "-8px 0 48px rgba(0,0,0,0.35)",
    }}>
      {/* Header */}
      <div style={{
        padding: "20px 24px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.10)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0,
        background: "rgba(10,14,30,0.85)",
        backdropFilter: "blur(20px)",
        zIndex: 2,
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "white" }}>
            {lead.firstName} {lead.lastName}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
            {STAGES.find(s => s.key === lead.pipelineStage)?.label ?? lead.pipelineStage}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.60)", borderRadius: 8, width: 32, height: 32,
            cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: "20px 24px" }}>
        {/* Contact info */}
        <Section title="Lead Profile">
          <Row label="Email" value={lead.email} />
          <Row label="Phone" value={lead.phone} />
          <Row label="Score" value={lead.leadScore ?? "—"} />
          <Row label="Timeline" value={fmtTimeline(lead.timeline) ?? "—"} />
          <Row label="Financing" value={fmtFinancing(lead.financingStatus) ?? "—"} />
          <Row label="Budget" value={fmtBudget(lead.priceRangeMin, lead.priceRangeMax) ?? "—"} />
          <Row label="Assigned" value={lead.assignedUserName ?? "Unassigned"} />
        </Section>

        {/* Primary property */}
        {lead.propertyAddress && (
          <Section title="Primary Property">
            <Row label="Address" value={lead.propertyAddress} />
            {lead.propertyPrice && <Row label="Price" value={`$${Number(lead.propertyPrice).toLocaleString()}`} />}
          </Section>
        )}

        {/* Activity timeline */}
        <Section title="Activity Timeline">
          {detailQ.isLoading ? (
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>Loading…</div>
          ) : detail?.activity && detail.activity.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {detail.activity.slice(0, 8).map((a: { id: number; activityType: string; description: string; createdAt: Date }) => (
                <div key={a.id} style={{
                  padding: "8px 10px",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.70)", marginBottom: 2 }}>
                    {a.activityType.replace(/_/g, " ")}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.50)" }}>{a.description}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.30)", marginTop: 3 }}>
                    {timeAgo(a.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "rgba(255,255,255,0.30)", fontSize: 12 }}>No activity recorded yet.</div>
          )}
        </Section>

        {/* Next action */}
        {lead.nextAction && (
          <Section title="Next Action">
            <div style={{
              padding: "10px 12px",
              background: "rgba(99,102,241,0.12)",
              border: "1px solid rgba(99,102,241,0.25)",
              borderRadius: 8,
              fontSize: 12,
              color: "rgba(255,255,255,0.80)",
            }}>
              {lead.nextAction}
            </div>
          </Section>
        )}

        {/* Tour date */}
        {lead.tourDate && (
          <Section title="Tour">
            <Row label="Scheduled" value={new Date(lead.tourDate).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} />
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase",
        color: "rgba(255,255,255,0.35)", marginBottom: 10,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.40)", minWidth: 80 }}>{label}</span>
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.80)", textAlign: "right", maxWidth: 240, wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}

// ─── Insights Strip ───────────────────────────────────────────────────────────

function InsightsStrip({ insights }: { insights: { totalPipelineValue: number; conversionRate: number; avgDaysInStage: number; bottleneckStage: string; activeDealCount: number } }) {
  const bottleneck = STAGES.find(s => s.key === insights.bottleneckStage)?.label ?? insights.bottleneckStage;
  return (
    <div style={{
      display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap",
    }}>
      {[
        { label: "Pipeline Value", value: fmtMoney(insights.totalPipelineValue) },
        { label: "Active Leads", value: `${insights.activeDealCount}` },
        { label: "Conversion Rate", value: `${insights.conversionRate}%` },
        { label: "Avg Days in Stage", value: `${insights.avgDaysInStage}d` },
        { label: "Bottleneck", value: bottleneck },
      ].map(item => (
        <div key={item.label} style={{
          flex: "1 1 120px",
          background: "rgba(255,255,255,0.07)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 10,
          padding: "10px 14px",
        }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.40)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
            {item.label}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.90)" }}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SCOPSPipeline() {
  const adminMeQuery = trpc.adminAuth.me.useQuery();
  const adminUser = adminMeQuery.data;
  const kanbanQ = trpc.dashboard.pipelineKanban.useQuery();
  const insightsQ = trpc.dashboard.pipelineInsights.useQuery();
  const updateStage = trpc.leads.updateStage.useMutation({
    onSuccess: () => { kanbanQ.refetch(); toast.success("Stage updated"); },
    onError: (e) => toast.error(e.message),
  });

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("");
  const [filterScore, setFilterScore] = useState("");
  const [showRiskOnly, setShowRiskOnly] = useState(false);

  if (adminMeQuery.isLoading) return null;
  if (!adminUser) { window.location.href = getLoginUrl(); return null; }

  const allLeads: Lead[] = kanbanQ.data ?? [];

  // Filter
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allLeads.filter(l => {
      if (q && !`${l.firstName} ${l.lastName} ${l.email} ${l.phone}`.toLowerCase().includes(q)) return false;
      if (filterStage && l.pipelineStage !== filterStage) return false;
      if (filterScore && l.leadScore !== filterScore) return false;
      if (showRiskOnly && !l.isOverdue) return false;
      return true;
    });
  }, [allLeads, search, filterStage, filterScore, showRiskOnly]);

  // Group by stage, sorted by urgency
  const byStage = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const s of STAGES) map[s.key] = [];
    for (const l of filtered) {
      if (map[l.pipelineStage]) map[l.pipelineStage].push(l);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => b.urgencyScore - a.urgencyScore);
    }
    return map;
  }, [filtered]);

  const handleMoveStage = (id: number, stage: string) => {
    updateStage.mutate({ id, stage: stage as Parameters<typeof updateStage.mutate>[0]["stage"] });
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0d1b3e 0%, #1a2a5e 30%, #0f3460 60%, #1e3a5f 100%)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
    }}>
      <SCOPSNav adminUser={adminUser} currentPage="scheduling" />

      <div style={{ padding: "24px 24px 40px", maxWidth: 1800, margin: "0 auto" }}>

        {/* ── Control Bar ── */}
        <div style={{
          background: "rgba(255,255,255,0.07)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 14,
          padding: "14px 20px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "white", letterSpacing: "-0.02em" }}>Pipeline</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.40)", marginTop: 1 }}>
              Manage active buyers, tours, offers, and follow-ups
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, phone…"
              style={{
                width: "100%", padding: "8px 14px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 8, color: "white", fontSize: 13,
                outline: "none",
              }}
            />
          </div>

          <select
            value={filterStage}
            onChange={e => setFilterStage(e.target.value)}
            style={{
              padding: "8px 12px", background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8,
              color: "rgba(255,255,255,0.80)", fontSize: 12, outline: "none",
            }}
          >
            <option value="">All Stages</option>
            {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>

          <select
            value={filterScore}
            onChange={e => setFilterScore(e.target.value)}
            style={{
              padding: "8px 12px", background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8,
              color: "rgba(255,255,255,0.80)", fontSize: 12, outline: "none",
            }}
          >
            <option value="">All Scores</option>
            <option value="HOT">🔥 Hot</option>
            <option value="WARM">🌤 Warm</option>
            <option value="COLD">❄️ Cold</option>
          </select>

          <button
            onClick={() => setShowRiskOnly(v => !v)}
            style={{
              padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: "1px solid rgba(239,68,68,0.40)",
              background: showRiskOnly ? "rgba(239,68,68,0.20)" : "rgba(255,255,255,0.06)",
              color: showRiskOnly ? "#fca5a5" : "rgba(255,255,255,0.60)",
              cursor: "pointer",
            }}
          >
            ⚠ At Risk Only
          </button>

          <button
            onClick={() => toast.info("Add Lead — coming soon")}
            style={{
              padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: "rgba(99,102,241,0.30)",
              border: "1px solid rgba(99,102,241,0.50)",
              color: "#c7d2fe", cursor: "pointer",
            }}
          >
            + Add Lead
          </button>
        </div>

        {/* ── Insights Strip ── */}
        {insightsQ.data && <InsightsStrip insights={insightsQ.data} />}

        {/* ── Kanban Board ── */}
        {kanbanQ.isLoading ? (
          <div style={{ color: "rgba(255,255,255,0.40)", textAlign: "center", padding: 60, fontSize: 14 }}>
            Loading pipeline…
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(8, minmax(200px, 1fr))",
            gap: 10,
            overflowX: "auto",
            paddingBottom: 16,
          }}>
            {STAGES.map(stage => {
              const leads = byStage[stage.key] ?? [];
              return (
                <div key={stage.key} style={{
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 14,
                  padding: "12px 10px",
                  minHeight: 200,
                  display: "flex",
                  flexDirection: "column",
                }}>
                  {/* Column header */}
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    marginBottom: 12, paddingBottom: 10,
                    borderBottom: `2px solid ${stage.color}33`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: stage.color }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.80)", letterSpacing: "-0.01em" }}>
                        {stage.label}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      background: leads.length > 0 ? `${stage.color}22` : "rgba(255,255,255,0.06)",
                      color: leads.length > 0 ? stage.color : "rgba(255,255,255,0.30)",
                      padding: "1px 7px", borderRadius: 20,
                      border: `1px solid ${leads.length > 0 ? stage.color + "44" : "transparent"}`,
                    }}>
                      {leads.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div style={{ flex: 1, overflowY: "auto" }}>
                    {leads.length === 0 ? (
                      <div style={{
                        fontSize: 11, color: "rgba(255,255,255,0.20)",
                        textAlign: "center", padding: "20px 8px",
                        border: "1px dashed rgba(255,255,255,0.08)",
                        borderRadius: 8,
                      }}>
                        No leads
                      </div>
                    ) : (
                      leads.map(lead => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          selected={selectedLead?.id === lead.id}
                          onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
                          onMoveStage={handleMoveStage}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Detail Panel ── */}
      {selectedLead && (
        <>
          <div
            onClick={() => setSelectedLead(null)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.30)",
              zIndex: 99, backdropFilter: "blur(2px)",
            }}
          />
          <DetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} />
        </>
      )}
    </div>
  );
}
