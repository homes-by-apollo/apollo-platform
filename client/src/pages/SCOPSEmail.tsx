import { useState } from "react";
import { trpc } from "@/lib/trpc";
import SCOPSNav from "@/components/SCOPSNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Mail, Users, BarChart2, Plus, Trash2, Send, Eye, ChevronDown, ChevronUp, ExternalLink, BookOpen, Bell, MapPin, Search, Home } from "lucide-react";

// ─── Lead Magnet List Metadata ────────────────────────────────────────────────

const LEAD_MAGNET_LISTS = [
  {
    id: 1,
    name: "Buyer's Guide",
    icon: BookOpen,
    color: "#c8a96e",
    bg: "rgba(200,169,110,0.12)",
    border: "rgba(200,169,110,0.25)",
    url: "/pahrump-home-buyers-guide",
    description: "Downloaded the 2026 Pahrump Home Buyer's Guide",
  },
  {
    id: 2,
    name: "Listing Alerts",
    icon: Bell,
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.12)",
    border: "rgba(96,165,250,0.25)",
    url: "/listing-alerts",
    description: "Signed up for new listing alerts",
  },
  {
    id: 3,
    name: "Pahrump vs Las Vegas",
    icon: MapPin,
    color: "#34d399",
    bg: "rgba(52,211,153,0.12)",
    border: "rgba(52,211,153,0.25)",
    url: "/pahrump-vs-las-vegas",
    description: "Requested the Pahrump vs Las Vegas comparison report",
  },
  {
    id: 4,
    name: "Free Lot Analysis",
    icon: Search,
    color: "#f472b6",
    bg: "rgba(244,114,182,0.12)",
    border: "rgba(244,114,182,0.25)",
    url: "/free-lot-analysis",
    description: "Submitted a lot for free analysis",
  },
  {
    id: 5,
    name: "Floor Plans",
    icon: Home,
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.12)",
    border: "rgba(167,139,250,0.25)",
    url: "/floor-plans",
    description: "Requested a floor plan PDF",
  },
];

