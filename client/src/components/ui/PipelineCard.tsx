interface PipelineLead {
  id?: number;
  name: string;
  score?: number | null;
  primaryProperty?: string | null;
  propertyAddress?: string | null;
  lastActivity?: string | null;
  nextAction?: string | null;
  priceRange?: string | null;
  financing?: string | null;
  pipelineStage?: string | null;
  leadScore?: string | null;
}

interface PipelineCardProps {
  lead: PipelineLead;
  selected?: boolean;
  onClick?: () => void;
}

const STAGE_COLORS: Record<string, string> = {
  "new_inquiry": "rgba(59,130,246,0.30)",
  "qualified": "rgba(168,85,247,0.30)",
  "tour_scheduled": "rgba(234,179,8,0.30)",
  "toured": "rgba(249,115,22,0.30)",
  "offer_submitted": "rgba(239,68,68,0.30)",
  "under_contract": "rgba(34,197,94,0.30)",
  "closed": "rgba(34,197,94,0.50)",
  "lost": "rgba(107,114,128,0.30)",
};

const SCORE_COLORS: Record<string, string> = {
  HOT: "#ef4444",
  WARM: "#f97316",
  COLD: "#60a5fa",
};

export function PipelineCard({ lead, selected = false, onClick }: PipelineCardProps) {
  const stageColor = lead.pipelineStage ? (STAGE_COLORS[lead.pipelineStage] ?? "rgba(255,255,255,0.08)") : "rgba(255,255,255,0.08)";
  const scoreColor = lead.leadScore ? (SCORE_COLORS[lead.leadScore] ?? "rgba(255,255,255,0.55)") : "rgba(255,255,255,0.55)";
  const address = lead.primaryProperty ?? lead.propertyAddress ?? "";

  return (
    <div
      className="glass-hover"
      onClick={onClick}
      style={{
        background: selected ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.07)",
        border: selected ? "1px solid rgba(255,255,255,0.30)" : "1px solid rgba(255,255,255,0.10)",
        borderRadius: 12,
        padding: "10px 12px",
        cursor: "pointer",
        transition: "all 200ms ease",
        boxShadow: selected ? "0 4px 20px rgba(0,0,0,0.25)" : "none",
      }}
    >
      {/* Name + score */}
      <div className="flex items-center justify-between gap-2">
        <span style={{ fontWeight: 600, fontSize: 13, color: "rgba(255,255,255,0.92)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {lead.name}
        </span>
        {lead.leadScore && (
          <span style={{ fontSize: 10, fontWeight: 700, color: scoreColor, background: `${scoreColor}22`, padding: "2px 7px", borderRadius: 9999, flexShrink: 0 }}>
            {lead.leadScore}
          </span>
        )}
      </div>

      {/* Address */}
      {address && (
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {address}
        </div>
      )}

      {/* Price + financing */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {lead.priceRange && (
          <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.70)", background: "rgba(255,255,255,0.08)", padding: "2px 7px", borderRadius: 6 }}>
            {lead.priceRange}
          </span>
        )}
        {lead.financing && (
          <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.60)", background: stageColor, padding: "2px 7px", borderRadius: 6 }}>
            {lead.financing}
          </span>
        )}
        {typeof lead.score === "number" && (
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.40)", marginLeft: "auto" }}>
            {lead.score}
          </span>
        )}
      </div>

      {/* Last activity */}
      {lead.lastActivity && (
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.40)", marginTop: 4 }}>
          {lead.lastActivity}
        </div>
      )}

      {/* Next action — highlighted */}
      {lead.nextAction && (
        <div style={{ fontSize: 10, color: "#f87171", marginTop: 3, fontWeight: 600 }}>
          ⚡ {lead.nextAction}
        </div>
      )}
    </div>
  );
}
