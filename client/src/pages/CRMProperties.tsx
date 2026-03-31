import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type PropertyType = "HOME" | "LOT";
type TagType = "Available" | "Coming Soon" | "Sold" | "Under Contract";

interface PropertyForm {
  propertyType: PropertyType;
  tag: TagType;
  address: string;
  city: string;
  state: string;
  price: string;
  priceValue: string;
  beds: string;
  baths: string;
  sqft: string;
  lotSize: string;
  utilities: string;
  imageUrl: string;
  featured: boolean;
  sortOrder: string;
  description: string;
}

const EMPTY_FORM: PropertyForm = {
  propertyType: "HOME",
  tag: "Available",
  address: "",
  city: "Pahrump",
  state: "NV",
  price: "",
  priceValue: "",
  beds: "",
  baths: "",
  sqft: "",
  lotSize: "",
  utilities: "",
  imageUrl: "",
  featured: false,
  sortOrder: "0",
  description: "",
};

const TAG_COLORS: Record<TagType, string> = {
  Available: "bg-green-100 text-green-700 border-green-200",
  "Coming Soon": "bg-blue-100 text-blue-700 border-blue-200",
  Sold: "bg-gray-100 text-gray-600 border-gray-200",
  "Under Contract": "bg-amber-100 text-amber-700 border-amber-200",
};

// ─── Property Form Modal ──────────────────────────────────────────────────────

