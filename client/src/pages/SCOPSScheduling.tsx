import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import SCOPSNav from "@/components/SCOPSNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(d: Date | string | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// ─── Manual Tour Form ─────────────────────────────────────────────────────────

interface ManualTourForm {
  inviteeName: string;
  inviteeEmail: string;
  inviteePhone: string;
  eventName: string;
  startDate: string;
  startTime: string;
  endTime: string;
  location: string;
}

const emptyForm: ManualTourForm = {
  inviteeName: "",
  inviteeEmail: "",
  inviteePhone: "",
  eventName: "Home Tour",
  startDate: "",
  startTime: "10:00",
  endTime: "11:00",
  location: "Pahrump, NV",
};

// ─── Calendly Widget ─────────────────────────────────────────────────────────

function CalendlyWidget({ url }: { url: string }) {
  useEffect(() => {
    // Load Calendly widget script if not already loaded
    if (!document.querySelector('script[src*="calendly.com/assets/external/widget.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div
      className="calendly-inline-widget"
      data-url={url}
      style={{ minWidth: '320px', height: '700px' }}
    />
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SCOPSScheduling() {
  const adminMeQuery = trpc.adminAuth.me.useQuery();
  const adminUser = adminMeQuery.data;
  const loading = adminMeQuery.isLoading;

  // Pre-fill form from query params (e.g. from "Schedule Tour" button on lead detail)
  const prefillForm = React.useMemo((): ManualTourForm => {
    const params = new URLSearchParams(window.location.search);
    const name = params.get("name") ?? "";
    const email = params.get("email") ?? "";
    const phone = params.get("phone") ?? "";
    if (name || email) {
      return { ...emptyForm, inviteeName: name, inviteeEmail: email, inviteePhone: phone };
    }
    return emptyForm;
  }, []);

  const hasPrefill = prefillForm.inviteeName !== "" || prefillForm.inviteeEmail !== "";

  const [showManualModal, setShowManualModal] = useState(hasPrefill);
  const [form, setForm] = useState<ManualTourForm>(prefillForm);
  const [cancelTarget, setCancelTarget] = useState<{ id: number; name: string } | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [filter, setFilter] = useState<"all" | "upcoming" | "cancelled">("upcoming");

  const utils = trpc.useUtils();

  const statsQuery = trpc.scheduling.stats.useQuery();
  const toursQuery = trpc.scheduling.list.useQuery({
    upcoming: filter === "upcoming",
    limit: 100,
  });
  const connectionQuery = trpc.scheduling.connectionStatus.useQuery();
  const eventTypesQuery = trpc.scheduling.getEventTypes.useQuery();

  const createMutation = trpc.scheduling.create.useMutation({
    onSuccess: () => {
      toast.success("Tour scheduled successfully");
      setShowManualModal(false);
      setForm(emptyForm);
      utils.scheduling.list.invalidate();
      utils.scheduling.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const digestMutation = trpc.scheduling.sendWeeklyDigest.useMutation({
    onSuccess: (result) => {
      toast.success(`Weekly digest sent to ${result.sent} recipient${result.sent !== 1 ? "s" : ""}`);
    },
    onError: (e) => toast.error(`Digest failed: ${e.message}`),
  });

  const cancelMutation = trpc.scheduling.cancel.useMutation({
    onSuccess: () => {
      toast.success("Tour cancelled");
      setCancelTarget(null);
      setCancelReason("");
      utils.scheduling.list.invalidate();
      utils.scheduling.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  // Auth guard
  if (!loading && !adminUser) {
    window.location.href = getLoginUrl();
    return null;
  }
  if (loading || !adminUser) {
    return (
      <div className="scops-bg min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading…</div>
      </div>
    );
  }

  const tours = toursQuery.data ?? [];
  const stats = statsQuery.data;
  const connection = connectionQuery.data;
  const eventTypes = eventTypesQuery.data ?? [];

  function handleCreate() {
    if (!form.inviteeName || !form.inviteeEmail || !form.startDate) {
      toast.error("Name, email, and date are required");
      return;
    }
    const startTime = new Date(`${form.startDate}T${form.startTime}:00`);
    const endTime = new Date(`${form.startDate}T${form.endTime}:00`);
    if (endTime <= startTime) {
      toast.error("End time must be after start time");
      return;
    }
    // Pass leadId from query params if present (links tour to CRM lead)
    const leadIdParam = new URLSearchParams(window.location.search).get("leadId");
    const contactId = leadIdParam ? parseInt(leadIdParam, 10) : undefined;
    createMutation.mutate({
      inviteeName: form.inviteeName,
      inviteeEmail: form.inviteeEmail,
      inviteePhone: form.inviteePhone || undefined,
      eventName: form.eventName,
      startTime,
      endTime,
      location: form.location || undefined,
      contactId: contactId && !isNaN(contactId) ? contactId : undefined,
    });
  }

  return (
    <div className="scops-bg min-h-screen">
      {/* Nav */}
      <SCOPSNav adminUser={adminUser} currentPage="scheduling" />

      <div className="px-6 py-6 max-w-screen-xl mx-auto space-y-6">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0f2044] tracking-tight">Scheduling</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage home tour appointments — synced from Calendly or added manually.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => digestMutation.mutate()}
              disabled={digestMutation.isPending}
              className="text-sm border-slate-300 text-slate-600 hover:bg-slate-100"
            >
              {digestMutation.isPending ? "⧗ Sending…" : "🦉 Send Weekly Digest"}
            </Button>
            <Button
              onClick={() => setShowManualModal(true)}
              className="bg-[#0f2044] hover:bg-[#1a3366] text-white"
            >
              + Schedule Tour
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Upcoming Tours", value: stats?.upcoming ?? 0, sub: "confirmed" },
            { label: "This Week", value: stats?.thisWeek ?? 0, sub: "scheduled" },
            { label: "Total Tours", value: stats?.total ?? 0, sub: "all time" },
            { label: "Cancelled", value: stats?.cancelled ?? 0, sub: "total" },
          ].map(({ label, value, sub }) => (
            <Card key={label} className="border-0 shadow-sm">
              <CardContent className="pt-5 pb-4">
                <div className="text-3xl font-extrabold text-[#0f2044]">{value}</div>
                <div className="text-sm font-semibold text-slate-700 mt-1">{label}</div>
                <div className="text-xs text-slate-400">{sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Calendly Inline Booking Widget */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              Book a Tour — Calendly
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Share this page or use the widget below to book a home tour directly.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <CalendlyWidget url="https://calendly.com/d/cyjg-rx9-q39/meeting" />
          </CardContent>
        </Card>

        {/* Calendly connection status */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              Calendly Integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            {connectionQuery.isLoading ? (
              <div className="text-sm text-slate-400">Checking connection…</div>
            ) : connection?.connected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-slate-700">
                    Connected as <strong>{(connection as { connected: true; user: { name: string } }).user?.name}</strong>
                  </span>
                  <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Active</Badge>
                </div>

                {/* Event type links */}
                {eventTypes.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Scheduling Links
                    </p>
                    <div className="space-y-2">
                      {eventTypes.map((et) => (
                        <div key={et.uri} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5 border border-slate-200">
                          <div>
                            <div className="text-sm font-medium text-slate-800">{et.name}</div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">{et.scheduling_url}</div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(et.scheduling_url);
                              toast.success("Link copied");
                            }}
                            className="text-xs ml-4 shrink-0"
                          >
                            Copy Link
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Webhook instructions */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
                    Webhook Setup Required
                  </p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    To automatically sync Calendly bookings into SCOPS, add a webhook in your{" "}
                    <a
                      href="https://calendly.com/integrations/api_webhooks"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium"
                    >
                      Calendly Integrations
                    </a>{" "}
                    page pointing to:
                  </p>
                  <code className="block mt-2 text-xs bg-amber-100 text-amber-900 rounded px-3 py-2 font-mono break-all">
                    {window.location.origin}/api/webhooks/calendly
                  </code>
                  <p className="text-xs text-amber-600 mt-2">
                    Subscribe to: <strong>invitee.created</strong> and <strong>invitee.canceled</strong>
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <span className="text-sm text-slate-500">
                    {(connection as { connected: false; reason: string })?.reason ?? "Not connected"}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Connect Calendly
                  </p>
                  <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
                    <li>Go to <a href="https://calendly.com/integrations/api_webhooks" target="_blank" rel="noopener noreferrer" className="underline text-[#0f2044]">Calendly → Integrations → API & Webhooks</a></li>
                    <li>Generate a Personal Access Token</li>
                    <li>Add it as <code className="bg-slate-100 px-1 rounded font-mono">CALENDLY_API_KEY</code> in SCOPS Secrets</li>
                  </ol>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tour list */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                Tours
              </CardTitle>
              <div className="flex gap-1">
                {(["upcoming", "all", "cancelled"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all capitalize ${
                      filter === f
                        ? "bg-[#0f2044] text-white"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {toursQuery.isLoading ? (
              <div className="text-sm text-slate-400 py-8 text-center">Loading tours…</div>
            ) : tours.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📅</div>
                <p className="text-slate-500 font-medium">No tours found</p>
                <p className="text-slate-400 text-sm mt-1">
                  {filter === "upcoming"
                    ? "No upcoming tours scheduled. Add one manually or connect Calendly."
                    : "No tours match this filter."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {tours.map((tour) => (
                  <div
                    key={tour.id}
                    className="flex items-center justify-between bg-white border border-slate-100 rounded-lg px-4 py-3 hover:border-slate-200 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Date block */}
                      <div className="text-center min-w-[52px]">
                        <div className="text-xs font-bold text-slate-400 uppercase">
                          {new Date(tour.startTime).toLocaleDateString("en-US", { month: "short" })}
                        </div>
                        <div className="text-2xl font-extrabold text-[#0f2044] leading-none">
                          {new Date(tour.startTime).getDate()}
                        </div>
                        <div className="text-xs text-slate-400">
                          {formatTime(tour.startTime)}
                        </div>
                      </div>

                      {/* Info */}
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">{tour.inviteeName}</div>
                        <div className="text-xs text-slate-500">{tour.inviteeEmail}</div>
                        {tour.inviteePhone && (
                          <div className="text-xs text-slate-400">{tour.inviteePhone}</div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-400">{tour.eventName ?? "Home Tour"}</span>
                          {tour.location && (
                            <>
                              <span className="text-slate-200">·</span>
                              <span className="text-xs text-slate-400">{tour.location}</span>
                            </>
                          )}
                          {tour.calendlyEventUri.startsWith("manual:") && (
                            <Badge className="bg-slate-100 text-slate-500 border-slate-200 text-[10px] px-1.5 py-0">Manual</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge
                        className={
                          tour.status === "ACTIVE"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-red-100 text-red-600 border-red-200"
                        }
                      >
                        {tour.status === "ACTIVE" ? "Confirmed" : "Cancelled"}
                      </Badge>
                      {tour.status === "ACTIVE" && (
                        <button
                          onClick={() => setCancelTarget({ id: tour.id, name: tour.inviteeName })}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manual Tour Modal */}
      <Dialog open={showManualModal} onOpenChange={setShowManualModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Tour Manually</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Name *</label>
                <Input
                  placeholder="Jane Smith"
                  value={form.inviteeName}
                  onChange={e => setForm(f => ({ ...f, inviteeName: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Phone</label>
                <Input
                  placeholder="(702) 555-0100"
                  value={form.inviteePhone}
                  onChange={e => setForm(f => ({ ...f, inviteePhone: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Email *</label>
              <Input
                type="email"
                placeholder="jane@example.com"
                value={form.inviteeEmail}
                onChange={e => setForm(f => ({ ...f, inviteeEmail: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Event Name</label>
              <Input
                placeholder="Home Tour"
                value={form.eventName}
                onChange={e => setForm(f => ({ ...f, eventName: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Date *</label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Start</label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">End</label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Location</label>
              <Input
                placeholder="Pahrump, NV"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualModal(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="bg-[#0f2044] hover:bg-[#1a3366] text-white"
            >
              {createMutation.isPending ? "Scheduling…" : "Schedule Tour"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Modal */}
      <Dialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel Tour</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-slate-600">
              Cancel the tour for <strong>{cancelTarget?.name}</strong>?
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Reason (optional)</label>
              <Input
                placeholder="e.g. Buyer rescheduled"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>Keep Tour</Button>
            <Button
              variant="destructive"
              onClick={() => cancelTarget && cancelMutation.mutate({ id: cancelTarget.id, reason: cancelReason || undefined })}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? "Cancelling…" : "Cancel Tour"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
