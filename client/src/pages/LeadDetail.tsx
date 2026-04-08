import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useRef, useState } from "react";
import { toast } from "sonner";

// --- Stage constants (must match DB enum exactly) ---

const STAGE_ORDER = [
  "NEW_INQUIRY",
  "QUALIFIED",
  "TOUR_SCHEDULED",
  "TOURED",
  "OFFER_SUBMITTED",
  "UNDER_CONTRACT",
  "CLOSED",
  "LOST",
] as const;

type PipelineStage = (typeof STAGE_ORDER)[number];

const STAGE_LABELS: Record<PipelineStage, string> = {
  NEW_INQUIRY:     "New Inquiry",
  QUALIFIED:       "Qualified",
  TOUR_SCHEDULED:  "Tour Scheduled",
  TOURED:          "Toured",
  OFFER_SUBMITTED: "Offer Submitted",
  UNDER_CONTRACT:  "Under Contract",
  CLOSED:          "Closed",
  LOST:            "Lost",
};

const STAGE_COLORS: Record<PipelineStage, string> = {
  NEW_INQUIRY:     "bg-slate-100 text-slate-700",
  QUALIFIED:       "bg-blue-100 text-blue-700",
  TOUR_SCHEDULED:  "bg-violet-100 text-violet-700",
  TOURED:          "bg-purple-100 text-purple-700",
  OFFER_SUBMITTED: "bg-amber-100 text-amber-700",
  UNDER_CONTRACT:  "bg-orange-100 text-orange-700",
  CLOSED:          "bg-green-100 text-green-700",
  LOST:            "bg-red-100 text-red-700",
};

const SCORE_COLORS: Record<string, string> = {
  HOT:  "bg-red-100 text-red-700",
  WARM: "bg-amber-100 text-amber-700",
  COLD: "bg-blue-100 text-blue-700",
};

const LOSS_REASONS = [
  { value: "BOUGHT_ELSEWHERE",  label: "Bought elsewhere" },
  { value: "FINANCING_FAILED",  label: "Could not secure financing" },
  { value: "TIMELINE_CHANGED",  label: "Timeline changed" },
  { value: "PRICE_TOO_HIGH",    label: "Price too high" },
  { value: "NO_RESPONSE",       label: "No response after 30 days" },
  { value: "OTHER",             label: "Other" },
];

