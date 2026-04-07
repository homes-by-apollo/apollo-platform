import { useState } from "react";
import { trpc } from "@/lib/trpc";
import SCOPSNav from "@/components/SCOPSNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const CARD_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(20px) saturate(160%)",
  WebkitBackdropFilter: "blur(20px) saturate(160%)",
  border: "1px solid rgba(255,255,255,0.85)",
  boxShadow: "0 4px 24px rgba(100,130,200,0.10)",
  borderRadius: 16,
  padding: "24px",
};

export default function SCOPSSettings() {
  const { data: adminUser } = trpc.adminAuth.me.useQuery();
  const { data: thresholdData, isLoading } = trpc.settings.getStaleThreshold.useQuery();
  const { data: alertData, isLoading: alertLoading } = trpc.settings.getStaleAlertEnabled.useQuery();
  const { data: myAlertPref, isLoading: myAlertLoading } = trpc.settings.getMyAlertPref.useQuery();
  const [inputHours, setInputHours] = useState<string>("");
  const [saved, setSaved] = useState(false);

  const utils = trpc.useUtils();

  const setThreshold = trpc.settings.setStaleThreshold.useMutation({
    onSuccess: (data) => {
      utils.settings.getStaleThreshold.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      toast.success(`Stale lead threshold updated to ${data.hours} hours`);
    },
    onError: (err) => {
      toast.error(`Failed to update: ${err.message}`);
    },
  });

  const setAlertEnabled = trpc.settings.setStaleAlertEnabled.useMutation({
    onSuccess: (data) => {
      utils.settings.getStaleAlertEnabled.invalidate();
      toast.success(data.enabled ? "Email alerts enabled" : "Email alerts disabled");
    },
    onError: (err) => {
      toast.error(`Failed to update: ${err.message}`);
    },
  });

  const setMyAlertPref = trpc.settings.setMyAlertPref.useMutation({
    onSuccess: (data) => {
      utils.settings.getMyAlertPref.invalidate();
      toast.success(data.receiveStaleAlerts ? "You will receive stale-lead alerts" : "You will no longer receive stale-lead alerts");
    },
    onError: (err) => {
      toast.error(`Failed to update: ${err.message}`);
    },
  });

  const currentHours = thresholdData?.hours ?? 48;
  const alertEnabled = alertData?.enabled ?? true;
  const myReceive = myAlertPref?.receiveStaleAlerts ?? true;

  function handleSave() {
    const h = parseInt(inputHours, 10);
    if (isNaN(h) || h < 1 || h > 720) {
      toast.error("Please enter a value between 1 and 720 hours");
      return;
    }
    setThreshold.mutate({ hours: h });
  }

  if (!adminUser) return null;

  return (
    <div className="scops-bg min-h-screen" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <SCOPSNav adminUser={adminUser} currentPage="settings" />

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-4">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="crm-page-title">SCOPS Settings</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>Configure operational parameters for the Apollo CRM.</p>
        </div>

        {/* ── Stale Lead Threshold Card ── */}
        <div style={CARD_STYLE}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-[#0f2044]">Stale Lead Threshold</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                How many hours after a lead's <strong>Next Action Due</strong> date passes before it is flagged as overdue.
              </p>
            </div>
            <span
              className="ml-4 flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: "rgba(15,32,68,0.08)", color: "#0f2044" }}
            >
              Cron: every 15 min
            </span>
          </div>

          {/* Current value display */}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
            style={{ background: "rgba(15,32,68,0.05)", border: "1px solid rgba(15,32,68,0.08)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f2044" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 opacity-60">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <div>
              <span className="text-sm text-gray-500">Current threshold: </span>
              {isLoading ? (
                <span className="text-sm text-gray-400">Loading…</span>
              ) : (
                <span className="text-sm font-bold text-[#0f2044]">
                  {currentHours} hour{currentHours !== 1 ? "s" : ""}
                  {currentHours === 48 ? " (default)" : ""}
                </span>
              )}
            </div>
          </div>

          {/* Input + Save */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Input
                type="number"
                min={1}
                max={720}
                placeholder={String(currentHours)}
                value={inputHours}
                onChange={(e) => setInputHours(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                className="pr-14 text-sm"
                style={{ background: "rgba(255,255,255,0.85)" }}
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium pointer-events-none"
                style={{ color: "rgba(15,32,68,0.40)" }}
              >
                hours
              </span>
            </div>
            <Button
              onClick={handleSave}
              disabled={setThreshold.isPending || !inputHours}
              style={{
                background: saved ? "#16a34a" : "#0f2044",
                color: "#fff",
                transition: "background 0.3s",
              }}
            >
              {setThreshold.isPending ? "Saving…" : saved ? "Saved ✓" : "Save"}
            </Button>
          </div>

          <p className="text-xs text-gray-400 mt-3">
            Allowed range: 1–720 hours (1 hour to 30 days). Leads in <em>Closed</em> or <em>Lost</em> stages are never flagged.
          </p>
        </div>

        {/* ── Email Notification Toggle Card ── */}
        <div style={CARD_STYLE}>
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-6">
              <h2 className="text-base font-semibold text-[#0f2044]">Stale Lead Email Alerts</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                When enabled, the assigned rep (or all admins if unassigned) receives a Resend email alert each time a lead is flagged as overdue.
              </p>
            </div>
            {/* Toggle switch */}
            <button
              type="button"
              disabled={alertLoading || setAlertEnabled.isPending}
              onClick={() => setAlertEnabled.mutate({ enabled: !alertEnabled })}
              aria-checked={alertEnabled}
              role="switch"
              style={{
                flexShrink: 0,
                width: 52,
                height: 28,
                borderRadius: 14,
                border: "none",
                cursor: alertLoading || setAlertEnabled.isPending ? "not-allowed" : "pointer",
                background: alertEnabled ? "#16a34a" : "#d1d5db",
                position: "relative",
                transition: "background 0.2s",
                outline: "none",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  left: alertEnabled ? 27 : 3,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "white",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                  transition: "left 0.2s",
                }}
              />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: alertEnabled ? "rgba(22,163,74,0.10)" : "rgba(107,114,128,0.10)",
                color: alertEnabled ? "#16a34a" : "#6b7280",
              }}
            >
              {alertLoading ? "Loading…" : alertEnabled ? "Alerts ON" : "Alerts OFF"}
            </span>
            {setAlertEnabled.isPending && (
              <span className="text-xs text-gray-400">Saving…</span>
            )}
          </div>
        </div>

        {/* ── My Alert Preferences Card ── */}
        <div style={CARD_STYLE}>
          <div className="flex items-center justify-between">
            <div className="flex-1 pr-6">
              <h2 className="text-base font-semibold text-[#0f2044]">My Alert Preferences</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Control whether <strong>you</strong> personally receive stale-lead email alerts. This setting is per-rep and independent of the system-wide toggle above.
              </p>
            </div>
            {/* Per-rep toggle */}
            <button
              type="button"
              disabled={myAlertLoading || setMyAlertPref.isPending}
              onClick={() => setMyAlertPref.mutate({ receiveStaleAlerts: !myReceive })}
              aria-checked={myReceive}
              role="switch"
              style={{
                flexShrink: 0,
                width: 52,
                height: 28,
                borderRadius: 14,
                border: "none",
                cursor: myAlertLoading || setMyAlertPref.isPending ? "not-allowed" : "pointer",
                background: myReceive ? "#0f2044" : "#d1d5db",
                position: "relative",
                transition: "background 0.2s",
                outline: "none",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  left: myReceive ? 27 : 3,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "white",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                  transition: "left 0.2s",
                }}
              />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: myReceive ? "rgba(15,32,68,0.08)" : "rgba(107,114,128,0.10)",
                color: myReceive ? "#0f2044" : "#6b7280",
              }}
            >
              {myAlertLoading ? "Loading…" : myReceive ? "Receiving alerts" : "Opted out"}
            </span>
            {setMyAlertPref.isPending && (
              <span className="text-xs text-gray-400">Saving…</span>
            )}
          </div>
        </div>

        {/* Future settings placeholder */}
        <div
          style={{
            ...CARD_STYLE,
            opacity: 0.5,
            background: "rgba(255,255,255,0.45)",
          }}
        >
          <h2 className="text-base font-semibold text-[#0f2044] mb-1">More Settings</h2>
          <p className="text-sm text-gray-400">Additional configuration options will appear here as new features are added.</p>
        </div>
      </div>
    </div>
  );
}
