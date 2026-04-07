import { type ReactNode } from "react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}

export default function GlassPanel({ children, className = "", title, action }: GlassPanelProps) {
  return (
    <div className={`glass-panel ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.90)", margin: 0 }}>
              {title}
            </h3>
          )}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