// --- Formatters ---

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "--";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function formatDateShort(d: Date | string | null | undefined) {
  if (!d) return "--";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatTimeline(t: string | null | undefined) {
  const map: Record<string, string> = {
    ASAP: "ASAP", "1_3_MONTHS": "1-3 months", "3_6_MONTHS": "3-6 months",
    "6_12_MONTHS": "6-12 months", JUST_BROWSING: "Just browsing",
  };
  return t ? (map[t] ?? t) : "--";
}

function formatFinancing(f: string | null | undefined) {
  const map: Record<string, string> = {
    PRE_APPROVED: "Pre-approved", IN_PROCESS: "In process",
    NOT_STARTED: "Not started", CASH_BUYER: "Cash buyer",
  };
  return f ? (map[f] ?? f) : "--";
}

function formatPrice(min: number | null | undefined, max: number | null | undefined) {
  if (!min && !max) return "--";
  const fmt = (n: number) => `$${(n / 1000).toFixed(0)}K`;
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// --- Section header ---

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-bold text-[#0f2044] uppercase tracking-wider mb-3">
      {children}
    </div>
  );
}

// --- Props ---

interface Props {
  id: number;
  onBack: () => void;
}

// --- Component ---

export default function LeadDetail({ id, onBack }: Props) {
  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.leads.getById.useQuery({ id });

  // Stage
  const [newStage, setNewStage] = useState<string>("");
  const [lossReason, setLossReason] = useState<string>("");

  // Note
  const [note, setNote] = useState("");

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editFirst, setEditFirst] = useState("");
  const [editLast, setEditLast] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Follow-up form
  const [fuType, setFuType] = useState<"CALL" | "EMAIL" | "TEXT" | "MEETING" | "OTHER">("CALL");
  const [fuNote, setFuNote] = useState("");
  const [fuDue, setFuDue] = useState("");
  const [showFuForm, setShowFuForm] = useState(false);

  // Appointment form
  const [apptTitle, setApptTitle] = useState("");
  const [apptType, setApptType] = useState<"TOUR" | "CALL" | "MEETING" | "SHOWING" | "OTHER">("TOUR");
  const [apptDate, setApptDate] = useState("");
  const [apptLocation, setApptLocation] = useState("");
  const [apptNotes, setApptNotes] = useState("");
  const [showApptForm, setShowApptForm] = useState(false);

  // File upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Contracts form state
  const [showContractForm, setShowContractForm] = useState(false);
  const [contractTitle, setContractTitle] = useState("Purchase Agreement");
  const [contractPrice, setContractPrice] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [contractDate, setContractDate] = useState("");
  const [contractStatus, setContractStatus] = useState<"PENDING"|"EXECUTED"|"CANCELLED">("PENDING");
  const [contractNotes, setContractNotes] = useState("");
  const [editingContractId, setEditingContractId] = useState<number|null>(null);

  // ---
  const createContract = trpc.crm.createContract.useMutation({
    onSuccess: () => {
      utils.crm.listContracts.invalidate({ contactId: id });
      utils.leads.getById.invalidate({ id });
      setShowContractForm(false);
      setContractTitle("Purchase Agreement"); setContractPrice(""); setContractAddress("");
      setContractDate(""); setContractStatus("PENDING"); setContractNotes("");
      setEditingContractId(null);
      toast.success("Contract saved");
    },
    onError: (err) => toast.error(err.message),
  });
  const updateContract = trpc.crm.updateContract.useMutation({
    onSuccess: () => {
      utils.crm.listContracts.invalidate({ contactId: id });
      setShowContractForm(false);
      setEditingContractId(null);
      toast.success("Contract updated");
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteContract = trpc.crm.deleteContract.useMutation({
    onSuccess: () => utils.crm.listContracts.invalidate({ contactId: id }),
    onError: (err) => toast.error(err.message),
  });

  function handleContractSubmit() {
    if (editingContractId !== null) {
      updateContract.mutate({
        id: editingContractId,
        contactId: id,
        title: contractTitle,
        purchasePrice: contractPrice ? Number(contractPrice) : undefined,
        lotAddress: contractAddress || undefined,
        contractDate: contractDate || undefined,
        status: contractStatus,
        notes: contractNotes || undefined,
      });
    } else {
      createContract.mutate({
        contactId: id,
        title: contractTitle,
        purchasePrice: contractPrice ? Number(contractPrice) : undefined,
        lotAddress: contractAddress || undefined,
        contractDate: contractDate || undefined,
        status: contractStatus,
        notes: contractNotes || undefined,
      });
    }
  }

  function startEditContract(c: NonNullable<typeof contractsQ.data>[number]) {
    setEditingContractId(c.id);
    setContractTitle(c.title ?? "Purchase Agreement");
    setContractPrice(c.purchasePrice ? String(c.purchasePrice) : "");
    setContractAddress(c.lotAddress ?? "");
    setContractDate(c.contractDate ? new Date(c.contractDate).toISOString().split("T")[0] : "");
    setContractStatus((c.status as any) ?? "PENDING");
    setContractNotes(c.notes ?? "");
    setShowContractForm(true);
  }

  // ---
  const followUpsQ = trpc.crm.listFollowUps.useQuery({ contactId: id });
  const appointmentsQ = trpc.crm.listAppointments.useQuery({ contactId: id });
  const attachmentsQ = trpc.crm.listAttachments.useQuery({ contactId: id });
  const contractsQ = trpc.crm.listContracts.useQuery({ contactId: id });

  // ---
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
      toast.success("Note saved");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateContact = trpc.leads.updateContact.useMutation({
    onSuccess: () => {
      utils.leads.getById.invalidate({ id });
      setEditMode(false);
      toast.success("Contact updated");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteLead = trpc.crm.deleteLead.useMutation({
    onSuccess: () => {
      toast.success("Lead deleted");
      onBack();
    },
    onError: (err) => toast.error(err.message),
  });

  const resendWelcome = trpc.leads.resendWelcome.useMutation({
    onSuccess: () => { utils.leads.getById.invalidate({ id }); toast.success("Welcome email sent"); },
    onError: (err) => toast.error(err.message),
  });

  const createFollowUp = trpc.crm.createFollowUp.useMutation({
    onSuccess: () => {
      utils.crm.listFollowUps.invalidate({ contactId: id });
      utils.leads.getById.invalidate({ id });
      setFuNote(""); setFuDue(""); setShowFuForm(false);
      toast.success("Follow-up scheduled");
    },
    onError: (err) => toast.error(err.message),
  });

  const completeFollowUp = trpc.crm.completeFollowUp.useMutation({
    onSuccess: () => utils.crm.listFollowUps.invalidate({ contactId: id }),
    onError: (err) => toast.error(err.message),
  });

  const deleteFollowUp = trpc.crm.deleteFollowUp.useMutation({
    onSuccess: () => utils.crm.listFollowUps.invalidate({ contactId: id }),
    onError: (err) => toast.error(err.message),
  });

  const createAppointment = trpc.crm.createAppointment.useMutation({
    onSuccess: () => {
      utils.crm.listAppointments.invalidate({ contactId: id });
      utils.leads.getById.invalidate({ id });
      setApptTitle(""); setApptDate(""); setApptLocation(""); setApptNotes(""); setShowApptForm(false);
      toast.success("Appointment booked");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateApptStatus = trpc.crm.updateAppointmentStatus.useMutation({
    onSuccess: () => utils.crm.listAppointments.invalidate({ contactId: id }),
    onError: (err) => toast.error(err.message),
  });

  const deleteAppointment = trpc.crm.deleteAppointment.useMutation({
    onSuccess: () => utils.crm.listAppointments.invalidate({ contactId: id }),
    onError: (err) => toast.error(err.message),
  });

  const uploadAttachment = trpc.crm.uploadAttachment.useMutation({
    onSuccess: () => {
      utils.crm.listAttachments.invalidate({ contactId: id });
      utils.leads.getById.invalidate({ id });
      toast.success("File uploaded");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteAttachment = trpc.crm.deleteAttachment.useMutation({
    onSuccess: () => utils.crm.listAttachments.invalidate({ contactId: id }),
    onError: (err) => toast.error(err.message),
  });

  // ---

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const MAX_MB = 10;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`File too large (max ${MAX_MB} MB)`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadAttachment.mutate({
        contactId: id,
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        base64,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  // ---

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
  const currentStage = contact.pipelineStage as PipelineStage;

  // ---

  return (
    <div className="min-h-screen bg-slate-50">

      {/* -- Top bar -- */}
      <div className="bg-white border-b border-[#e2e6ed] px-4 sm:px-6 py-3 flex flex-wrap items-center gap-2 sm:gap-3 sticky top-0 z-20">
        <button
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-[#0f2044] transition-colors flex items-center gap-1"
        >
          ← Back
        </button>
        <span className="text-slate-300">|</span>
        <span className="font-semibold text-[#0f2044] text-sm">
          {contact.firstName} {contact.lastName}
        </span>
        {contact.leadScore && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${SCORE_COLORS[contact.leadScore]}`}>
            {contact.leadScore}
          </span>
        )}
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${STAGE_COLORS[currentStage]}`}>
          {STAGE_LABELS[currentStage]}
        </span>

        {/* Created / modified -- hidden on small screens */}
        <div className="ml-auto hidden md:flex items-center gap-4 text-xs text-slate-400">
          <span>Created {formatDateShort(contact.createdAt)}</span>
          <span>Modified {formatDateShort(contact.updatedAt)}</span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!editMode) {
                setEditFirst(contact.firstName ?? "");
                setEditLast(contact.lastName ?? "");
                setEditEmail(contact.email ?? "");
                setEditPhone(contact.phone ?? "");
              }
              setEditMode(!editMode);
            }}
            className={`text-xs px-3 py-1.5 rounded font-semibold transition-colors border ${
              editMode
                ? "bg-[#0f2044] text-white border-[#0f2044]"
                : "bg-white text-[#0f2044] border-[#e2e6ed] hover:border-[#0f2044]"
            }`}
          >
            {editMode ? "Cancel" : "Edit"}
          </button>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs px-3 py-1.5 rounded font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-red-600 font-medium">Sure?</span>
              <button
                onClick={() => deleteLead.mutate({ id })}
                disabled={deleteLead.isPending}
                className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 font-semibold"
              >
                Yes, delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs px-2 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                No
              </button>
            </div>
          )}
          <button
            onClick={() => {
              // Open Calendly popup pre-filled with lead's name and email.
              // Calendly sends its own confirmation email -- no duplicate from SCOPS.
              const CALENDLY_URL = "https://calendly.com/d/cyjg-rx9-q39/meeting";
              const name = `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim();
              const params = new URLSearchParams();
              if (name) params.set("name", name);
              if (contact.email) params.set("email", contact.email);
              const prefillUrl = `${CALENDLY_URL}?${params.toString()}`;
              const w = window as any;
              function openPopup() {
                if (w.Calendly?.initPopupWidget) {
                  w.Calendly.initPopupWidget({ url: prefillUrl });
                } else {
                  window.open(prefillUrl, "_blank");
                }
              }
              if (w.Calendly) {
                openPopup();
              } else {
                if (!document.querySelector('link[href*="calendly.com"]')) {
                  const link = document.createElement("link");
                  link.rel = "stylesheet";
                  link.href = "https://assets.calendly.com/assets/external/widget.css";
                  document.head.appendChild(link);
                }
                const script = document.createElement("script");
                script.src = "https://assets.calendly.com/assets/external/widget.js";
                script.async = true;
                script.onload = openPopup;
                document.body.appendChild(script);
              }
            }}
            className="text-xs bg-sky-500 hover:bg-sky-400 text-white rounded px-3 py-1.5 font-semibold hidden sm:block"
          >
            📅 Schedule Tour
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* -- Left column -- */}
        <div className="lg:col-span-1 space-y-4">

          {/* -- Pipeline Stage (TOP) -- */}
          <Card className="border border-[#e2e6ed] shadow-none">
            <CardHeader className="pb-2 pt-4 px-4">
              <SectionTitle>Pipeline Stage</SectionTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              {/* Stage progress dots */}
              <div className="flex flex-wrap gap-1.5 mb-1">
                {STAGE_ORDER.filter(s => s !== "LOST").map(s => (
                  <div
                    key={s}
                    title={STAGE_LABELS[s]}
                    className={`h-2 w-2 rounded-full transition-all ${
                      s === currentStage
                        ? "bg-[#0f2044] scale-125"
                        : STAGE_ORDER.indexOf(s) < STAGE_ORDER.indexOf(currentStage)
                          ? "bg-[#0f2044]/40"
                          : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
              <div className={`text-sm font-bold px-3 py-1.5 rounded-full inline-block ${STAGE_COLORS[currentStage]}`}>
                {STAGE_LABELS[currentStage]}
              </div>

              <Select value={newStage} onValueChange={setNewStage}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Move to stage…" />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_ORDER.filter(s => s !== currentStage).map(s => (
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
                    {LOSS_REASONS.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {newStage && (
                <Button
                  size="sm"
                  className="w-full h-8 text-xs bg-[#0f2044] hover:bg-[#1a3366]"
                  disabled={updateStage.isPending || (newStage === "LOST" && !lossReason)}
                  onClick={() =>
                    updateStage.mutate({
                      id,
                      stage: newStage as PipelineStage,
                      lossReason: (lossReason as any) || undefined,
                    })
                  }
                >
                  {updateStage.isPending ? "Saving…" : `Move → ${STAGE_LABELS[newStage as PipelineStage]}`}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* -- Contact Info -- */}
          <Card className="border border-[#e2e6ed] shadow-none">
            <CardHeader className="pb-2 pt-4 px-4">
              <SectionTitle>Contact Info</SectionTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3 text-sm">
              {editMode ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">First Name</div>
                      <Input value={editFirst} onChange={e => setEditFirst(e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Last Name</div>
                      <Input value={editLast} onChange={e => setEditLast(e.target.value)} className="h-8 text-xs" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Email</div>
                    <Input value={editEmail} onChange={e => setEditEmail(e.target.value)} className="h-8 text-xs" type="email" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Phone</div>
                    <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} className="h-8 text-xs" type="tel" />
                  </div>
                  <Button
                    size="sm"
                    className="w-full h-8 text-xs bg-[#0f2044] hover:bg-[#1a3366]"
                    disabled={updateContact.isPending}
                    onClick={() =>
                      updateContact.mutate({
                        id,
                        firstName: editFirst || undefined,
                        lastName: editLast || undefined,
                        email: editEmail || undefined,
                        phone: editPhone || undefined,
                      })
                    }
                  >
                    {updateContact.isPending ? "Saving…" : "Save Changes"}
                  </Button>
                </div>
              ) : (
                <>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Type</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      contact.contactType === "BUYER" ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-700"
                    }`}>
                      {contact.contactType === "BUYER" ? "Homebuyer" : "Real Estate Agent"}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Email</div>
                    <a href={`mailto:${contact.email}`} className="text-[#0f2044] font-medium hover:underline break-all">
                      {contact.email}
                    </a>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Phone</div>
                    <a href={`tel:${contact.phone}`} className="text-[#0f2044] font-medium hover:underline">
                      {contact.phone || "--"}
                    </a>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Source</div>
                    <span className="font-medium">{contact.source}</span>
                  </div>
                  <div className="pt-2 border-t border-[#e2e6ed] grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Created</div>
                      <span className="text-xs font-medium">{formatDateShort(contact.createdAt)}</span>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-0.5">Modified</div>
                      <span className="text-xs font-medium">{formatDateShort(contact.updatedAt)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* -- Qualification -- */}
          {contact.contactType === "BUYER" && (
            <Card className="border border-[#e2e6ed] shadow-none">
              <CardHeader className="pb-2 pt-4 px-4">
                <SectionTitle>Qualification</SectionTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3 text-sm">
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

          {/* -- Agent Details -- */}
          {contact.contactType === "AGENT" && (
            <Card className="border border-[#e2e6ed] shadow-none">
              <CardHeader className="pb-2 pt-4 px-4">
                <SectionTitle>Agent Details</SectionTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3 text-sm">
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

          {/* -- UTM Attribution -- */}
          {(contact.utmSource || contact.utmMedium || contact.utmCampaign || contact.landingPage) && (
            <Card className="border border-[#e2e6ed] shadow-none">
              <CardHeader className="pb-2 pt-4 px-4">
                <SectionTitle>Ad Attribution</SectionTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3 text-sm">
                {contact.landingPage && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Landing Page</div>
                    <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{contact.landingPage}</span>
                  </div>
                )}
                {contact.utmSource && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Source</div>
                    <span className="font-medium">{contact.utmSource}</span>
                  </div>
                )}
                {contact.utmMedium && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Medium</div>
                    <span className="font-medium">{contact.utmMedium}</span>
                  </div>
                )}
                {contact.utmCampaign && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Campaign</div>
                    <span className="font-medium">{contact.utmCampaign}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* -- Quick actions -- */}
          <Card className="border border-[#e2e6ed] shadow-none">
            <CardContent className="px-4 py-3">
              <button
                onClick={() => resendWelcome.mutate({ id })}
                disabled={resendWelcome.isPending}
                className="w-full text-xs border border-[#e2e6ed] hover:border-[#0f2044] text-slate-600 hover:text-[#0f2044] rounded px-3 py-2 transition-colors disabled:opacity-50 text-left"
              >
                {resendWelcome.isPending ? "⧗ Sending…" : "✉️ Resend Welcome Email"}
              </button>
            </CardContent>
          </Card>
        </div>

        {/* -- Right column -- */}
        <div className="lg:col-span-2 space-y-4">

          {/* -- Follow-Ups -- */}
          <Card className="border border-[#e2e6ed] shadow-none">
            <CardHeader className="pb-0 pt-4 px-4">
              <div className="flex items-center justify-between">
                <SectionTitle>Follow-Ups ({followUpsQ.data?.length ?? 0})</SectionTitle>
                <button
                  onClick={() => setShowFuForm(!showFuForm)}
                  className="text-xs text-[#0f2044] hover:underline font-semibold"
                >
                  {showFuForm ? "Cancel" : "+ Add"}
                </button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {showFuForm && (
                <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-[#e2e6ed] space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Type</div>
                      <Select value={fuType} onValueChange={v => setFuType(v as any)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["CALL", "EMAIL", "TEXT", "MEETING", "OTHER"].map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Due Date</div>
                      <Input
                        type="datetime-local"
                        value={fuDue}
                        onChange={e => setFuDue(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Note (optional)</div>
                    <Input
                      value={fuNote}
                      onChange={e => setFuNote(e.target.value)}
                      placeholder="e.g. Follow up on financing status"
                      className="h-8 text-xs"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-[#0f2044] hover:bg-[#1a3366]"
                    disabled={!fuDue || createFollowUp.isPending}
                    onClick={() =>
                      createFollowUp.mutate({
                        contactId: id,
                        type: fuType,
                        note: fuNote || undefined,
                        dueAt: new Date(fuDue),
                      })
                    }
                  >
                    {createFollowUp.isPending ? "Saving…" : "Schedule Follow-Up"}
                  </Button>
                </div>
              )}

              {!followUpsQ.data || followUpsQ.data.length === 0 ? (
                <p className="text-xs text-muted-foreground">No follow-ups scheduled.</p>
              ) : (
                <div className="space-y-2">
                  {followUpsQ.data.map(fu => (
                    <div
                      key={fu.id}
                      className={`flex items-start justify-between p-2.5 rounded-lg border text-sm ${
                        fu.completedAt ? "bg-green-50 border-green-200 opacity-70" : "bg-white border-[#e2e6ed]"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold text-[#0f2044]">{fu.type}</span>
                          {fu.completedAt && (
                            <span className="text-xs text-green-600 font-semibold">✓ Done</span>
                          )}
                        </div>
                        {fu.note && <div className="text-xs text-slate-600 truncate">{fu.note}</div>}
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Due {formatDate(fu.dueAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        {!fu.completedAt && (
                          <button
                            onClick={() => completeFollowUp.mutate({ id: fu.id, contactId: id })}
                            className="text-xs text-green-600 hover:text-green-700 font-bold"
                            title="Mark complete"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={() => deleteFollowUp.mutate({ id: fu.id, contactId: id })}
                          className="text-xs text-red-400 hover:text-red-600"
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* -- Appointments -- */}
          <Card className="border border-[#e2e6ed] shadow-none">
            <CardHeader className="pb-0 pt-4 px-4">
              <div className="flex items-center justify-between">
                <SectionTitle>Appointments ({appointmentsQ.data?.length ?? 0})</SectionTitle>
                <button
                  onClick={() => setShowApptForm(!showApptForm)}
                  className="text-xs text-[#0f2044] hover:underline font-semibold"
                >
                  {showApptForm ? "Cancel" : "+ Add"}
                </button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {showApptForm && (
                <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-[#e2e6ed] space-y-2">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Title</div>
                    <Input
                      value={apptTitle}
                      onChange={e => setApptTitle(e.target.value)}
                      placeholder="e.g. Home Tour -- Lot 12"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Type</div>
                      <Select value={apptType} onValueChange={v => setApptType(v as any)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["TOUR", "CALL", "MEETING", "SHOWING", "OTHER"].map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Date & Time</div>
                      <Input
                        type="datetime-local"
                        value={apptDate}
                        onChange={e => setApptDate(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Location (optional)</div>
                    <Input
                      value={apptLocation}
                      onChange={e => setApptLocation(e.target.value)}
                      placeholder="e.g. 123 Desert Bloom Dr, Pahrump"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Notes (optional)</div>
                    <Textarea
                      value={apptNotes}
                      onChange={e => setApptNotes(e.target.value)}
                      rows={2}
                      className="text-xs resize-none"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-[#0f2044] hover:bg-[#1a3366]"
                    disabled={!apptTitle || !apptDate || createAppointment.isPending}
                    onClick={() =>
                      createAppointment.mutate({
                        contactId: id,
                        title: apptTitle,
                        type: apptType,
                        scheduledAt: new Date(apptDate),
                        location: apptLocation || undefined,
                        notes: apptNotes || undefined,
                      })
                    }
                  >
                    {createAppointment.isPending ? "Saving…" : "Book Appointment"}
                  </Button>
                </div>
              )}

              {!appointmentsQ.data || appointmentsQ.data.length === 0 ? (
                <p className="text-xs text-muted-foreground">No appointments yet.</p>
              ) : (
                <div className="space-y-2">
                  {appointmentsQ.data.map(appt => (
                    <div key={appt.id} className="flex items-start justify-between p-2.5 rounded-lg border border-[#e2e6ed] bg-white text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="font-semibold text-[#0f2044] text-sm">{appt.title}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                            appt.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                            appt.status === "CANCELLED" ? "bg-red-100 text-red-600" :
                            appt.status === "NO_SHOW" ? "bg-orange-100 text-orange-700" :
                            "bg-blue-100 text-blue-700"
                          }`}>
                            {appt.status}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {appt.type} · {formatDate(appt.scheduledAt)}
                          {appt.location && ` · ${appt.location}`}
                        </div>
                        {appt.notes && <div className="text-xs text-slate-500 mt-0.5 truncate">{appt.notes}</div>}
                      </div>
                      <div className="flex items-center gap-1.5 ml-2 shrink-0">
                        {appt.status === "SCHEDULED" && (
                          <>
                            <button
                              onClick={() => updateApptStatus.mutate({ id: appt.id, contactId: id, status: "COMPLETED" })}
                              className="text-xs text-green-600 hover:text-green-700 font-bold"
                              title="Mark complete"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => updateApptStatus.mutate({ id: appt.id, contactId: id, status: "CANCELLED" })}
                              className="text-xs text-orange-500 hover:text-orange-700 font-bold"
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => deleteAppointment.mutate({ id: appt.id, contactId: id })}
                          className="text-xs text-red-400 hover:text-red-600"
                          title="Delete"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* -- Attachments -- */}
          <Card className="border border-[#e2e6ed] shadow-none">
            <CardHeader className="pb-0 pt-4 px-4">
              <div className="flex items-center justify-between">
                <SectionTitle>Attachments ({attachmentsQ.data?.length ?? 0})</SectionTitle>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadAttachment.isPending}
                  className="text-xs text-[#0f2044] hover:underline font-semibold disabled:opacity-50"
                >
                  {uploadAttachment.isPending ? "Uploading…" : "+ Upload File"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {!attachmentsQ.data || attachmentsQ.data.length === 0 ? (
                <div
                  className="border-2 border-dashed border-[#e2e6ed] rounded-lg p-6 text-center cursor-pointer hover:border-[#0f2044]/40 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-2xl mb-1">📎</div>
                  <div className="text-xs text-muted-foreground">
                    Click to upload a file<br />
                    <span className="text-[10px]">Pre-approval letters, ID, contracts, etc. (max 10 MB)</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {attachmentsQ.data.map(att => (
                    <div key={att.id} className="flex items-center justify-between p-2.5 rounded-lg border border-[#e2e6ed] bg-white">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg shrink-0">📄</span>
                        <div className="min-w-0">
                          <a
                            href={att.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-[#0f2044] hover:underline truncate block"
                          >
                            {att.filename}
                          </a>
                          <div className="text-xs text-muted-foreground">
                            {formatBytes(att.sizeBytes)} · {formatDateShort(att.createdAt)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteAttachment.mutate({ id: att.id, contactId: id })}
                        className="text-xs text-red-400 hover:text-red-600 ml-2 shrink-0"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <div
                    className="border border-dashed border-[#e2e6ed] rounded-lg p-2 text-center cursor-pointer hover:border-[#0f2044]/40 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span className="text-xs text-muted-foreground">+ Upload another file</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* -- Contracts -- */}
          <Card className="border border-[#e2e6ed] shadow-none">
            <CardHeader className="pb-0 pt-4 px-4">
              <div className="flex items-center justify-between">
                <SectionTitle>Contracts ({contractsQ.data?.length ?? 0})</SectionTitle>
                <button
                  onClick={() => { setEditingContractId(null); setContractTitle("Purchase Agreement"); setContractPrice(""); setContractAddress(""); setContractDate(""); setContractStatus("PENDING"); setContractNotes(""); setShowContractForm(v => !v); }}
                  className="text-[11px] font-semibold text-[#0f2044] hover:text-[#1a3a6e] transition-colors"
                >
                  {showContractForm && editingContractId === null ? "Cancel" : "+ Add Contract"}
                </button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {showContractForm && (
                <div className="space-y-2 mb-4 p-3 bg-[#f8f9fc] rounded-lg border border-[#e2e6ed]">
                  <div className="text-[11px] font-bold text-[#0f2044] mb-2">{editingContractId !== null ? "Edit Contract" : "New Contract"}</div>
                  <Input placeholder="Title (e.g. Purchase Agreement)" value={contractTitle} onChange={e => setContractTitle(e.target.value)} className="h-8 text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Purchase Price ($)" type="number" value={contractPrice} onChange={e => setContractPrice(e.target.value)} className="h-8 text-sm" />
                    <Input placeholder="Contract Date" type="date" value={contractDate} onChange={e => setContractDate(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <Input placeholder="Lot / Address" value={contractAddress} onChange={e => setContractAddress(e.target.value)} className="h-8 text-sm" />
                  <Select value={contractStatus} onValueChange={v => setContractStatus(v as any)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="EXECUTED">Executed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea placeholder="Notes (optional)" value={contractNotes} onChange={e => setContractNotes(e.target.value)} className="text-sm min-h-[60px]" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleContractSubmit} disabled={createContract.isPending || updateContract.isPending} className="bg-[#0f2044] text-white hover:bg-[#1a3a6e] h-7 text-xs">
                      {createContract.isPending || updateContract.isPending ? "Saving…" : editingContractId !== null ? "Update" : "Save Contract"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setShowContractForm(false); setEditingContractId(null); }} className="h-7 text-xs">Cancel</Button>
                  </div>
                </div>
              )}
              {contractsQ.data && contractsQ.data.length > 0 ? (
                <div className="space-y-2">
                  {contractsQ.data.map(c => (
                    <div key={c.id} className="p-3 rounded-lg border border-[#e2e6ed] bg-white">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-[#0f2044]">{c.title}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              c.status === "EXECUTED" ? "bg-green-100 text-green-700" :
                              c.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                              "bg-amber-100 text-amber-700"
                            }`}>{c.status}</span>
                          </div>
                          {c.purchasePrice && <div className="text-sm text-[#0f2044] font-medium mt-0.5">${c.purchasePrice.toLocaleString()}</div>}
                          {c.lotAddress && <div className="text-xs text-muted-foreground mt-0.5">{c.lotAddress}</div>}
                          {c.contractDate && <div className="text-xs text-muted-foreground">{formatDateShort(c.contractDate)}</div>}
                          {c.notes && <div className="text-xs text-muted-foreground mt-1 italic">{c.notes}</div>}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => startEditContract(c)} className="text-[10px] text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                          <span className="text-muted-foreground text-[10px]">·</span>
                          <button onClick={() => deleteContract.mutate({ id: c.id, contactId: id })} className="text-[10px] text-red-500 hover:text-red-700 font-medium">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground py-2">No contracts yet. Click + Add Contract to create one.</div>
              )}
            </CardContent>
          </Card>

          {/* -- Add Note -- */}
          <Card className="border border-[#e2e6ed] shadow-none">
            <CardHeader className="pb-2 pt-4 px-4">
              <SectionTitle>Add Note</SectionTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
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

          {/* -- Activity Log -- */}
          <Card className="border border-[#e2e6ed] shadow-none">
            <CardHeader className="pb-2 pt-4 px-4">
              <SectionTitle>Activity Log ({activity.length})</SectionTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
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

          {/* -- Email History -- */}
          <Card className="border border-[#e2e6ed] shadow-none">
            <CardHeader className="pb-2 pt-4 px-4">
              <SectionTitle>Email History ({emails.length})</SectionTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
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
