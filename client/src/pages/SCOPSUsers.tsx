import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import SCOPSNav from "@/components/SCOPSNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";

type AdminRole = "super_admin" | "admin" | "marketing" | "sales";

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  marketing: "Marketing",
  sales: "Sales",
};

const ROLE_COLORS: Record<AdminRole, { bg: string; text: string; border: string }> = {
  super_admin: { bg: "rgba(139,92,246,0.12)", text: "rgba(109,40,217,0.90)", border: "rgba(139,92,246,0.30)" },
  admin:       { bg: "rgba(59,130,246,0.12)", text: "rgba(29,78,216,0.90)",  border: "rgba(59,130,246,0.30)" },
  marketing:   { bg: "rgba(16,185,129,0.12)", text: "rgba(4,120,87,0.90)",   border: "rgba(16,185,129,0.30)" },
  sales:       { bg: "rgba(245,158,11,0.12)", text: "rgba(180,83,9,0.90)",   border: "rgba(245,158,11,0.30)" },
};

const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: ["Full system access", "Manage all users", "View all data", "Edit settings"],
  admin:       ["CRM access", "Manage leads", "View reports", "Add/edit properties"],
  marketing:   ["UTM builder", "View leads", "Content management", "Campaign analytics"],
  sales:       ["Pipeline access", "Lead management", "Schedule tours", "View properties"],
};

function RoleBadge({ role }: { role: AdminRole }) {
  const c = ROLE_COLORS[role];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

function InitialsAvatar({ name, role }: { name: string; role: AdminRole }) {
  const gradients: Record<AdminRole, string> = {
    super_admin: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
    admin:       "linear-gradient(135deg, #4a90d9 0%, #2563eb 100%)",
    marketing:   "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    sales:       "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
  };
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
      style={{ background: gradients[role] }}
    >
      {(name || "A")[0].toUpperCase()}
    </div>
  );
}