function PropertyModal({
  initial,
  onClose,
  onSave,
  saving,
}: {
  initial: PropertyForm;
  onClose: () => void;
  onSave: (form: PropertyForm) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<PropertyForm>(initial);
  const set = (field: keyof PropertyForm, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-[#0f2044]">
            {initial.address ? "Edit Listing" : "Add Listing"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Type + Tag row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Type</label>
              <Select value={form.propertyType} onValueChange={v => set("propertyType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOME">Home</SelectItem>
                  <SelectItem value="LOT">Lot</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Status Tag</label>
              <Select value={form.tag} onValueChange={v => set("tag", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Coming Soon">Coming Soon</SelectItem>
                  <SelectItem value="Sold">Sold</SelectItem>
                  <SelectItem value="Under Contract">Under Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Address *</label>
            <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="123 Desert Rose Dr" />
          </div>

          {/* City + State */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">City</label>
              <Input value={form.city} onChange={e => set("city", e.target.value)} placeholder="Pahrump" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">State</label>
              <Input value={form.state} onChange={e => set("state", e.target.value)} placeholder="NV" />
            </div>
          </div>

          {/* Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Display Price *</label>
              <Input value={form.price} onChange={e => set("price", e.target.value)} placeholder="$489,000" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Price (numeric, for sorting)</label>
              <Input type="number" value={form.priceValue} onChange={e => set("priceValue", e.target.value)} placeholder="489000" />
            </div>
          </div>

          {/* Home-specific */}
          {form.propertyType === "HOME" && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Beds</label>
                <Input type="number" value={form.beds} onChange={e => set("beds", e.target.value)} placeholder="3" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Baths</label>
                <Input type="number" value={form.baths} onChange={e => set("baths", e.target.value)} placeholder="2" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Sq Ft</label>
                <Input value={form.sqft} onChange={e => set("sqft", e.target.value)} placeholder="1,800" />
              </div>
            </div>
          )}

          {/* Lot-specific */}
          {form.propertyType === "LOT" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Lot Size</label>
                <Input value={form.lotSize} onChange={e => set("lotSize", e.target.value)} placeholder="0.25 Acres" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Utilities</label>
                <Input value={form.utilities} onChange={e => set("utilities", e.target.value)} placeholder="Water · Electric · Sewer" />
              </div>
            </div>
          )}

          {/* Image URL */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Primary Image URL</label>
            <Input value={form.imageUrl} onChange={e => set("imageUrl", e.target.value)} placeholder="https://cdn.example.com/photo.jpg" />
            {form.imageUrl && (
              <img src={form.imageUrl} alt="preview" className="mt-2 h-24 w-full object-cover rounded-lg border" />
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Description</label>
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              rows={3}
              placeholder="Brief description of the property…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* Sort Order + Featured */}
          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Sort Order</label>
              <Input type="number" value={form.sortOrder} onChange={e => set("sortOrder", e.target.value)} placeholder="0" />
            </div>
            <div className="flex items-center gap-3 pb-1">
              <button
                type="button"
                onClick={() => set("featured", !form.featured)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${form.featured ? "bg-[#0f2044]" : "bg-gray-200"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.featured ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <span className="text-sm font-semibold text-[#0f2044]">Featured on Homepage</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            onClick={() => onSave(form)}
            disabled={saving || !form.address || !form.price}
            className="bg-[#0f2044] hover:bg-[#1a3366]"
          >
            {saving ? "Saving…" : "Save Listing"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({ address, onCancel, onConfirm, deleting }: {
  address: string;
  onCancel: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-lg font-bold text-[#0f2044] mb-2">Delete Listing?</h2>
        <p className="text-sm text-gray-600 mb-6">
          This will permanently remove <span className="font-semibold">{address}</span> from the database.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={deleting}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CRMProperties() {
  const adminMeQuery = trpc.adminAuth.me.useQuery();
  const adminUser = adminMeQuery.data;
  const loading = adminMeQuery.isLoading;
  const logoutMutation = trpc.adminAuth.logout.useMutation({
    onSuccess: () => { window.location.href = "/admin-login"; },
  });
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [tagFilter, setTagFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const propertiesQuery = trpc.properties.getAll.useQuery(
    typeFilter !== "ALL" ? { propertyType: typeFilter as PropertyType } : undefined
  );

  const createMutation = trpc.properties.create.useMutation({
    onSuccess: () => { utils.properties.getAll.invalidate(); toast.success("Listing created"); setEditingId(null); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.properties.update.useMutation({
    onSuccess: () => { utils.properties.getAll.invalidate(); toast.success("Listing updated"); setEditingId(null); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.properties.delete.useMutation({
    onSuccess: () => { utils.properties.getAll.invalidate(); toast.success("Listing deleted"); setDeletingId(null); },
    onError: (e) => toast.error(e.message),
  });

  const toggleFeatured = trpc.properties.update.useMutation({
    onMutate: async ({ id, data }) => {
      await utils.properties.getAll.cancel();
      const prev = utils.properties.getAll.getData();
      utils.properties.getAll.setData(undefined, old =>
        old?.map(p => p.id === id ? { ...p, featured: data.featured ?? p.featured } : p)
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => { utils.properties.getAll.setData(undefined, ctx?.prev); toast.error("Failed to update"); },
    onSettled: () => utils.properties.getAll.invalidate(),
  });

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-slate-50"><div className="text-sm text-muted-foreground">Loading…</div></div>;
  }

  if (!adminUser) {
    window.location.href = "/admin-login";
    return <div className="flex items-center justify-center min-h-screen bg-slate-50"><div className="text-sm text-muted-foreground">Redirecting to login…</div></div>;
  }

  const properties = propertiesQuery.data ?? [];
  const filtered = properties.filter(p => {
    if (tagFilter !== "ALL" && p.tag !== tagFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.address.toLowerCase().includes(q) || p.city.toLowerCase().includes(q);
    }
    return true;
  });

  const featuredCount = properties.filter(p => p.featured === 1).length;
  const homeCount = properties.filter(p => p.propertyType === "HOME").length;
  const lotCount = properties.filter(p => p.propertyType === "LOT").length;
  const availableCount = properties.filter(p => p.tag === "Available").length;

  // Build form from existing property for editing
  const getEditForm = (id: number): PropertyForm => {
    const p = properties.find(x => x.id === id);
    if (!p) return EMPTY_FORM;
    return {
      propertyType: p.propertyType as PropertyType,
      tag: p.tag as TagType,
      address: p.address,
      city: p.city,
      state: p.state,
      price: p.price,
      priceValue: p.priceValue?.toString() ?? "",
      beds: p.beds?.toString() ?? "",
      baths: p.baths?.toString() ?? "",
      sqft: p.sqft ?? "",
      lotSize: p.lotSize ?? "",
      utilities: p.utilities ?? "",
      imageUrl: p.imageUrl ?? "",
      featured: p.featured === 1,
      sortOrder: p.sortOrder?.toString() ?? "0",
      description: p.description ?? "",
    };
  };

  const handleSave = (form: PropertyForm) => {
    const payload = {
      propertyType: form.propertyType,
      tag: form.tag,
      address: form.address,
      city: form.city,
      state: form.state,
      price: form.price,
      priceValue: form.priceValue ? parseInt(form.priceValue) : undefined,
      beds: form.beds ? parseInt(form.beds) : undefined,
      baths: form.baths ? parseInt(form.baths) : undefined,
      sqft: form.sqft || undefined,
      lotSize: form.lotSize || undefined,
      utilities: form.utilities || undefined,
      imageUrl: form.imageUrl || undefined,
      featured: form.featured ? 1 : 0,
      sortOrder: parseInt(form.sortOrder) || 0,
      description: form.description || undefined,
    };

    if (editingId === "new") {
      createMutation.mutate(payload);
    } else if (typeof editingId === "number") {
      updateMutation.mutate({ id: editingId, data: payload });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-[#0f2044] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => window.location.href = "/"} className="text-white/60 hover:text-white text-sm transition-colors">← Site</button>
          <span className="text-white/30">|</span>
          <button onClick={() => window.location.href = "/crm"} className="text-white/60 hover:text-white text-sm transition-colors">CRM Dashboard</button>
          <span className="text-white/30">|</span>
          <span className="font-bold tracking-tight">Properties</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/60">{adminUser.name}</span>
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
            {adminUser.name?.charAt(0).toUpperCase()}
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

      <div className="px-6 py-6 max-w-screen-xl mx-auto space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Listings", value: properties.length, sub: "in database" },
            { label: "Featured", value: featuredCount, sub: "on homepage carousel" },
            { label: "Homes", value: homeCount, sub: "residential builds" },
            { label: "Lots", value: lotCount, sub: "available land" },
          ].map(({ label, value, sub }) => (
            <Card key={label} className="border-0 shadow-sm">
              <CardContent className="pt-5 pb-4">
                <div className="text-3xl font-black text-[#0f2044]">{value}</div>
                <div className="text-sm font-semibold mt-1">{label}</div>
                <div className="text-xs text-muted-foreground">{sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base font-bold text-[#0f2044]">All Listings</CardTitle>
              <Button
                onClick={() => setEditingId("new")}
                className="bg-[#0f2044] hover:bg-[#1a3366] text-white text-sm"
                size="sm"
              >
                + Add Listing
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mt-3">
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search address or city…"
                className="w-48 h-8 text-sm"
              />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32 h-8 text-sm"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="HOME">Homes</SelectItem>
                  <SelectItem value="LOT">Lots</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-40 h-8 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Coming Soon">Coming Soon</SelectItem>
                  <SelectItem value="Under Contract">Under Contract</SelectItem>
                  <SelectItem value="Sold">Sold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {propertiesQuery.isLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Loading listings…</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl mb-3">🏠</div>
                <div className="text-sm font-semibold text-[#0f2044] mb-1">No listings found</div>
                <div className="text-xs text-muted-foreground mb-4">
                  {properties.length === 0 ? "Add your first listing to get started." : "Try adjusting your filters."}
                </div>
                {properties.length === 0 && (
                  <Button onClick={() => setEditingId("new")} size="sm" className="bg-[#0f2044] hover:bg-[#1a3366]">
                    + Add First Listing
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50/80">
                      <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Photo</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Address</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Price</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Details</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Featured</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50/60 transition-colors">
                        {/* Photo */}
                        <td className="px-4 py-3">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt="" className="w-14 h-10 object-cover rounded-md border" />
                          ) : (
                            <div className="w-14 h-10 rounded-md bg-slate-100 flex items-center justify-center text-lg">🏠</div>
                          )}
                        </td>

                        {/* Address */}
                        <td className="px-4 py-3">
                          <div className="font-semibold text-[#0f2044]">{p.address}</div>
                          <div className="text-xs text-muted-foreground">{p.city}, {p.state}</div>
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={p.propertyType === "HOME" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}>
                            {p.propertyType === "HOME" ? "Home" : "Lot"}
                          </Badge>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={TAG_COLORS[p.tag as TagType] ?? ""}>
                            {p.tag}
                          </Badge>
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3 font-bold text-[#0f2044]">{p.price}</td>

                        {/* Details */}
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {p.propertyType === "HOME" ? (
                            <span>{p.beds ?? "—"} bd · {p.baths ?? "—"} ba · {p.sqft ?? "—"} sqft</span>
                          ) : (
                            <span>{p.lotSize ?? "—"}</span>
                          )}
                        </td>

                        {/* Featured toggle */}
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleFeatured.mutate({ id: p.id, data: { featured: p.featured === 1 ? 0 : 1 } })}
                            title={p.featured === 1 ? "Remove from homepage carousel" : "Add to homepage carousel"}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${p.featured === 1 ? "bg-[#0f2044]" : "bg-gray-200"}`}
                          >
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${p.featured === 1 ? "translate-x-5" : "translate-x-1"}`} />
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingId(p.id)}
                              className="h-7 text-xs"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeletingId(p.id)}
                              className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Featured section note */}
        <div className="text-xs text-muted-foreground text-center pb-4">
          The <strong>Featured</strong> toggle controls which listings appear in the homepage carousel. Toggle it on/off without touching the database.
        </div>
      </div>

      {/* Add/Edit Modal */}
      {editingId !== null && (
        <PropertyModal
          initial={editingId === "new" ? EMPTY_FORM : getEditForm(editingId as number)}
          onClose={() => setEditingId(null)}
          onSave={handleSave}
          saving={isSaving}
        />
      )}

      {/* Delete Confirm Modal */}
      {deletingId !== null && (
        <DeleteModal
          address={properties.find(p => p.id === deletingId)?.address ?? "this listing"}
          onCancel={() => setDeletingId(null)}
          onConfirm={() => deleteMutation.mutate({ id: deletingId! })}
          deleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
