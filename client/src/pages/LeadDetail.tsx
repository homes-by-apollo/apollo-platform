import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

const STAGE_ORDER = [
  "NEW_LEAD", "CONTACTED", "NURTURE", "SQL",
  "TOUR_SCHEDULED", "TOUR_COMPLETED", "PROPOSAL_SENT",
  "CONTRACT_SIGNED", "IN_CONSTRUCTION", "CLOSED", "LOST",
] as const;

const STAGE_LABELS: Record<string, string> = {
  NEW_LEAD: "New Lead", CONTACTED: "Contacted", NURTURE: "Nurturing",
  SQL: "SQL", TOUR_SCHEDULED: "Tour Scheduled", TOUR_COMPLETED: "Tour Completed",
  PROPOSAL_SENT: "Proposal Sent", CONTRACT_SIGNED: "Contract Signed",
  IN_CONSTRUCTION: "In Construction", CLOSED: "Closed", LOST: "Lost",
};

const SCORE_COLORS: Record<string, string> = {
  HOT: "bg-red-100 text-red-700",
  WARM: "bg-amber-100 text-amber-700",
  COLD: "bg-blue-100 text-blue-700",
};

const LOSS_REASONS = [
  { value: "BOUGHT_ELSEWHERE", label: "Bought elsewhere" },
  { value: "FINANCING_FAILED", label: "Could not secure financing" },
  { value: "TIMELINE_CHANGED", label: "Timeline changed" },
  { value: "PRICE_TOO_HIGH", label: "Price too high" },
  { value: "NO_RESPONSE", label: "No response after 30 days" },
  { value: "OTHER", label: "Other" },
];

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatTimeline(t: string | null | undefined) {
  const map: Record<string, string> = {
    ASAP: "ASAP", "1_3_MONTHS": "1–3 months", "3_6_MONTHS": "3–6 months",
    "6_12_MONTHS": "6–12 months", JUST_BROWSING: "Just browsing",
  };
  return t ? (map[t] ?? t) : "—";
}

function formatFinancing(f: string | null | undefined) {
  const map: Record<string, string> = {
    PRE_APPROVED: "Pre-approved", IN_PROCESS: "In process",
    NOT_STARTED: "Not started", CASH_BUYER: "Cash buyer",
  };
  return f ? (map[f] ?? f) : "—";
}