type Tab = "lists" | "campaigns" | "analytics";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  scheduled: "bg-blue-100 text-blue-700",
  sending: "bg-yellow-100 text-yellow-700",
  sent: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function SCOPSEmail() {
  const adminMeQuery = trpc.adminAuth.me.useQuery();
  const adminUser = adminMeQuery.data;
  const [activeTab, setActiveTab] = useState<Tab>("lists");

  if (adminMeQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0f1923 0%, #1a2d3d 100%)" }}>
        <p className="text-sm" style={{ color: "#64748b" }}>Loading...</p>
      </div>
    );
  }
  if (!adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0f1923 0%, #1a2d3d 100%)" }}>
        <p className="text-sm" style={{ color: "#64748b" }}>Access denied.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0f1923 0%, #1a2d3d 100%)" }}>
      <SCOPSNav adminUser={{ name: adminUser.name, adminRole: (adminUser as any).adminRole }} currentPage="email" />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Email Marketing</h1>
            <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
              Manage lists, campaigns, and track performance
            </p>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 mb-8 p-1 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", width: "fit-content" }}>
          {([
            { id: "lists", label: "Lists", icon: Users },
            { id: "campaigns", label: "Campaigns", icon: Mail },
            { id: "analytics", label: "Analytics", icon: BarChart2 },
          ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all"
              style={{
                background: activeTab === id ? "rgba(200,169,110,0.15)" : "transparent",
                color: activeTab === id ? "#c8a96e" : "#94a3b8",
                border: activeTab === id ? "1px solid rgba(200,169,110,0.3)" : "1px solid transparent",
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "lists" && <ListsTab />}
        {activeTab === "campaigns" && <CampaignsTab />}
        {activeTab === "analytics" && <AnalyticsTab />}
      </div>
    </div>
  );
}

// ─── Lists Tab ────────────────────────────────────────────────────────────────

function ListsTab() {
  const utils = trpc.useUtils();
  const { data: lists = [], isLoading } = trpc.email.getLists.useQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedList, setSelectedList] = useState<number | null>(null);
  const [newListName, setNewListName] = useState("");
  const [newListDesc, setNewListDesc] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const createList = trpc.email.createList.useMutation({
    onSuccess: () => {
      utils.email.getLists.invalidate();
      setShowCreate(false);
      setNewListName("");
      setNewListDesc("");
      setIsDefault(false);
      toast.success("List created");
    },
  });

  const deleteList = trpc.email.deleteList.useMutation({
    onSuccess: () => {
      utils.email.getLists.invalidate();
      if (selectedList) setSelectedList(null);
      toast.success("List deleted");
    },
  });

  // Get member counts for lead magnet lists
  const leadMagnetListsWithCounts = LEAD_MAGNET_LISTS.map((lm) => ({
    ...lm,
    memberCount: lists.find((l) => l.id === lm.id)?.memberCount ?? 0,
  }));

  return (
    <div className="space-y-8">
      {/* Lead Magnet Lists Overview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Lead Magnet Lists</h2>
            <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>Each list auto-populates when a visitor opts in on the corresponding page</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          {leadMagnetListsWithCounts.map((lm) => {
            const Icon = lm.icon;
            return (
              <button
                key={lm.id}
                onClick={() => setSelectedList(selectedList === lm.id ? null : lm.id)}
                className="text-left rounded-xl p-4 transition-all hover:scale-[1.02]"
                style={{
                  background: selectedList === lm.id ? lm.bg : "rgba(255,255,255,0.04)",
                  border: selectedList === lm.id ? `1px solid ${lm.border}` : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: lm.bg, border: `1px solid ${lm.border}` }}>
                    <Icon size={15} style={{ color: lm.color }} />
                  </div>
                  <a
                    href={lm.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="transition-opacity hover:opacity-100 opacity-40"
                    style={{ color: "#94a3b8" }}
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
                <div className="text-2xl font-bold text-white mb-0.5">{lm.memberCount}</div>
                <div className="text-xs font-semibold" style={{ color: lm.color }}>{lm.name}</div>
                <div className="text-xs mt-1 leading-relaxed" style={{ color: "#64748b" }}>{lm.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* All Lists — sidebar + members panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* List sidebar */}
      <div className="lg:col-span-1">
        <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Lists</h2>
            <Button
              size="sm"
              onClick={() => setShowCreate(true)}
              style={{ background: "rgba(200,169,110,0.15)", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)" }}
            >
              <Plus size={14} className="mr-1" /> New List
            </Button>
          </div>
          {isLoading ? (
            <div className="text-sm text-center py-8" style={{ color: "#64748b" }}>Loading...</div>
          ) : lists.length === 0 ? (
            <div className="text-sm text-center py-8" style={{ color: "#64748b" }}>No lists yet. Create one to get started.</div>
          ) : (
            <div className="space-y-2">
              {lists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => setSelectedList(selectedList === list.id ? null : list.id)}
                  className="w-full text-left rounded-lg px-3 py-3 transition-all"
                  style={{
                    background: selectedList === list.id ? "rgba(200,169,110,0.12)" : "rgba(255,255,255,0.03)",
                    border: selectedList === list.id ? "1px solid rgba(200,169,110,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{list.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)", color: "#94a3b8" }}>
                      {list.memberCount}
                    </span>
                  </div>
                  {list.description && (
                    <p className="text-xs mt-1 truncate" style={{ color: "#64748b" }}>{list.description}</p>
                  )}
                  {list.isDefault === 1 && (
                    <span className="text-xs mt-1 inline-block" style={{ color: "#c8a96e" }}>Auto-add new leads</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Members panel */}
      <div className="lg:col-span-2">
        {selectedList ? (
          <MembersPanel
            listId={selectedList}
            listName={lists.find((l) => l.id === selectedList)?.name ?? ""}
            onDelete={() => deleteList.mutate({ id: selectedList })}
          />
        ) : (
          <div className="rounded-xl flex items-center justify-center h-64" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)" }}>
            <p className="text-sm" style={{ color: "#64748b" }}>Select a list to view members</p>
          </div>
        )}
      </div>

      {/* Create List Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent style={{ background: "#1a2d3d", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}>
          <DialogHeader>
            <DialogTitle className="text-white">Create Email List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm" style={{ color: "#94a3b8" }}>List Name *</Label>
              <Input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="e.g. All Leads, Hot Prospects"
                className="mt-1"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
              />
            </div>
            <div>
              <Label className="text-sm" style={{ color: "#94a3b8" }}>Description</Label>
              <Input
                value={newListDesc}
                onChange={(e) => setNewListDesc(e.target.value)}
                placeholder="Optional description"
                className="mt-1"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="isDefault" className="text-sm cursor-pointer" style={{ color: "#94a3b8" }}>
                Auto-add all new leads to this list
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} style={{ borderColor: "rgba(255,255,255,0.15)", color: "#94a3b8" }}>
              Cancel
            </Button>
            <Button
              onClick={() => createList.mutate({ name: newListName, description: newListDesc, isDefault })}
              disabled={!newListName.trim() || createList.isPending}
              style={{ background: "#c8a96e", color: "#0f1923" }}
            >
              {createList.isPending ? "Creating..." : "Create List"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}

function MembersPanel({ listId, listName, onDelete }: { listId: number; listName: string; onDelete: () => void }) {
  const utils = trpc.useUtils();
  const { data: members = [], isLoading } = trpc.email.getMembers.useQuery({ listId });
  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");

  const addMember = trpc.email.addMember.useMutation({
    onSuccess: () => {
      utils.email.getMembers.invalidate({ listId });
      utils.email.getLists.invalidate();
      setShowAdd(false);
      setNewEmail("");
      setNewName("");
      toast.success("Member added");
    },
  });

  const removeMember = trpc.email.removeMember.useMutation({
    onSuccess: () => {
      utils.email.getMembers.invalidate({ listId });
      utils.email.getLists.invalidate();
      toast.success("Member removed");
    },
  });

  return (
    <div className="rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div>
          <h2 className="text-sm font-semibold text-white">{listName}</h2>
          <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{members.length} members</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => setShowAdd(true)}
            style={{ background: "rgba(200,169,110,0.15)", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)" }}
          >
            <Plus size={14} className="mr-1" /> Add Member
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDelete}
            style={{ borderColor: "rgba(239,68,68,0.3)", color: "#ef4444", background: "rgba(239,68,68,0.08)" }}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
      <div className="overflow-auto max-h-96">
        {isLoading ? (
          <div className="text-sm text-center py-8" style={{ color: "#64748b" }}>Loading members...</div>
        ) : members.length === 0 ? (
          <div className="text-sm text-center py-8" style={{ color: "#64748b" }}>No members yet. Add some to get started.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <TableHead style={{ color: "#64748b" }}>Email</TableHead>
                <TableHead style={{ color: "#64748b" }}>Name</TableHead>
                <TableHead style={{ color: "#64748b" }}>Source</TableHead>
                <TableHead style={{ color: "#64748b" }}>Subscribed</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id} style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  <TableCell className="text-sm text-white">{m.email}</TableCell>
                  <TableCell className="text-sm" style={{ color: "#94a3b8" }}>{m.name ?? "—"}</TableCell>
                  <TableCell>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}>
                      {m.source ?? "manual"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs" style={{ color: "#64748b" }}>
                    {new Date(m.subscribedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => removeMember.mutate({ listId, email: m.email })}
                      className="text-xs hover:text-red-400 transition-colors"
                      style={{ color: "#64748b" }}
                    >
                      Remove
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent style={{ background: "#1a2d3d", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}>
          <DialogHeader>
            <DialogTitle className="text-white">Add Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm" style={{ color: "#94a3b8" }}>Email *</Label>
              <Input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@example.com"
                className="mt-1"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
              />
            </div>
            <div>
              <Label className="text-sm" style={{ color: "#94a3b8" }}>Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Optional"
                className="mt-1"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)} style={{ borderColor: "rgba(255,255,255,0.15)", color: "#94a3b8" }}>
              Cancel
            </Button>
            <Button
              onClick={() => addMember.mutate({ listId, email: newEmail, name: newName || undefined })}
              disabled={!newEmail.trim() || addMember.isPending}
              style={{ background: "#c8a96e", color: "#0f1923" }}
            >
              {addMember.isPending ? "Adding..." : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Campaigns Tab ────────────────────────────────────────────────────────────

function CampaignsTab() {
  const utils = trpc.useUtils();
  const { data: campaigns = [], isLoading } = trpc.email.getCampaigns.useQuery();
  const { data: lists = [] } = trpc.email.getLists.useQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [previewId, setPreviewId] = useState<number | null>(null);

  const [form, setForm] = useState({
    listId: "",
    subject: "",
    previewText: "",
    fromName: "Apollo Home Builders",
    fromEmail: "hello@apollohomebuilders.com",
    htmlBody: "",
  });

  const createCampaign = trpc.email.createCampaign.useMutation({
    onSuccess: () => {
      utils.email.getCampaigns.invalidate();
      setShowCreate(false);
      setForm({ listId: "", subject: "", previewText: "", fromName: "Apollo Home Builders", fromEmail: "hello@apollohomebuilders.com", htmlBody: "" });
      toast.success("Campaign saved as draft");
    },
  });

  const sendCampaign = trpc.email.sendCampaign.useMutation({
    onSuccess: (data) => {
      utils.email.getCampaigns.invalidate();
      utils.email.getOverallStats.invalidate();
      toast.success(`Campaign sent to ${data.sent} recipients`);
    },
    onError: (err) => toast.error(`Send failed: ${err.message}`),
  });

  const deleteCampaign = trpc.email.deleteCampaign.useMutation({
    onSuccess: () => {
      utils.email.getCampaigns.invalidate();
      toast.success("Campaign deleted");
    },
    onError: (err) => toast.error(`Cannot delete: ${err.message}`),
  });

  const previewCampaign = campaigns.find((c) => c.id === previewId);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Campaigns</h2>
        <Button
          onClick={() => setShowCreate(true)}
          style={{ background: "rgba(200,169,110,0.15)", color: "#c8a96e", border: "1px solid rgba(200,169,110,0.3)" }}
        >
          <Plus size={14} className="mr-1" /> New Campaign
        </Button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {isLoading ? (
          <div className="text-sm text-center py-12" style={{ color: "#64748b" }}>Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="text-sm text-center py-12" style={{ color: "#64748b" }}>No campaigns yet. Create your first one.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <TableHead style={{ color: "#64748b" }}>Subject</TableHead>
                <TableHead style={{ color: "#64748b" }}>List</TableHead>
                <TableHead style={{ color: "#64748b" }}>Status</TableHead>
                <TableHead style={{ color: "#64748b" }}>Recipients</TableHead>
                <TableHead style={{ color: "#64748b" }}>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id} style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  <TableCell className="text-sm text-white font-medium">{c.subject}</TableCell>
                  <TableCell className="text-sm" style={{ color: "#94a3b8" }}>
                    {lists.find((l) => l.id === c.listId)?.name ?? `List #${c.listId}`}
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[c.status ?? "draft"]}`}>
                      {c.status ?? "draft"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm" style={{ color: "#94a3b8" }}>
                    {c.totalRecipients ?? 0}
                  </TableCell>
                  <TableCell className="text-xs" style={{ color: "#64748b" }}>
                    {new Date(c.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewId(c.id)}
                        className="text-xs hover:text-blue-400 transition-colors"
                        style={{ color: "#64748b" }}
                        title="Preview"
                      >
                        <Eye size={14} />
                      </button>
                      {(c.status === "draft") && (
                        <button
                          onClick={() => {
                            if (confirm(`Send "${c.subject}" now? This cannot be undone.`)) {
                              sendCampaign.mutate({ campaignId: c.id, origin: window.location.origin });
                            }
                          }}
                          className="text-xs hover:text-green-400 transition-colors"
                          style={{ color: "#64748b" }}
                          title="Send now"
                        >
                          <Send size={14} />
                        </button>
                      )}
                      {(c.status === "draft") && (
                        <button
                          onClick={() => {
                            if (confirm("Delete this campaign?")) {
                              deleteCampaign.mutate({ id: c.id });
                            }
                          }}
                          className="text-xs hover:text-red-400 transition-colors"
                          style={{ color: "#64748b" }}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create Campaign Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl" style={{ background: "#1a2d3d", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}>
          <DialogHeader>
            <DialogTitle className="text-white">New Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm" style={{ color: "#94a3b8" }}>Send To List *</Label>
                <Select value={form.listId} onValueChange={(v) => setForm((f) => ({ ...f, listId: v }))}>
                  <SelectTrigger className="mt-1" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}>
                    <SelectValue placeholder="Select a list" />
                  </SelectTrigger>
                  <SelectContent style={{ background: "#1a2d3d", border: "1px solid rgba(255,255,255,0.12)" }}>
                    {lists.map((l) => (
                      <SelectItem key={l.id} value={String(l.id)} style={{ color: "white" }}>
                        {l.name} ({l.memberCount} members)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm" style={{ color: "#94a3b8" }}>From Name</Label>
                <Input
                  value={form.fromName}
                  onChange={(e) => setForm((f) => ({ ...f, fromName: e.target.value }))}
                  className="mt-1"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
                />
              </div>
            </div>
            <div>
              <Label className="text-sm" style={{ color: "#94a3b8" }}>Subject Line *</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="Your email subject line"
                className="mt-1"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
              />
            </div>
            <div>
              <Label className="text-sm" style={{ color: "#94a3b8" }}>Preview Text</Label>
              <Input
                value={form.previewText}
                onChange={(e) => setForm((f) => ({ ...f, previewText: e.target.value }))}
                placeholder="Short preview shown in inbox (optional)"
                className="mt-1"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
              />
            </div>
            <div>
              <Label className="text-sm" style={{ color: "#94a3b8" }}>
                Email Body (HTML or plain text) *
              </Label>
              <p className="text-xs mt-0.5 mb-1" style={{ color: "#64748b" }}>
                Use <code style={{ color: "#c8a96e" }}>{"{{UNSUBSCRIBE_URL}}"}</code> to insert the unsubscribe link.
              </p>
              <Textarea
                value={form.htmlBody}
                onChange={(e) => setForm((f) => ({ ...f, htmlBody: e.target.value }))}
                placeholder="<p>Hello,</p><p>We have exciting news about our new homes...</p><p><a href='{{UNSUBSCRIBE_URL}}'>Unsubscribe</a></p>"
                rows={8}
                className="mt-1 font-mono text-xs"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} style={{ borderColor: "rgba(255,255,255,0.15)", color: "#94a3b8" }}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                createCampaign.mutate({
                  listId: Number(form.listId),
                  subject: form.subject,
                  previewText: form.previewText || undefined,
                  fromName: form.fromName,
                  fromEmail: form.fromEmail,
                  htmlBody: form.htmlBody,
                })
              }
              disabled={!form.listId || !form.subject.trim() || !form.htmlBody.trim() || createCampaign.isPending}
              style={{ background: "#c8a96e", color: "#0f1923" }}
            >
              {createCampaign.isPending ? "Saving..." : "Save as Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      {previewCampaign && (
        <Dialog open={!!previewId} onOpenChange={() => setPreviewId(null)}>
          <DialogContent className="max-w-2xl" style={{ background: "#1a2d3d", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}>
            <DialogHeader>
              <DialogTitle className="text-white">Preview: {previewCampaign.subject}</DialogTitle>
            </DialogHeader>
            <div
              className="rounded-lg overflow-auto max-h-96 p-4"
              style={{ background: "white" }}
              dangerouslySetInnerHTML={{ __html: previewCampaign.htmlBody }}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewId(null)} style={{ borderColor: "rgba(255,255,255,0.15)", color: "#94a3b8" }}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────

function AnalyticsTab() {
  const { data: overall } = trpc.email.getOverallStats.useQuery();
  const { data: campaignStats = [] } = trpc.email.getCampaignStats.useQuery({});
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const kpis = [
    { label: "Total Sent", value: overall?.totalSent ?? 0, color: "#60a5fa" },
    { label: "Opened", value: overall?.totalOpened ?? 0, sub: `${overall?.openRate ?? 0}%`, color: "#34d399" },
    { label: "Clicked", value: overall?.totalClicked ?? 0, sub: `${overall?.clickRate ?? 0}%`, color: "#c8a96e" },
    { label: "Bounced", value: overall?.totalBounced ?? 0, sub: `${overall?.bounceRate ?? 0}%`, color: "#f87171" },
    { label: "Unsubscribes", value: overall?.totalUnsubscribes ?? 0, color: "#94a3b8" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl p-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "#64748b" }}>{kpi.label}</p>
            <p className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value.toLocaleString()}</p>
            {kpi.sub && <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{kpi.sub} rate</p>}
          </div>
        ))}
      </div>

      {/* Per-Campaign Breakdown */}
      <div className="rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Campaign Performance</h2>
        </div>
        {campaignStats.length === 0 ? (
          <div className="text-sm text-center py-12" style={{ color: "#64748b" }}>No sent campaigns yet.</div>
        ) : (
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            {campaignStats.map((stat) => (
              <div key={stat.campaignId}>
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                  onClick={() => setExpandedId(expandedId === stat.campaignId ? null : stat.campaignId)}
                >
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">{stat.subject}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                      {stat.sentAt ? new Date(stat.sentAt).toLocaleDateString() : "—"} · {stat.total} recipients
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p className="text-sm font-bold" style={{ color: "#34d399" }}>{stat.openRate}%</p>
                      <p className="text-xs" style={{ color: "#64748b" }}>Open</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: "#c8a96e" }}>{stat.clickRate}%</p>
                      <p className="text-xs" style={{ color: "#64748b" }}>Click</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: "#f87171" }}>{stat.bounceRate}%</p>
                      <p className="text-xs" style={{ color: "#64748b" }}>Bounce</p>
                    </div>
                    {expandedId === stat.campaignId ? (
                      <ChevronUp size={16} style={{ color: "#64748b" }} />
                    ) : (
                      <ChevronDown size={16} style={{ color: "#64748b" }} />
                    )}
                  </div>
                </button>
                {expandedId === stat.campaignId && (
                  <div className="px-4 pb-4">
                    <div className="grid grid-cols-4 gap-3 mt-2">
                      {[
                        { label: "Sent", value: stat.sent, color: "#60a5fa" },
                        { label: "Opened", value: stat.opened, color: "#34d399" },
                        { label: "Clicked", value: stat.clicked, color: "#c8a96e" },
                        { label: "Bounced", value: stat.bounced, color: "#f87171" },
                        { label: "Failed", value: stat.failed, color: "#94a3b8" },
                        { label: "Unsubscribed", value: stat.unsubscribed, color: "#94a3b8" },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-lg px-3 py-2 text-center"
                          style={{ background: "rgba(255,255,255,0.04)" }}
                        >
                          <p className="text-lg font-bold" style={{ color: item.color }}>{item.value}</p>
                          <p className="text-xs" style={{ color: "#64748b" }}>{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
