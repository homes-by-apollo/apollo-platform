import { type ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: string | ReactNode;
  icon?: ReactNode;
  accent?: string; // CSS color for the accent bar, e.g. "#3b82f6"
  className?: string;
}

export function KpiCard({ label, value, delta, icon, accent, className = "" }: KpiCardProps) {
  return (
    <div className={`glass-card glass-hover flex flex-col gap-2 ${className}`}>
      {/* Top row: label + icon */}
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.55)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {label}
        </span>
        {icon && (
          <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 16 }}>{icon}</span>
        )}
      </div>

      {/* Value + delta */}
      <div className="flex items-end justify-between gap-2">
        <span style={{ fontSize: 26, fontWeight: 700, color: "rgba(255,255,255,0.95)", lineHeight: 1.1 }}>
          {value}
        </span>
        {delta && (
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.60)", marginBottom: 2 }}>
            {delta}
          </span>
        )}
      </div>

      {/* Accent bar */}
      {accent && (
        <div style={{ height: 3, borderRadius: 9999, background: "rgba(255,255,255,0.10)", marginTop: 2 }}>
          <div style={{ height: "100%", width: "60%", borderRadius: 9999, background: accent }} />
        </div>
      )}
    </div>
  );
}
