import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function CRMUsers() {
  const [, setLocation] = useLocation();
  // Simple notification helper
  const notify = (title: string, description?: string) => {
    // Use browser alert as fallback; can be replaced with a toast library later
    console.log(`[${title}]`, description ?? "");
  };

  // Auth check
  const { data: adminUser, isLoading: authLoading } = trpc.adminAuth.me.useQuery();

  // Admin list
  const { data: admins, isLoading: adminsLoading, refetch } = trpc.adminAuth.listAdmins.useQuery(
    undefined,
    { enabled: !!adminUser }
  );

  // Mutations
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

  // Add admin dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", name: "", password: "" });

  // Change password dialog
  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ email: "", newPassword: "" });

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ email: string; name: string } | null>(null);

  // Redirect if not authenticated
  if (!authLoading && !adminUser) {
    setLocation("/admin-login");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      {/* Top Nav */}
      <div className="bg-[#0f2044] border-b border-white/10 px-6 py-3 flex items-center gap-4">
        <button
          onClick={() => setLocation("/")}
          className="text-white/60 hover:text-white text-sm transition-colors"
        >
          ← Site
        </button>
        <span className="text-white/30">|</span>
        <button
          onClick={() => setLocation("/crm")}
          className="text-white/60 hover:text-white text-sm transition-colors"
        >
          Dashboard
        </button>
        <span className="text-white/30">|</span>
        <button
          onClick={() => setLocation("/crm/properties")}
          className="text-white/60 hover:text-white text-sm transition-colors"
        >
          Properties
        </button>
        <span className="text-white/30">|</span>
        <button
          onClick={() => setLocation("/crm/blog")}
          className="text-white/60 hover:text-white text-sm transition-colors"
        >
          Blog Posts
        </button>
        <span className="text-white/30">|</span>
        <span className="text-white font-semibold text-sm">Admin Users</span>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-white/60">{adminUser?.name}</span>
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
            {adminUser?.name?.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="text-xs text-white/50 hover:text-white border border-white/20 hover:border-white/50 rounded px-2 py-1 transition-colors"
          >
            {logoutMutation.isPending ? "…" : "Sign Out"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Users</h1>
            <p className="text-white/50 text-sm mt-1">
              Manage who can access the Apollo CRM dashboard.
            </p>
          </div>
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-[#c9a84c] hover:bg-[#b8973e] text-[#0f2044] font-semibold"
          >
            + Add Admin
          </Button>
        </div>

        {adminsLoading ? (
          <div className="text-white/40 text-sm">Loading…</div>
        ) : (
          <div className="space-y-3">
            {(admins ?? []).map((admin) => (
              <Card key={admin.email} className="bg-[#0f2044] border-white/10">
                <CardContent className="flex items-center justify-between py-4 px-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{admin.name}</span>
                      {admin.email === adminUser?.email && (
                        <Badge className="bg-[#c9a84c]/20 text-[#c9a84c] border-[#c9a84c]/30 text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                    <div className="text-white/50 text-sm">{admin.email}</div>
                    <div className="text-white/30 text-xs mt-0.5">
                      Added {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/20 text-white/70 hover:text-white hover:border-white/50 bg-transparent text-xs"
                      onClick={() => {
                        setPwForm({ email: admin.email, newPassword: "" });
                        setPwOpen(true);
                      }}
                    >
                      Change Password
                    </Button>
                    {admin.email !== adminUser?.email && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/30 text-red-400 hover:text-red-300 hover:border-red-400 bg-transparent text-xs"
                        onClick={() => setDeleteTarget({ email: admin.email, name: admin.name })}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Admin Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-[#0f2044] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Add Admin User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm text-white/70 mb-1 block">Full Name</label>
              <Input
                placeholder="e.g. Sarah"
                value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/30"
              />
            </div>
            <div>
              <label className="text-sm text-white/70 mb-1 block">Email Address</label>
              <Input
                type="email"
                placeholder="sarah@apollohomebuilders.com"
                value={addForm.email}
                onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/30"
              />
            </div>
            <div>
              <label className="text-sm text-white/70 mb-1 block">Temporary Password</label>
              <Input
                type="password"
                placeholder="Min. 8 characters"
                value={addForm.password}
                onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/30"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="border-white/20 text-white/70 bg-transparent">
              Cancel
            </Button>
            <Button
              onClick={() => addAdminMutation.mutate(addForm)}
              disabled={addAdminMutation.isPending || !addForm.email || !addForm.name || addForm.password.length < 8}
              className="bg-[#c9a84c] hover:bg-[#b8973e] text-[#0f2044] font-semibold"
            >
              {addAdminMutation.isPending ? "Adding…" : "Add Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent className="bg-[#0f2044] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-white/60 text-sm">
              Setting new password for <span className="text-white font-medium">{pwForm.email}</span>
            </p>
            <div>
              <label className="text-sm text-white/70 mb-1 block">New Password</label>
              <Input
                type="password"
                placeholder="Min. 8 characters"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/30"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwOpen(false)} className="border-white/20 text-white/70 bg-transparent">
              Cancel
            </Button>
            <Button
              onClick={() => changePasswordMutation.mutate(pwForm)}
              disabled={changePasswordMutation.isPending || pwForm.newPassword.length < 8}
              className="bg-[#c9a84c] hover:bg-[#b8973e] text-[#0f2044] font-semibold"
            >
              {changePasswordMutation.isPending ? "Saving…" : "Save Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="bg-[#0f2044] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Remove Admin</DialogTitle>
          </DialogHeader>
          <p className="text-white/70 text-sm py-2">
            Are you sure you want to remove <span className="text-white font-semibold">{deleteTarget?.name}</span> ({deleteTarget?.email})? They will immediately lose access to the CRM.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="border-white/20 text-white/70 bg-transparent">
              Cancel
            </Button>
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
