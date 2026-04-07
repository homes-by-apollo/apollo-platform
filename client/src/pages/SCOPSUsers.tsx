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

export default function SCOPSUsers() {
  const [, setLocation] = useLocation();
  const notify = (title: string, description?: string) => {
    console.log(`[${title}]`, description ?? "");
  };

  const { data: adminUser, isLoading: authLoading } = trpc.adminAuth.me.useQuery();
  const { data: admins, isLoading: adminsLoading, refetch } = trpc.adminAuth.listAdmins.useQuery(
    undefined,
    { enabled: !!adminUser }
  );

  const logoutMutation = trpc.adminAuth.logout.useMutation({
    onSuccess: () => setLocation("/admin-login"),
  });
  const addAdminMutation = trpc.adminAuth.addAdmin.useMutation({
    onSuccess: () => {
      notify("Admin added", `${addForm.name} can now log in.`);
      setAddOpen(false);
      setAddForm({ email: "", name: "", password: "" });
      refetch();
    },
    onError: (e) => notify("Error", e.message),
  });
  const changePasswordMutation = trpc.adminAuth.changeAdminPassword.useMutation({
    onSuccess: () => {
      notify("Password updated", "The password has been changed.");
      setPwOpen(false);
      setPwForm({ email: "", newPassword: "" });
    },
    onError: (e) => notify("Error", e.message),
  });
  const deleteAdminMutation = trpc.adminAuth.deleteAdmin.useMutation({
    onSuccess: () => {
      notify("Admin removed");
      setDeleteTarget(null);
      refetch();
    },
    onError: (e) => notify("Error", e.message),
  });

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", name: "", password: "" });
  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ email: "", newPassword: "" });
  const [deleteTarget, setDeleteTarget] = useState<{ email: string; name: string } | null>(null);

  if (!authLoading && !adminUser) {
    setLocation("/admin-login");
    return null;
  }

  const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.65)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.80)",
    borderRadius: 16,
    boxShadow: "0 4px 20px rgba(100,130,200,0.10)",
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const inputCls = "bg-white/70 border-white/80 text-[#0f2044] placeholder:text-[#0f2044]/30 focus:border-blue-300";

  return (
    <div className="scops-bg min-h-screen" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif" }}>
      <SCOPSNav adminUser={{ name: adminUser?.name ?? "" }} currentPage="users" />

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "rgba(15,32,68,0.90)" }}>Admin Users</h1>
            <p className="text-sm mt-0.5" style={{ color: "rgba(15,32,68,0.50)" }}>
              Manage who can access the Apollo SCOPS dashboard.
            </p>
          </div>
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-[#0f2044] hover:bg-[#1a3366] text-white font-semibold shadow-sm"
          >
            + Add Admin
          </Button>
        </div>

        {adminsLoading ? (
          <div className="text-sm" style={{ color: "rgba(15,32,68,0.40)" }}>Loading…</div>
        ) : (
          <div className="space-y-3">
            {(admins ?? []).map((admin) => (
              <div key={admin.email} style={cardStyle}>
                <div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #4a90d9 0%, #2563eb 100%)" }}
                    >
                      {(admin.name || "A")[0].toUpperCase()}
                    </div>
                    <span className="font-semibold" style={{ color: "rgba(15,32,68,0.90)" }}>{admin.name}</span>
                    {admin.email === adminUser?.email && (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">You</Badge>
                    )}
                  </div>
                  <div className="text-sm mt-1 ml-10" style={{ color: "rgba(15,32,68,0.55)" }}>{admin.email}</div>
                  <div className="text-xs mt-0.5 ml-10" style={{ color: "rgba(15,32,68,0.35)" }}>
                    Added {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setPwForm({ email: admin.email, newPassword: "" }); setPwOpen(true); }}
                    style={{ padding: "6px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, background: "rgba(255,255,255,0.70)", border: "1px solid rgba(255,255,255,0.85)", color: "rgba(15,32,68,0.70)", cursor: "pointer" }}
                  >
                    Change Password
                  </button>
                  {admin.email !== adminUser?.email && (
                    <button
                      onClick={() => setDeleteTarget({ email: admin.email, name: admin.name })}
                      style={{ padding: "6px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "rgba(185,28,28,0.85)", cursor: "pointer" }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Admin Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-white/90 backdrop-blur-xl border-white/80 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#0f2044]">Add Admin User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-[#0f2044]/60 uppercase tracking-wide mb-1 block">Full Name</label>
              <Input placeholder="e.g. Sarah" value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#0f2044]/60 uppercase tracking-wide mb-1 block">Email Address</label>
              <Input type="email" placeholder="sarah@apollohomebuilders.com" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#0f2044]/60 uppercase tracking-wide mb-1 block">Temporary Password</label>
              <Input type="password" placeholder="Min. 8 characters" value={addForm.password} onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="border-gray-200 text-gray-600">Cancel</Button>
            <Button
              onClick={() => addAdminMutation.mutate(addForm)}
              disabled={addAdminMutation.isPending || !addForm.email || !addForm.name || addForm.password.length < 8}
              className="bg-[#0f2044] hover:bg-[#1a3366] text-white font-semibold"
            >
              {addAdminMutation.isPending ? "Adding…" : "Add Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="bg-white/90 backdrop-blur-xl border-white/80 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#0f2044]">Remove Admin</DialogTitle>
          </DialogHeader>
          <p className="text-[#0f2044]/60 text-sm py-2">
            Are you sure you want to remove <span className="text-[#0f2044] font-semibold">{deleteTarget?.name}</span> ({deleteTarget?.email})? They will immediately lose access to the CRM.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="border-gray-200 text-gray-600">Cancel</Button>
            <Button
              onClick={() => deleteTarget && deleteAdminMutation.mutate({ email: deleteTarget.email })}
              disabled={deleteAdminMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {deleteAdminMutation.isPending ? "Removing…" : "Remove Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
