import { useState } from "react";
import SCOPSNav from "@/components/SCOPSNav";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────
type AutomationStatus = "Active" | "Inactive" | "Needs Attention";
type TemplateType = "Email" | "Task" | "SMS";
type ViewMode = "automations" | "templates";

interface Automation {
  id: number;
  name: string;
  trigger: string;
  actionCount: number;
  status: AutomationStatus;
  lastRun: string;
  updatedBy: string;
  enabled: boolean;
}

interface Template {
  id: number;
  name: string;
  type: TemplateType;
  description: string;
  subject?: string;
  body: string;
  status: "Active" | "Inactive";
}

// ── Seed data ─────────────────────────────────────────────────────────────────
const INITIAL_AUTOMATIONS: Automation[] = [
  { id: 1, name: "Open Escrow", trigger: "Stage changes → Under Contract", actionCount: 4, status: "Active", lastRun: "2 hours ago", updatedBy: "Kyle", enabled: true },
  { id: 2, name: "New Lead Welcome", trigger: "Lead created", actionCount: 2, status: "Active", lastRun: "18 min ago", updatedBy: "Kyle", enabled: true },
  { id: 3, name: "Deals At Risk", trigger: "No activity → 48 hours", actionCount: 3, status: "Active", lastRun: "1 day ago", updatedBy: "Brandon", enabled: true },
  { id: 4, name: "Tour Reminder", trigger: "Appointment scheduled", actionCount: 2, status: "Inactive", lastRun: "3 days ago", updatedBy: "Kyle", enabled: false },
  { id: 5, name: "Offer Follow-Up", trigger: "Stage changes → Offer Submitted", actionCount: 2, status: "Needs Attention", lastRun: "Failed 4h ago", updatedBy: "Kyle", enabled: true },
  { id: 6, name: "Post-Close Check-In", trigger: "Stage changes → Closed", actionCount: 1, status: "Active", lastRun: "5 days ago", updatedBy: "Jonathan", enabled: true },
];

const INITIAL_TEMPLATES: Template[] = [
  { id: 1, name: "Open Escrow", type: "Email", description: "Kick off escrow when a deal goes under contract", subject: "Your Escrow is Now Open – {propertyAddress}", body: "Hi {buyerName},\n\nGreat news — your escrow is now open for {propertyAddress}. Your escrow officer {escrowOfficerName} will be in touch within 24 hours.\n\nIf you have any questions, reply to this email or call us at (775) 363-1616.\n\nWarm regards,\n{agentName}\nApollo Home Builders", status: "Active" },
  { id: 2, name: "New Lead Welcome", type: "Email", description: "Welcome email when a new lead is created", subject: "Welcome to Apollo Home Builders, {buyerName}!", body: "Hi {buyerName},\n\nThank you for reaching out to Apollo Home Builders. We're excited to help you find your dream home in Pahrump, Nevada.\n\nI'll be in touch within 24 hours to learn more about what you're looking for.\n\nBest,\n{agentName}", status: "Active" },
  { id: 3, name: "Follow Up After 48 Hours", type: "Task", description: "Re-engage leads that haven't responded", body: "Follow up with {buyerName} — no response in 48 hours. Try a different channel (call, text, or email). Check if their contact info is correct.", status: "Active" },
  { id: 4, name: "Tour Confirmation", type: "SMS", description: "Remind buyers about scheduled tours", body: "Hi {buyerName}! Just confirming your home tour at {propertyAddress} tomorrow. Reply YES to confirm or call (775) 363-1616 to reschedule. – Apollo Home Builders", status: "Active" },
  { id: 5, name: "Offer Submitted", type: "Email", description: "Notify buyer when their offer is submitted", subject: "Your Offer Has Been Submitted – {propertyAddress}", body: "Hi {buyerName},\n\nYour offer for {propertyAddress} has been officially submitted. We'll keep you updated on the seller's response.\n\nExpected response time: 24–48 hours.\n\n{agentName}", status: "Active" },
];

const MERGE_TAGS = ["{buyerName}", "{propertyAddress}", "{agentName}", "{lenderName}", "{escrowOfficerName}"];

