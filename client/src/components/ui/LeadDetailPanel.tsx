import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

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

const STAGE_COLORS: Record<string, string> = {
  NEW_INQUIRY: "#3b82f6",
  QUALIFIED: "#8b5cf6",
  TOUR_SCHEDULED: "#f59e0b",
  TOURED: "#10b981",
  OFFER_SUBMITTED: "#f97316",
  UNDER_CONTRACT: "#06b6d4",
  CLOSED: "#22c55e",
  LOST: "#ef4444",
};

const ACTIVITY_ICONS: Record<string, string> = {
  NOTE_ADDED: "📝",
  CALL_LOGGED: "📞",
  EMAIL_SENT: "✉️",
  TOUR_SCHEDULED: "🏠",
  STAGE_CHANGE: "🔄",
  FORM_SUBMITTED: "📋",
  SCORE_UPDATED: "⭐",
};

interface LeadDetailPanelProps {
  leadId: number;
  onClose?: () => void;
}

export function LeadDetailPanel({ leadId, onClose }: LeadDetailPanelProps) {
  const [noteText, setNoteText] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.pipeline.detail.useQuery({ id: leadId });

  const addActivity = trpc.pipeline.addActivity.useMutation({
    onSuccess: () => {
      utils.pipeline.detail.invalidate({ id: leadId });
      utils.pipeline.list.invalidate();
      setNoteText("");
      setShowNoteInput(false);
      toast.success("Note added");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const updateStage = trpc.pipeline.updateStage.useMutation({
    onSuccess: () => {
      utils.pipeline.detail.invalidate({ id: leadId });
      utils.pipeline.list.invalidate();
      utils.pipeline.summary.invalidate();
      toast.success("Stage updated");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  if (isLoading) {
    return (
      <div
        style={{
          width: "320px",
          flexShrink: 0,
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: "20px",
          padding: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.4)",
          fontSize: "14px",
        }}
      >
        Loading…
      </div>
    );
  }

  if (!data) return null;

  const { contact, activity, tours, interests } = data;
  const stage = contact.pipelineStage ?? "NEW_INQUIRY";
  const stageColor = STAGE_COLORS[stage] ?? "#3b82f6";
  const fullName = `${contact.firstName} ${contact.lastName}`;
  const budget =
    contact.priceRangeMin && contact.priceRangeMax
      ? `$${Math.round(contact.priceRangeMin / 1000)}K–$${Math.round(contact.priceRangeMax / 1000)}K`
      : contact.priceRangeMax
        ? `Up to $${Math.round(contact.priceRangeMax / 1000)}K`
        : null;

  const primaryInterest = interests.find((i) => i.isPrimaryInterest) ?? interests[0];
  const upcomingTour = tours.find((t) => t.status === "ACTIVE");

  const panelStyle: React.CSSProperties = {
    width: "320px",
    flexShrink: 0,
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "20px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div
        style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: "16px" }}>{fullName}</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "2px" }}>
              {contact.phone ?? contact.email}
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "none",
                borderRadius: "8px",
                color: "rgba(255,255,255,0.5)",
                cursor: "pointer",
                padding: "4px 8px",
                fontSize: "14px",
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Stage badge + score */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span
            style={{
              background: stageColor + "33",
              border: `1px solid ${stageColor}66`,
              color: stageColor,
              borderRadius: "12px",
              padding: "3px 10px",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            {STAGE_LABELS[stage]}
          </span>
          {contact.leadScore && (
            <span
              style={{
                background:
                  contact.leadScore === "HOT"
                    ? "#ef444433"
                    : contact.leadScore === "WARM"
                      ? "#f9731633"
                      : "#6b728033",
                border: `1px solid ${contact.leadScore === "HOT" ? "#ef4444" : contact.leadScore === "WARM" ? "#f97316" : "#6b7280"}66`,
                color:
                  contact.leadScore === "HOT"
                    ? "#ef4444"
                    : contact.leadScore === "WARM"
                      ? "#f97316"
                      : "#9ca3af",
                borderRadius: "12px",
                padding: "3px 10px",
                fontSize: "11px",
                fontWeight: 600,
              }}
            >
              {contact.leadScore}
            </span>
          )}
          {budget && (
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>{budget}</span>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>

        {/* Key details */}
        <div style={{ marginBottom: "16px" }}>
          {contact.financingStatus && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>Financing</span>
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>
                {contact.financingStatus.replace(/_/g, " ")}
              </span>
            </div>
          )}
          {contact.timeline && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>Timeline</span>
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>
                {contact.timeline.replace(/_/g, " ")}
              </span>
            </div>
          )}
          {contact.source && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>Source</span>
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>{contact.source}</span>
            </div>
          )}
          {contact.assignedTo && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>Assigned</span>
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>Rep #{contact.assignedTo}</span>
            </div>
          )}
        </div>

        {/* Primary property interest */}
        {primaryInterest && primaryInterest.address && (
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              overflow: "hidden",
              marginBottom: "16px",
            }}
          >
            {primaryInterest.imageUrl && (
              <img
                src={primaryInterest.imageUrl}
                alt={primaryInterest.address}
                style={{ width: "100%", height: "120px", objectFit: "cover" }}
              />
            )}
            <div style={{ padding: "10px 12px" }}>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: "13px" }}>
                {primaryInterest.address}
              </div>
              {primaryInterest.price && (
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", marginTop: "2px" }}>
                  ${primaryInterest.price.toLocaleString()}
                </div>
              )}
              {primaryInterest.tag && (
                <span
                  style={{
                    display: "inline-block",
                    marginTop: "6px",
                    background:
                      primaryInterest.tag === "Available"
                        ? "#22c55e33"
                        : primaryInterest.tag === "Under Contract"
                          ? "#f59e0b33"
                          : "#ef444433",
                    color:
                      primaryInterest.tag === "Available"
                        ? "#22c55e"
                        : primaryInterest.tag === "Under Contract"
                          ? "#f59e0b"
                          : "#ef4444",
                    borderRadius: "8px",
                    padding: "2px 8px",
                    fontSize: "10px",
                    fontWeight: 600,
                  }}
                >
                  {primaryInterest.tag}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Upcoming tour */}
        {upcomingTour && (
          <div
            style={{
              background: "rgba(59,130,246,0.12)",
              border: "1px solid rgba(59,130,246,0.25)",
              borderRadius: "12px",
              padding: "10px 12px",
              marginBottom: "16px",
            }}
          >
            <div style={{ color: "#93c5fd", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>
              🗓 UPCOMING TOUR
            </div>
            <div style={{ color: "#fff", fontSize: "13px", fontWeight: 600 }}>
              {upcomingTour.eventName ?? "Tour Scheduled"}
            </div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", marginTop: "2px" }}>
              {new Date(upcomingTour.startTime).toLocaleString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>
          </div>
        )}

        {/* Next action */}
        {contact.nextAction && (
          <div
            style={{
              background: "rgba(249,115,22,0.10)",
              border: "1px solid rgba(249,115,22,0.20)",
              borderRadius: "12px",
              padding: "10px 12px",
              marginBottom: "16px",
            }}
          >
            <div style={{ color: "#fb923c", fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>
              ⚡ NEXT ACTION
            </div>
            <div style={{ color: "#fff", fontSize: "13px" }}>{contact.nextAction}</div>
          </div>
        )}

        {/* Stage advance */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Move Stage
          </div>
          <select
            value={stage}
            onChange={(e) =>
              updateStage.mutate({ id: leadId, stage: e.target.value as Parameters<typeof updateStage.mutate>[0]["stage"] })
            }
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "10px",
              color: "#fff",
              padding: "8px 12px",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            {Object.entries(STAGE_LABELS).map(([val, label]) => (
              <option key={val} value={val} style={{ background: "#1e293b" }}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Activity log */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Activity
            </div>
            <button
              onClick={() => setShowNoteInput(!showNoteInput)}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "8px",
                color: "rgba(255,255,255,0.7)",
                cursor: "pointer",
                padding: "3px 10px",
                fontSize: "11px",
              }}
            >
              + Note
            </button>
          </div>

          {showNoteInput && (
            <div style={{ marginBottom: "12px" }}>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note…"
                rows={3}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "10px",
                  color: "#fff",
                  padding: "8px 12px",
                  fontSize: "13px",
                  resize: "none",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                <button
                  onClick={() => {
                    if (noteText.trim()) {
                      addActivity.mutate({
                        contactId: leadId,
                        activityType: "NOTE_ADDED",
                        description: noteText.trim(),
                      });
                    }
                  }}
                  disabled={addActivity.isPending || !noteText.trim()}
                  style={{
                    flex: 1,
                    background: "#3b82f6",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                    cursor: "pointer",
                    padding: "6px",
                    fontSize: "12px",
                    fontWeight: 600,
                    opacity: addActivity.isPending || !noteText.trim() ? 0.5 : 1,
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => { setShowNoteInput(false); setNoteText(""); }}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: "8px",
                    color: "rgba(255,255,255,0.6)",
                    cursor: "pointer",
                    padding: "6px 12px",
                    fontSize: "12px",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {activity.length === 0 && (
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", textAlign: "center", padding: "12px 0" }}>
                No activity yet
              </div>
            )}
            {activity.map((a) => (
              <div
                key={a.id}
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                }}
              >
                <span style={{ fontSize: "14px", flexShrink: 0, marginTop: "1px" }}>
                  {ACTIVITY_ICONS[a.activityType] ?? "📌"}
                </span>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px", lineHeight: "1.4" }}>
                    {a.description}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", marginTop: "2px" }}>
                    {new Date(a.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
