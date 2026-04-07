import React from "react";

export type PipelineStage =
  | "ALL"
  | "NEW_INQUIRY"
  | "QUALIFIED"
  | "TOUR_SCHEDULED"
  | "TOURED"
  | "OFFER_SUBMITTED"
  | "UNDER_CONTRACT"
  | "CLOSED"
  | "LOST";

const STAGE_LABELS: Record<PipelineStage, string> = {
  ALL: "All Stages",
  NEW_INQUIRY: "New Inquiry",
  QUALIFIED: "Qualified",
  TOUR_SCHEDULED: "Tour Scheduled",
  TOURED: "Toured",
  OFFER_SUBMITTED: "Offer Submitted",
  UNDER_CONTRACT: "Under Contract",
  CLOSED: "Closed",
  LOST: "Lost",
};

const STAGE_COLORS: Record<PipelineStage, string> = {
  ALL: "rgba(255,255,255,0.15)",
  NEW_INQUIRY: "#3b82f6",
  QUALIFIED: "#8b5cf6",
  TOUR_SCHEDULED: "#f59e0b",
  TOURED: "#10b981",
  OFFER_SUBMITTED: "#f97316",
  UNDER_CONTRACT: "#06b6d4",
  CLOSED: "#22c55e",
  LOST: "#ef4444",
};

interface StageFilterBarProps {
  activeStage: PipelineStage;
  onStageChange: (stage: PipelineStage) => void;
  stageCounts?: Partial<Record<PipelineStage, number>>;
  className?: string;
}

export function StageFilterBar({
  activeStage,
  onStageChange,
  stageCounts = {},
  className = "",
}: StageFilterBarProps) {
  const stages: PipelineStage[] = [
    "ALL",
    "NEW_INQUIRY",
    "QUALIFIED",
    "TOUR_SCHEDULED",
    "TOURED",
    "OFFER_SUBMITTED",
    "UNDER_CONTRACT",
  ];

  return (
    <div
      className={`flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide ${className}`}
      style={{ scrollbarWidth: "none" }}
    >
      {stages.map((stage) => {
        const isActive = activeStage === stage;
        const count = stageCounts[stage];
        return (
          <button
            key={stage}
            onClick={() => onStageChange(stage)}
            style={{
              background: isActive
                ? STAGE_COLORS[stage]
                : "rgba(255,255,255,0.06)",
              border: isActive
                ? `1px solid ${STAGE_COLORS[stage]}`
                : "1px solid rgba(255,255,255,0.10)",
              color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
              borderRadius: "20px",
              padding: "5px 14px",
              fontSize: "12px",
              fontWeight: isActive ? 600 : 400,
              whiteSpace: "nowrap",
              cursor: "pointer",
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexShrink: 0,
            }}
          >
            {STAGE_LABELS[stage]}
            {count !== undefined && count > 0 && (
              <span
                style={{
                  background: isActive
                    ? "rgba(255,255,255,0.25)"
                    : "rgba(255,255,255,0.12)",
                  borderRadius: "10px",
                  padding: "1px 6px",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