const POPULAR_TEMPLATES = [
  { name: "Open Escrow", desc: "Automatically kick off escrow when a deal goes under contract" },
  { name: "New Lead Welcome", desc: "Send a welcome email when a new lead is created" },
  { name: "Follow Up After 48 Hours", desc: "Re-engage leads that haven't responded" },
  { name: "Tour Reminder", desc: "Remind buyers about scheduled tours" },
];

// ── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: AutomationStatus }) {
  const cfg = {
    "Active": { bg: "#dcfce7", text: "#15803d" },
    "Inactive": { bg: "#f3f4f6", text: "#6b7280" },
    "Needs Attention": { bg: "#fef3c7", text: "#b45309" },
  }[status];
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: cfg.bg, color: cfg.text, whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      style={{
        width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer",
        background: enabled ? "#3b82f6" : "#d1d5db",
        position: "relative", transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 2, left: enabled ? 18 : 2,
        width: 16, height: 16, borderRadius: "50%", background: "white",
        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

// ── Overview card ─────────────────────────────────────────────────────────────
function OverviewCard({ value, label, sub, accent }: { value: string | number; label: string; sub: string; accent?: string }) {
  return (
    <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px 22px", flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color: accent ?? "#111827", lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#9ca3af" }}>{sub}</div>
    </div>
  );
}

// ── Template editor panel ─────────────────────────────────────────────────────
function TemplateEditor({ template, onClose, onSave }: { template: Template | null; onClose: () => void; onSave: (t: Template) => void }) {
  const [form, setForm] = useState<Template>(template ?? { id: Date.now(), name: "", type: "Email", description: "", subject: "", body: "", status: "Active" });
  const isNew = !template;
  const charCount = form.body.length;

  function insertTag(tag: string) {
    setForm(f => ({ ...f, body: f.body + tag }));
  }

  return (
    <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>{isNew ? "New Template" : form.name}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 18, lineHeight: 1 }}>×</button>
      </div>

      {/* Metadata */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>Template Name</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }}
            placeholder="e.g. Welcome Email"
          />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>Template Type</label>
          <select
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value as TemplateType }))}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none", background: "white" }}
          >
            <option value="Email">Email</option>
            <option value="Task">Task</option>
            <option value="SMS">SMS</option>
          </select>
        </div>
      </div>

      {/* Status toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Toggle enabled={form.status === "Active"} onChange={v => setForm(f => ({ ...f, status: v ? "Active" : "Inactive" }))} />
        <span style={{ fontSize: 12, fontWeight: 600, color: form.status === "Active" ? "#15803d" : "#9ca3af" }}>{form.status}</span>
      </div>

      {/* Email-specific fields */}
      {form.type === "Email" && (
        <>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>Subject Line</label>
            <input
              value={form.subject ?? ""}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none" }}
              placeholder="e.g. Your Tour is Confirmed – {propertyAddress}"
            />
          </div>
        </>
      )}

      {/* Task-specific fields */}
      {form.type === "Task" && (
        <div style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#6b7280" }}>
          Task templates create a follow-up task in the lead's activity log. The body below is the task description.
        </div>
      )}

      {/* Body */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>
          {form.type === "Email" ? "Email Body" : form.type === "SMS" ? "Message Body" : "Task Description"}
        </label>
        <textarea
          value={form.body}
          onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
          rows={6}
          style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
          placeholder="Write your template content here…"
        />
        {form.type === "SMS" && (
          <div style={{ fontSize: 11, color: charCount > 160 ? "#ef4444" : "#9ca3af", textAlign: "right", marginTop: 4 }}>
            {charCount} / 160 characters
          </div>
        )}
      </div>

      {/* Merge tags */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 8 }}>Merge Tags — click to insert</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {MERGE_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => insertTag(tag)}
              style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, border: "1px solid #e5e7eb", background: "#f9fafb", color: "#374151", cursor: "pointer", fontFamily: "monospace" }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
        <button
          onClick={onClose}
          style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #e5e7eb", background: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#374151" }}
        >
          Cancel
        </button>
        <button
          onClick={() => { toast.info("Duplicate created"); onSave({ ...form, id: Date.now(), name: form.name + " (Copy)" }); }}
          style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #e5e7eb", background: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#374151" }}
        >
          Duplicate
        </button>
        <button
          onClick={() => { onSave(form); toast.success("Template saved"); }}
          style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "#3b82f6", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", flex: 1 }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SCOPSEngine() {
  const adminMeQuery = trpc.adminAuth.me.useQuery();
  const adminUser = adminMeQuery.data;
  if (!adminUser) {
    return (
      <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 14, color: "#9ca3af" }}>Loading…</div>
      </div>
    );
  }

  const [view, setView] = useState<ViewMode>("automations");
  const [automations, setAutomations] = useState<Automation[]>(INITIAL_AUTOMATIONS);
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null | undefined>(undefined); // undefined = closed, null = new
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateTypeFilter, setTemplateTypeFilter] = useState<string>("All");

  // Stats
  const activeCount = automations.filter(a => a.status === "Active").length;
  const issueCount = automations.filter(a => a.status === "Needs Attention").length;
  const runsToday = 23;

  // Filtered automations
  const filteredAutos = automations.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.trigger.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Filtered templates
  const filteredTemplates = templates.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(templateSearch.toLowerCase());
    const matchType = templateTypeFilter === "All" || t.type === templateTypeFilter;
    return matchSearch && matchType;
  });

  function toggleAutomation(id: number) {
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled, status: !a.enabled ? "Active" : "Inactive" } : a));
  }

  function saveTemplate(t: Template) {
    setTemplates(prev => {
      const idx = prev.findIndex(x => x.id === t.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = t; return next; }
      return [...prev, t];
    });
    setSelectedTemplate(undefined);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', sans-serif" }}>
      <SCOPSNav adminUser={{ name: adminUser.name, adminRole: (adminUser as any).adminRole }} currentPage="engine" />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>

        {/* ── Page header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827", margin: 0, marginBottom: 4 }}>Engine</h1>
            <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>Rules and templates that run your workflow automatically</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => { setView("templates"); setSelectedTemplate(null); }}
              style={{ padding: "10px 18px", borderRadius: 9, border: "1px solid #e5e7eb", background: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#374151" }}
            >
              + New Template
            </button>
            <button
              onClick={() => toast.info("Automation builder — coming soon")}
              style={{ padding: "10px 18px", borderRadius: 9, border: "none", background: "#3b82f6", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              + New Automation
            </button>
          </div>
        </div>

        {/* ── Overview cards ── */}
        <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
          <OverviewCard value={activeCount} label="Active Automations" sub="2 added this month" />
          <OverviewCard value={templates.length} label="Templates" sub="Email, task, and SMS" />
          <OverviewCard value={runsToday} label="Runs Today" sub="Last run 18 min ago" />
          <OverviewCard value={issueCount} label="Issues" sub={issueCount > 0 ? `${issueCount} automation needs attention` : "All automations healthy"} accent={issueCount > 0 ? "#b45309" : undefined} />
        </div>

        {/* ── View toggle ── */}
        <div style={{ display: "flex", gap: 2, marginBottom: 20, background: "#f3f4f6", borderRadius: 10, padding: 3, width: "fit-content" }}>
          {(["automations", "templates"] as ViewMode[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: "7px 20px", borderRadius: 8, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 600, transition: "all 0.15s",
                background: view === v ? "white" : "transparent",
                color: view === v ? "#111827" : "#6b7280",
                boxShadow: view === v ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {/* ── AUTOMATIONS VIEW ── */}
        {view === "automations" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Automations list */}
            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f3f4f6", flexWrap: "wrap", gap: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Automations</span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search automations…"
                    style={{ fontSize: 12, padding: "7px 12px", border: "1px solid #e5e7eb", borderRadius: 8, outline: "none", color: "#374151", background: "#fafafa", width: 180 }}
                  />
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    style={{ fontSize: 12, padding: "7px 12px", border: "1px solid #e5e7eb", borderRadius: 8, outline: "none", background: "white", color: "#374151" }}
                  >
                    {["All", "Active", "Inactive", "Needs Attention"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                      {["Automation Name", "Trigger", "Actions", "Status", "Last Run", "Updated By", ""].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAutos.length === 0 ? (
                      <tr><td colSpan={7} style={{ padding: "32px 16px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>No automations match your search.</td></tr>
                    ) : filteredAutos.map(a => (
                      <tr
                        key={a.id}
                        style={{ borderBottom: "1px solid #f9fafb", transition: "background 0.1s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ fontWeight: 700, color: "#111827" }}>{a.name}</span>
                        </td>
                        <td style={{ padding: "14px 16px", color: "#6b7280", maxWidth: 220 }}>{a.trigger}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#eff6ff", color: "#3b82f6", fontWeight: 600 }}>
                            {a.actionCount} action{a.actionCount !== 1 ? "s" : ""}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px" }}><StatusPill status={a.status} /></td>
                        <td style={{ padding: "14px 16px", color: "#9ca3af", whiteSpace: "nowrap" }}>{a.lastRun}</td>
                        <td style={{ padding: "14px 16px", color: "#6b7280" }}>{a.updatedBy}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <Toggle enabled={a.enabled} onChange={() => toggleAutomation(a.id)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Popular templates section */}
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 14 }}>Popular Automation Templates</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
                {POPULAR_TEMPLATES.map(t => (
                  <div
                    key={t.name}
                    style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5, flex: 1 }}>{t.desc}</div>
                    <button
                      onClick={() => { toast.success(`"${t.name}" template added`); }}
                      style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #3b82f6", background: "white", color: "#3b82f6", fontSize: 12, fontWeight: 700, cursor: "pointer", alignSelf: "flex-start" }}
                    >
                      Use Template
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TEMPLATES VIEW ── */}
        {view === "templates" && (
          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, alignItems: "start" }}>
            {/* Left panel */}
            <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #f3f4f6" }}>
                <input
                  value={templateSearch}
                  onChange={e => setTemplateSearch(e.target.value)}
                  placeholder="Search templates…"
                  style={{ width: "100%", padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, outline: "none", boxSizing: "border-box" }}
                />
                <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                  {["All", "Email", "Task", "SMS"].map(f => (
                    <button
                      key={f}
                      onClick={() => setTemplateTypeFilter(f)}
                      style={{
                        fontSize: 11, padding: "4px 10px", borderRadius: 20, border: "1px solid",
                        borderColor: templateTypeFilter === f ? "#3b82f6" : "#e5e7eb",
                        background: templateTypeFilter === f ? "#eff6ff" : "white",
                        color: templateTypeFilter === f ? "#3b82f6" : "#6b7280",
                        cursor: "pointer", fontWeight: 600,
                      }}
                    >{f}</button>
                  ))}
                </div>
              </div>
              <div>
                {filteredTemplates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t)}
                    style={{
                      width: "100%", textAlign: "left", padding: "12px 16px", border: "none",
                      borderBottom: "1px solid #f9fafb", cursor: "pointer",
                      background: selectedTemplate?.id === t.id ? "#eff6ff" : "white",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={e => { if (selectedTemplate?.id !== t.id) (e.currentTarget.style.background = "#f9fafb"); }}
                    onMouseLeave={e => { if (selectedTemplate?.id !== t.id) (e.currentTarget.style.background = "white"); }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 2 }}>{t.name}</div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: "#f3f4f6", color: "#6b7280", fontWeight: 600 }}>{t.type}</span>
                      <span style={{ fontSize: 10, color: t.status === "Active" ? "#15803d" : "#9ca3af", fontWeight: 600 }}>{t.status}</span>
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => setSelectedTemplate(null)}
                  style={{ width: "100%", padding: "12px 16px", border: "none", borderTop: "1px solid #f3f4f6", background: "white", cursor: "pointer", color: "#3b82f6", fontSize: 13, fontWeight: 600, textAlign: "left" }}
                >
                  + New Template
                </button>
              </div>
            </div>

            {/* Right panel */}
            {selectedTemplate !== undefined ? (
              <TemplateEditor
                template={selectedTemplate}
                onClose={() => setSelectedTemplate(undefined)}
                onSave={saveTemplate}
              />
            ) : (
              <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, padding: "48px 24px", textAlign: "center", color: "#9ca3af" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Select a template to edit</div>
                <div style={{ fontSize: 13 }}>Or click "+ New Template" to create one</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
