import { useState, useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import SCOPSNav from "@/components/SCOPSNav";
import { MapView } from "@/components/Map";

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

const TAG_PIN_COLORS: Record<string, string> = {
  "Available":       "#22c55e",
  "Under Contract":  "#f59e0b",
  "Sold":            "#ef4444",
  "Coming Soon":     "#6366f1",
};

const PAHRUMP_CENTER = { lat: 36.2083, lng: -115.9839 };

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
  const set = (k: keyof PropertyForm, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0f2044]">{initial.address ? "Edit Listing" : "Add Listing"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="px-6 py-4 space-y-4">
          {/* Type + Tag */}
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
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Status</label>
              <Select value={form.tag} onValueChange={v => set("tag", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Coming Soon">Coming Soon</SelectItem>
                  <SelectItem value="Under Contract">Under Contract</SelectItem>
                  <SelectItem value="Sold">Sold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Address */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Street Address</label>
            <Input value={form.address} onChange={e => set("address", e.target.value)} placeholder="420 E Bellville Rd" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
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
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Display Price</label>
              <Input value={form.price} onChange={e => set("price", e.target.value)} placeholder="$525,000" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Price Value</label>
              <Input type="number" value={form.priceValue} onChange={e => set("priceValue", e.target.value)} placeholder="525000" />
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

// ─── Property Card ────────────────────────────────────────────────────────────
type Property = {
  id: number;
  address: string;
  city: string;
  state: string;
  tag: string;
  price: string;
  priceValue: number | null;
  beds: number | null;
  baths: number | null;
  sqft: string | null;
  lotSize: string | null;
  imageUrl: string | null;
  propertyType: string;
  featured: number;
  description: string | null;
  utilities: string | null;
  sortOrder: number | null;
};

function PropertyCard({ property, selected, onClick }: { property: Property; selected: boolean; onClick: () => void }) {
  const tagColor = TAG_PIN_COLORS[property.tag] ?? "#6366f1";
  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.10)",
        border: selected ? "1.5px solid rgba(255,255,255,0.50)" : "1px solid rgba(255,255,255,0.14)",
        borderRadius: 14, cursor: "pointer", overflow: "hidden",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        boxShadow: selected ? "0 4px 20px rgba(0,0,0,0.20)" : "0 2px 8px rgba(0,0,0,0.10)",
        transition: "all 0.15s ease", marginBottom: 8,
      }}
    >
      {property.imageUrl && (
        <div style={{ position: "relative", height: 80 }}>
          <img src={property.imageUrl} alt={property.address} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", top: 6, left: 6, background: tagColor, color: "white", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{property.tag}</div>
          {property.featured === 1 && (
            <div style={{ position: "absolute", top: 6, right: 6, background: "#f59e0b", color: "white", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 20 }}>★</div>
          )}
        </div>
      )}
      <div style={{ padding: "10px 12px" }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "white", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{property.address}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.50)", marginBottom: 6 }}>{property.city}, {property.state}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "white" }}>{property.price}</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.50)" }}>
            {property.propertyType === "HOME"
              ? `${property.beds ?? "—"} bd · ${property.baths ?? "—"} ba · ${property.sqft ?? "—"} sqft`
              : property.lotSize ?? "Lot"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Property Detail Panel ────────────────────────────────────────────────────
function PropertyDetailPanel({ property, onClose, onEdit, onDelete }: {
  property: Property;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const tagColor = TAG_PIN_COLORS[property.tag] ?? "#6366f1";
  const priceNum = property.priceValue ?? parseInt(property.price.replace(/[^0-9]/g, "")) ?? 0;

  return (
    <div style={{ width: 300, flexShrink: 0, background: "rgba(255,255,255,0.10)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative", height: 180, flexShrink: 0 }}>
        <img src={property.imageUrl ?? "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=80"} alt={property.address} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", top: 10, left: 10, background: tagColor, color: "white", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>{property.tag}</div>
        <button onClick={onClose} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.50)", border: "none", color: "white", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
      </div>
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "white", lineHeight: 1.2 }}>{property.address}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.50)", marginTop: 2 }}>{property.city}, {property.state}</div>
          </div>
          {property.featured === 1 && (
            <div style={{ background: "#f59e0b", color: "white", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 8, flexShrink: 0, marginLeft: 8 }}>★ Featured</div>
          )}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "white", marginBottom: 12 }}>${priceNum.toLocaleString()}</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.40)" }}>Type</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.80)" }}>{property.propertyType === "HOME" ? "Home" : "Lot"}</div>
          </div>
          {property.propertyType === "HOME" && property.beds && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.40)" }}>Beds</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.80)" }}>{property.beds}</div>
            </div>
          )}
          {property.propertyType === "HOME" && property.baths && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.40)" }}>Baths</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.80)" }}>{property.baths}</div>
            </div>
          )}
          {property.propertyType === "HOME" && property.sqft && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.40)" }}>Sq Ft</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.80)" }}>{property.sqft}</div>
            </div>
          )}
          {property.propertyType === "LOT" && property.lotSize && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.40)" }}>Lot Size</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.80)" }}>{property.lotSize}</div>
            </div>
          )}
        </div>
        {property.description && (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.5, marginBottom: 14 }}>{property.description}</div>
        )}
        {property.utilities && (
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "8px 10px", marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.40)", marginBottom: 2 }}>Utilities</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.70)" }}>{property.utilities}</div>
          </div>
        )}
      </div>
      <div style={{ padding: "0 16px 16px", display: "flex", gap: 8 }}>
        <button onClick={onEdit} style={{ flex: 1, padding: "10px", borderRadius: 10, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.30)", color: "#a5b4fc", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Edit</button>
        <button onClick={onDelete} style={{ flex: 1, padding: "10px", borderRadius: 10, background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Delete</button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SCOPSProperties() {
  const adminMeQuery = trpc.adminAuth.me.useQuery();
  const adminUser = adminMeQuery.data;
  const loading = adminMeQuery.isLoading;

  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [tagFilter, setTagFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

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
    onSuccess: () => { utils.properties.getAll.invalidate(); toast.success("Listing deleted"); setDeletingId(null); setSelectedProperty(null); },
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

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    markersRef.current.forEach(m => { m.map = null; });
    markersRef.current = [];
    const geocoder = new google.maps.Geocoder();
    const properties = propertiesQuery.data ?? [];
    properties.forEach(prop => {
      const fullAddress = `${prop.address}, ${prop.city}, ${prop.state}`;
      geocoder.geocode({ address: fullAddress }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          const pinColor = TAG_PIN_COLORS[prop.tag] ?? "#6366f1";
          const pinEl = document.createElement("div");
          pinEl.style.cssText = `width:24px;height:24px;border-radius:50% 50% 50% 0;background:${pinColor};border:2px solid white;transform:rotate(-45deg);cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3);`;
          const marker = new google.maps.marker.AdvancedMarkerElement({ map, position: results[0].geometry.location, content: pinEl, title: prop.address });
          marker.addListener("click", () => setSelectedProperty(prop as Property));
          markersRef.current.push(marker);
        }
      });
    });
  }, [propertiesQuery.data]);

  if (loading) return null;
  if (!adminUser) { window.location.href = getLoginUrl(); return null; }

  const properties = (propertiesQuery.data ?? []) as Property[];
  const filtered = properties.filter(p => {
    if (typeFilter !== "ALL" && p.propertyType !== typeFilter) return false;
    if (tagFilter !== "ALL" && p.tag !== tagFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.address.toLowerCase().includes(q) || p.city.toLowerCase().includes(q);
    }
    return true;
  });

  const availableCount = properties.filter(p => p.tag === "Available").length;
  const underContractCount = properties.filter(p => p.tag === "Under Contract").length;
  const soldCount = properties.filter(p => p.tag === "Sold").length;
  const featuredCount = properties.filter(p => p.featured === 1).length;

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
    <div className="scops-bg" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", display: "flex", flexDirection: "column" }}>
      <SCOPSNav adminUser={adminUser} currentPage="properties" />

      {/* ── KPI Stats Bar ── */}
      <div style={{ padding: "10px 20px", background: "rgba(255,255,255,0.50)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.75)", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {[
          { label: "Available", value: availableCount, color: "#22c55e" },
          { label: "Under Contract", value: underContractCount, color: "#f59e0b" },
          { label: "Sold", value: soldCount, color: "#ef4444" },
          { label: "Featured", value: featuredCount, color: "#6366f1" },
          { label: "Total", value: properties.length, color: "#374151" },
        ].map(stat => (
          <div key={stat.label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", background: "rgba(255,255,255,0.70)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.85)" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: stat.color }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: stat.color }}>{stat.value}</span>
            <span style={{ fontSize: 11, color: "rgba(15,32,68,0.50)" }}>{stat.label}</span>
          </div>
        ))}
        <div style={{ flex: 1, minWidth: 200, maxWidth: 300, marginLeft: "auto", display: "flex", gap: 8 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search address or city…" style={{ flex: 1, padding: "7px 14px", background: "rgba(255,255,255,0.70)", border: "1px solid rgba(255,255,255,0.85)", borderRadius: 20, color: "rgba(15,32,68,0.85)", fontSize: 12, outline: "none" }} />
          <button onClick={() => setEditingId("new")} style={{ padding: "7px 16px", borderRadius: 20, background: "#0f2044", border: "none", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>+ Add</button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div style={{ padding: "8px 20px", background: "rgba(255,255,255,0.45)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.70)", display: "flex", gap: 8, alignItems: "center" }}>
        {["ALL", "HOME", "LOT"].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", background: typeFilter === t ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.65)", border: typeFilter === t ? "1px solid rgba(99,102,241,0.40)" : "1px solid rgba(255,255,255,0.80)", color: typeFilter === t ? "#6366f1" : "rgba(15,32,68,0.55)" }}>
            {t === "ALL" ? "All Types" : t === "HOME" ? "Homes" : "Lots"}
          </button>
        ))}
        <div style={{ width: 1, height: 16, background: "rgba(15,32,68,0.12)", margin: "0 4px" }} />
        {["ALL", "Available", "Under Contract", "Sold", "Coming Soon"].map(tag => {
          const color = tag === "ALL" ? "rgba(15,32,68,0.60)" : TAG_PIN_COLORS[tag] ?? "rgba(15,32,68,0.60)";
          return (
            <button key={tag} onClick={() => setTagFilter(tag)} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", background: tagFilter === tag ? `${color}18` : "rgba(255,255,255,0.65)", border: tagFilter === tag ? `1px solid ${color}50` : "1px solid rgba(255,255,255,0.80)", color: tagFilter === tag ? color : "rgba(15,32,68,0.50)" }}>
              {tag === "ALL" ? "All Status" : tag}
            </button>
          );
        })}
      </div>

      {/* ── 3-Panel Body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        {/* LEFT: Property list */}
        <div style={{ width: 300, flexShrink: 0, background: "rgba(255,255,255,0.40)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderRight: "1px solid rgba(255,255,255,0.70)", overflowY: "auto", padding: "12px" }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(15,32,68,0.90)", marginBottom: 2 }}>
              {filtered.length} Listing{filtered.length !== 1 ? "s" : ""}
            </div>
            <div style={{ fontSize: 11, color: "rgba(15,32,68,0.45)" }}>
              {typeFilter === "ALL" ? "All types" : typeFilter === "HOME" ? "Homes only" : "Lots only"}
              {tagFilter !== "ALL" ? ` · ${tagFilter}` : ""}
            </div>
          </div>
          {propertiesQuery.isLoading ? (
            <div style={{ color: "rgba(15,32,68,0.35)", textAlign: "center", padding: 40, fontSize: 13 }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ color: "rgba(15,32,68,0.30)", textAlign: "center", padding: 40, fontSize: 13 }}>No listings found</div>
          ) : (
            filtered.map(prop => (
              <PropertyCard
                key={prop.id}
                property={prop}
                selected={selectedProperty?.id === prop.id}
                onClick={() => setSelectedProperty(selectedProperty?.id === prop.id ? null : prop)}
              />
            ))
          )}
        </div>

        {/* CENTER: Map */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <MapView initialCenter={PAHRUMP_CENTER} initialZoom={12} onMapReady={handleMapReady} className="w-full h-full" />
          {/* Legend */}
          <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",          background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", borderRadius: 20, padding: "8px 16px", display: "flex", gap: 16, alignItems: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.15)", fontSize: 12, fontWeight: 600 }}>
            {[{ color: "#22c55e", label: "Available" }, { color: "#f59e0b", label: "Under Contract" }, { color: "#ef4444", label: "Sold" }, { color: "#6366f1", label: "Coming Soon" }].map(({ color, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                <span style={{ color: "#374151" }}>{label}</span>
              </div>
            ))}   </div>
        </div>

        {/* RIGHT: Detail panel */}
        {selectedProperty ? (
          <div style={{ padding: "12px", background: "rgba(255,255,255,0.45)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderLeft: "1px solid rgba(255,255,255,0.75)", overflowY: "auto" }}>
            <PropertyDetailPanel
              property={selectedProperty}
              onClose={() => setSelectedProperty(null)}
              onEdit={() => { setEditingId(selectedProperty.id); }}
              onDelete={() => setDeletingId(selectedProperty.id)}
            />
          </div>
        ) : (
          <div style={{ width: 300, flexShrink: 0, background: "rgba(255,255,255,0.25)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderLeft: "1px solid rgba(255,255,255,0.40)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center", color: "rgba(0,0,0,0.30)", fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📍</div>
              <div>Click a pin or listing<br />to see details</div>
            </div>
          </div>
        )}
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