export default function SCOPSUsers() {
  const [, setLocation] = useLocation();

  const { data: adminUser, isLoading: authLoading } = trpc.adminAuth.me.useQuery();
  const { data: admins, isLoading: adminsLoading, refetch } = trpc.adminAuth.listAdmins.useQuery(
    undefined,
    { enabled: !!adminUser }
  );

  const addAdminMutation = trpc.adminAuth.addAdmin.useMutation({
    onSuccess: () => {
      toast.success(`${addForm.name} added as ${ROLE_LABELS[addForm.role as AdminRole]}`);
      setAddOpen(false);
      setAddForm({ email: "", name: "", password: "", role: "admin" });
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const changePasswordMutation = trpc.adminAuth.changeAdminPassword.useMutation({
    onSuccess: () => {
      toast.success("Password updated successfully");
      setPwOpen(false);
      setPwForm({ email: "", newPassword: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteAdminMutation = trpc.adminAuth.deleteAdmin.useMutation({
    onSuccess: () => {
      toast.success("User removed from SCOPS");
      setDeleteTarget(null);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateRoleMutation = trpc.adminAuth.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", name: "", password: "", role: "admin" });
  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ email: "", newPassword: "" });
  const [deleteTarget, setDeleteTarget] = useState<{ email: string; name: string } | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  if (!authLoading && !adminUser) {
    setLocation("/admin-login");
    return null;
  }

  const selectedAdmin = admins?.find(a => a.email === selectedUser);

  const glassCard: React.CSSProperties = {
    background: "rgba(255,255,255,0.65)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.80)",
    borderRadius: 16,
    boxShadow: "0 4px 20px rgba(100,130,200,0.10)",
  };

  const inputCls = "bg-white/70 border-white/80 text-[#0f2044] placeholder:text-[#0f2044]/30 focus:border-blue-300";

  return (
    <div
      className="scops-bg min-h-screen"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif" }}
    >
      <SCOPSNav adminUser={{ name: adminUser?.name ?? "" }} currentPage="users" />

      <div className="flex h-[calc(100vh-56px)]">
        {/* ── Left: User List ── */}
        <div className="w-80 flex-shrink-0 p-5 flex flex-col gap-4 overflow-y-auto border-r" style={{ borderColor: "rgba(255,255,255,0.50)" }}>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight" style={{ color: "rgba(15,32,68,0.90)" }}>Team Access</h1>
              <p className="text-xs mt-0.5" style={{ color: "rgba(15,32,68,0.45)" }}>
                {admins?.length ?? 0} member{admins?.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", boxShadow: "0 2px 8px rgba(37,99,235,0.30)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              Invite
            </button>
          </div>

          {/* Role filter pills */}
          <div className="flex flex-wrap gap-1.5">
            {(["super_admin", "admin", "marketing", "sales"] as AdminRole[]).map(role => {
              const count = admins?.filter(a => (a.adminRole ?? "admin") === role).length ?? 0;
              const c = ROLE_COLORS[role];
              return (
                <span key={role} className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                  {ROLE_LABELS[role]} · {count}
                </span>
              );
            })}
          </div>

          {/* User list */}
          {adminsLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.40)" }} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {(admins ?? []).map((admin) => {
                const role = (admin.adminRole ?? "admin") as AdminRole;
                const isSelected = selectedUser === admin.email;
                const isYou = admin.email === adminUser?.email;
                return (
                  <button
                    key={admin.email}
                    onClick={() => setSelectedUser(isSelected ? null : admin.email)}
                    className="w-full text-left p-3 rounded-2xl transition-all"
                    style={{
                      background: isSelected ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.50)",
                      border: isSelected ? "1px solid rgba(255,255,255,0.95)" : "1px solid rgba(255,255,255,0.65)",
                      boxShadow: isSelected ? "0 4px 16px rgba(100,130,200,0.18)" : "none",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <InitialsAvatar name={admin.name} role={role} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold truncate" style={{ color: "rgba(15,32,68,0.90)" }}>{admin.name}</span>
                          {isYou && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 font-semibold">You</span>}
                        </div>
                        <div className="text-[11px] truncate mt-0.5" style={{ color: "rgba(15,32,68,0.45)" }}>{admin.email}</div>
                      </div>
                      <RoleBadge role={role} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right: Inspector Panel ── */}
        <div className="flex-1 p-6 overflow-y-auto">
          {selectedAdmin ? (
            <div className="max-w-xl space-y-5">
              {/* Profile card */}
              <div style={{ ...glassCard, padding: "24px" }}>
                <div className="flex items-start gap-4">
                  <InitialsAvatar name={selectedAdmin.name} role={(selectedAdmin.adminRole ?? "admin") as AdminRole} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold" style={{ color: "rgba(15,32,68,0.90)" }}>{selectedAdmin.name}</h2>
                      {selectedAdmin.email === adminUser?.email && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-semibold">You</span>
                      )}
                    </div>
                    <div className="text-sm mt-0.5" style={{ color: "rgba(15,32,68,0.55)" }}>{selectedAdmin.email}</div>
                    <div className="mt-2">
                      <RoleBadge role={(selectedAdmin.adminRole ?? "admin") as AdminRole} />
                    </div>
                    <div className="text-xs mt-2" style={{ color: "rgba(15,32,68,0.35)" }}>
                      Member since {selectedAdmin.createdAt ? new Date(selectedAdmin.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Role management */}
              <div style={{ ...glassCard, padding: "20px" }}>
                <h3 className="text-sm font-bold mb-3" style={{ color: "rgba(15,32,68,0.80)" }}>Role & Permissions</h3>
                <div className="flex items-center gap-3 mb-4">
                  <Select
                    value={selectedAdmin.adminRole ?? "admin"}
                    onValueChange={(val) => {
                      if (selectedAdmin.email === adminUser?.email) {
                        toast.error("You cannot change your own role");
                        return;
                      }
                      updateRoleMutation.mutate({ email: selectedAdmin.email, role: val as AdminRole });
                    }}
                    disabled={selectedAdmin.email === adminUser?.email || updateRoleMutation.isPending}
                  >
                    <SelectTrigger className="w-44 bg-white/70 border-white/80 text-[#0f2044]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                    </SelectContent>
                  </Select>
                  {updateRoleMutation.isPending && (
                    <span className="text-xs" style={{ color: "rgba(15,32,68,0.40)" }}>Saving…</span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {ROLE_PERMISSIONS[(selectedAdmin.adminRole ?? "admin") as AdminRole].map(perm => (
                    <div key={perm} className="flex items-center gap-2 text-sm" style={{ color: "rgba(15,32,68,0.65)" }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#10b981", flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
                      {perm}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ ...glassCard, padding: "20px" }}>
                <h3 className="text-sm font-bold mb-3" style={{ color: "rgba(15,32,68,0.80)" }}>Account Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setPwForm({ email: selectedAdmin.email, newPassword: "" }); setPwOpen(true); }}
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                    style={{ background: "rgba(255,255,255,0.70)", border: "1px solid rgba(255,255,255,0.85)", color: "rgba(15,32,68,0.70)" }}
                  >
                    Change Password
                  </button>
                  {selectedAdmin.email !== adminUser?.email && (
                    <button
                      onClick={() => setDeleteTarget({ email: selectedAdmin.email, name: selectedAdmin.name })}
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "rgba(185,28,28,0.85)" }}
                    >
                      Remove User
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center" style={{ color: "rgba(15,32,68,0.35)" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-40">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <p className="text-sm font-medium">Select a team member to view details</p>
              <p className="text-xs mt-1 opacity-60">Click any user in the list to inspect their role and permissions</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Add Admin Dialog ── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-white/90 backdrop-blur-xl border-white/80 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#0f2044]">Invite Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-[#0f2044]/60 uppercase tracking-wide mb-1 block">Full Name</label>
              <Input placeholder="e.g. Sarah Johnson" value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#0f2044]/60 uppercase tracking-wide mb-1 block">Email Address</label>
              <Input type="email" placeholder="sarah@apollohomebuilders.com" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#0f2044]/60 uppercase tracking-wide mb-1 block">Role</label>
              <Select value={addForm.role} onValueChange={(val) => setAddForm(f => ({ ...f, role: val }))}>
                <SelectTrigger className={inputCls}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin — Full system access</SelectItem>
                  <SelectItem value="admin">Admin — CRM + properties + reports</SelectItem>
                  <SelectItem value="marketing">Marketing — UTM + content + analytics</SelectItem>
                  <SelectItem value="sales">Sales — Pipeline + leads + tours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#0f2044]/60 uppercase tracking-wide mb-1 block">Temporary Password</label>
              <Input type="password" placeholder="Min. 8 characters" value={addForm.password} onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="border-gray-200 text-gray-600">Cancel</Button>
            <Button
              onClick={() => addAdminMutation.mutate({ email: addForm.email, name: addForm.name, password: addForm.password })}
              disabled={addAdminMutation.isPending || !addForm.email || !addForm.name || addForm.password.length < 8}
              className="bg-[#0f2044] hover:bg-[#1a3366] text-white font-semibold"
            >
              {addAdminMutation.isPending ? "Adding…" : "Add Team Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Change Password Dialog ── */}
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent className="bg-white/90 backdrop-blur-xl border-white/80 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#0f2044]">Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-[#0f2044]/60 text-sm">
              Setting new password for <span className="text-[#0f2044] font-medium">{pwForm.email}</span>
            </p>
            <div>
              <label className="text-xs font-semibold text-[#0f2044]/60 uppercase tracking-wide mb-1 block">New Password</label>
              <Input type="password" placeholder="Min. 8 characters" value={pwForm.newPassword} onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwOpen(false)} className="border-gray-200 text-gray-600">Cancel</Button>
            <Button
              onClick={() => changePasswordMutation.mutate(pwForm)}
              disabled={changePasswordMutation.isPending || pwForm.newPassword.length < 8}
              className="bg-[#0f2044] hover:bg-[#1a3366] text-white font-semibold"
            >
              {changePasswordMutation.isPending ? "Saving…" : "Save Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="bg-white/90 backdrop-blur-xl border-white/80 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#0f2044]">Remove Team Member</DialogTitle>
          </DialogHeader>
          <p className="text-[#0f2044]/60 text-sm py-2">
            Are you sure you want to remove <span className="text-[#0f2044] font-semibold">{deleteTarget?.name}</span>? They will immediately lose access to SCOPS.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="border-gray-200 text-gray-600">Cancel</Button>
            <Button
              onClick={() => deleteTarget && deleteAdminMutation.mutate({ email: deleteTarget.email })}
              disabled={deleteAdminMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {deleteAdminMutation.isPending ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