function formatPrice(min: number | null | undefined, max: number | null | undefined) {
  if (!min && !max) return "—";
  const fmt = (n: number) => `$${(n / 1000).toFixed(0)}K`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

interface Props {
  id: number;
  onBack: () => void;
}

export default function LeadDetail({ id, onBack }: Props) {
  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.leads.getById.useQuery({ id });
  const [note, setNote] = useState("");
  const [newStage, setNewStage] = useState<string>("");
  const [lossReason, setLossReason] = useState<string>("");

  const updateStage = trpc.leads.updateStage.useMutation({
    onSuccess: () => {
      utils.leads.getById.invalidate({ id });
      utils.leads.list.invalidate();
      utils.leads.dashboardStats.invalidate();
      setNewStage("");
      setLossReason("");
      toast.success("Stage updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const addNote = trpc.leads.addNote.useMutation({
    onSuccess: () => {
      utils.leads.getById.invalidate({ id });
      setNote("");
      toast.success("Note added");
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading contact…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm text-red-500">Contact not found.</div>
      </div>
    );
  }

  const { contact, activity, emails } = data;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-[#0f2044] text-white px-6 py-4 flex items-center gap-4">
        <button onClick={onBack} className="text-white/60 hover:text-white text-sm transition-colors">
          ← Back to CRM
        </button>
        <span className="text-white/30">|</span>
        <span className="font-bold">{contact.firstName} {contact.lastName}</span>
        {contact.leadScore && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${SCORE_COLORS[contact.leadScore]} ml-1`}>
            {contact.leadScore}
          </span>
        )}
      </div>

      <div className="px-6 py-6 max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Contact Info + Stage */}
        <div className="lg:col-span-1 space-y-4">
          {/* Contact Info */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-[#0f2044] uppercase tracking-wider">Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Type</div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${contact.contactType === "BUYER" ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-700"}`}>
                  {contact.contactType === "BUYER" ? "Homebuyer" : "Real Estate Agent"}
                </span>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Email</div>
                <a href={`mailto:${contact.email}`} className="text-[#0f2044] font-medium hover:underline">{contact.email}</a>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Phone</div>
                <a href={`tel:${contact.phone}`} className="text-[#0f2044] font-medium hover:underline">{contact.phone}</a>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Source</div>
                <span className="font-medium">{contact.source}</span>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-0.5">Created</div>
                <span className="font-medium">{formatDate(contact.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Qualification (Buyers only) */}
          {contact.contactType === "BUYER" && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-[#0f2044] uppercase tracking-wider">Qualification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Timeline</div>
                  <span className="font-medium">{formatTimeline(contact.timeline)}</span>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Price Range</div>
                  <span className="font-medium">{formatPrice(contact.priceRangeMin, contact.priceRangeMax)}</span>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Financing</div>
                  <span className="font-medium">{formatFinancing(contact.financingStatus)}</span>
                </div>
                {contact.lenderName && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Lender</div>
                    <span className="font-medium">{contact.lenderName}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Agent fields */}
          {contact.contactType === "AGENT" && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-[#0f2044] uppercase tracking-wider">Agent Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {contact.brokerageName && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Brokerage</div>
                    <span className="font-medium">{contact.brokerageName}</span>
                  </div>
                )}
                {contact.licenseNumber && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">License</div>
                    <span className="font-medium">{contact.licenseNumber}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pipeline Stage */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-[#0f2044] uppercase tracking-wider">Pipeline Stage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm font-semibold text-[#0f2044]">{STAGE_LABELS[contact.pipelineStage]}</div>
              <Select value={newStage} onValueChange={setNewStage}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Move to stage…" />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_ORDER.filter(s => s !== contact.pipelineStage).map(s => (
                    <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newStage === "LOST" && (
                <Select value={lossReason} onValueChange={setLossReason}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Loss reason (required)…" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOSS_REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {newStage && (
                <Button
                  size="sm"
                  className="w-full h-8 text-xs bg-[#0f2044] hover:bg-[#1a3366]"
                  disabled={updateStage.isPending || (newStage === "LOST" && !lossReason)}
                  onClick={() => updateStage.mutate({
                    id,
                    stage: newStage as any,
                    lossReason: lossReason as any || undefined,
                  })}
                >
                  {updateStage.isPending ? "Saving…" : `Move → ${STAGE_LABELS[newStage]}`}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Activity + Email Log + Notes */}
        <div className="lg:col-span-2 space-y-4">
          {/* Add Note */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-[#0f2044] uppercase tracking-wider">Add Note</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                placeholder="Log a call, add context, or record an update…"
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                className="text-sm resize-none"
              />
              <Button
                size="sm"
                className="bg-[#0f2044] hover:bg-[#1a3366] text-xs h-8"
                disabled={!note.trim() || addNote.isPending}
                onClick={() => addNote.mutate({ id, note: note.trim() })}
              >
                {addNote.isPending ? "Saving…" : "Save Note"}
              </Button>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-[#0f2044] uppercase tracking-wider">
                Activity Log ({activity.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <p className="text-xs text-muted-foreground">No activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {activity.map(a => (
                    <div key={a.id} className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0f2044] mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-[#0f2044] uppercase tracking-wide mb-0.5">
                          {a.activityType.replace(/_/g, " ")}
                        </div>
                        <div className="text-sm text-foreground leading-relaxed">{a.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">{formatDate(a.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Log */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-[#0f2044] uppercase tracking-wider">
                Email History ({emails.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {emails.length === 0 ? (
                <p className="text-xs text-muted-foreground">No emails sent yet.</p>
              ) : (
                <div className="space-y-2">
                  {emails.map(e => (
                    <div key={e.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <div className="text-sm font-medium">{e.subject}</div>
                        <div className="text-xs text-muted-foreground">{e.templateId} · {formatDate(e.sentAt)}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        e.status === "OPENED" || e.status === "CLICKED" ? "bg-green-100 text-green-700" :
                        e.status === "BOUNCED" || e.status === "FAILED" ? "bg-red-100 text-red-600" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {e.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
