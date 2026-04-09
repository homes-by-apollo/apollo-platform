import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import SCOPSNav from "@/components/SCOPSNav";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type PropertyType = "HOME" | "LOT";
type PropertyTag = "Available" | "Coming Soon" | "Sold" | "Under Contract";

interface FormState {
  propertyType: PropertyType;
  tag: PropertyTag;
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
  imageUrls: string;
  featured: boolean;
  sortOrder: string;
  description: string;
}

const EMPTY_FORM: FormState = {
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
  imageUrls: "",
  featured: false,
  sortOrder: "0",
  description: "",
};

// ─── Field helpers ────────────────────────────────────────────────────────────
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 transition"
    />
  );
}

function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition"
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SCOPSPropertyEdit() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const propertyId = parseInt(params.id ?? "0", 10);
  const isNew = isNaN(propertyId) || propertyId === 0;

  const adminQuery = trpc.adminAuth.me.useQuery();
  const adminUser = adminQuery.data ?? null;

  const { data: property, isLoading } = trpc.properties.getById.useQuery(
    { id: propertyId },
    { enabled: !isNew }
  );

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isDirty, setIsDirty] = useState(false);

  // Populate form when property loads
  useEffect(() => {
    if (property) {
      setForm({
        propertyType: (property.propertyType as PropertyType) ?? "HOME",
        tag: (property.tag as PropertyTag) ?? "Available",
        address: property.address ?? "",
        city: property.city ?? "Pahrump",
        state: property.state ?? "NV",
        price: property.price ?? "",
        priceValue: property.priceValue != null ? String(property.priceValue) : "",
        beds: property.beds != null ? String(property.beds) : "",
        baths: property.baths != null ? String(property.baths) : "",
        sqft: property.sqft ?? "",
        lotSize: property.lotSize ?? "",
        utilities: property.utilities ?? "",
        imageUrl: property.imageUrl ?? "",
        imageUrls: property.imageUrls ?? "",
        featured: property.featured === 1,
        sortOrder: String(property.sortOrder ?? 0),
        description: property.description ?? "",
      });
      setIsDirty(false);
    }
  }, [property]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const createMutation = trpc.properties.create.useMutation({
    onSuccess: () => {
      toast.success("Listing created successfully");
      navigate("/scops/properties");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.properties.update.useMutation({
    onSuccess: () => {
      toast.success("Listing updated successfully");
      setIsDirty(false);
      navigate("/scops/properties");
    },
    onError: (err) => toast.error(err.message),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = () => {
    if (!form.address.trim()) {
      toast.error("Address is required");
      return;
    }
    if (!form.price.trim()) {
      toast.error("Price is required");
      return;
    }

    const payload = {
      propertyType: form.propertyType,
      tag: form.tag,
      address: form.address.trim(),
      city: form.city.trim() || "Pahrump",
      state: form.state.trim() || "NV",
      price: form.price.trim(),
      priceValue: form.priceValue ? parseInt(form.priceValue, 10) : undefined,
      beds: form.beds ? parseInt(form.beds, 10) : undefined,
      baths: form.baths ? parseInt(form.baths, 10) : undefined,
      sqft: form.sqft.trim() || undefined,
      lotSize: form.lotSize.trim() || undefined,
      utilities: form.utilities.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      imageUrls: form.imageUrls.trim() || undefined,
      featured: form.featured ? 1 : 0,
      sortOrder: parseInt(form.sortOrder, 10) || 0,
      description: form.description.trim() || undefined,
    };

    if (isNew) {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate({ id: propertyId, data: payload });
    }
  };

  const handleCancel = () => {
    if (isDirty && !confirm("Discard unsaved changes?")) return;
    navigate("/scops/properties");
  };

  // ── Loading state ──
  if (!isNew && isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SCOPSNav adminUser={adminUser} currentPage="properties" />
        <div className="max-w-[1200px] mx-auto px-6 py-16 text-center text-gray-400 text-sm">
          Loading listing…
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (!isNew && !isLoading && !property) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SCOPSNav adminUser={adminUser} currentPage="properties" />
        <div className="max-w-[1200px] mx-auto px-6 py-16 text-center">
          <p className="text-gray-500 text-sm mb-4">Listing not found.</p>
          <button
            onClick={() => navigate("/scops/properties")}
            className="text-blue-600 text-sm font-medium hover:underline"
          >
            ← Back to Inventory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SCOPSNav adminUser={adminUser} currentPage="properties" />

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* ── Page header ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
              </svg>
              Back
            </button>
            <span className="text-gray-300">/</span>
            <h1 className="text-lg font-bold text-gray-900">
              {isNew ? "New Listing" : `Edit Listing — ${property?.address ?? `#${propertyId}`}`}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {isSaving ? "Saving…" : isNew ? "Create Listing" : "Save Changes"}
            </button>
          </div>
        </div>

        {/* ── Form grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left column (main fields) ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Basic info card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-sm font-bold text-gray-800 mb-5 uppercase tracking-wide">Basic Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label required>Address</Label>
                  <Input value={form.address} onChange={(v) => setField("address", v)} placeholder="123 Desert View Dr" />
                </div>
                <div>
                  <Label>City</Label>
                  <Input value={form.city} onChange={(v) => setField("city", v)} placeholder="Pahrump" />
                </div>
                <div>
                  <Label>State</Label>
                  <Input value={form.state} onChange={(v) => setField("state", v)} placeholder="NV" />
                </div>
                <div>
                  <Label required>Price (display)</Label>
                  <Input value={form.price} onChange={(v) => setField("price", v)} placeholder="$489,000" />
                </div>
                <div>
                  <Label>Price (numeric)</Label>
                  <Input value={form.priceValue} onChange={(v) => setField("priceValue", v)} type="number" placeholder="489000" />
                </div>
              </div>
            </div>

            {/* Property details card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-sm font-bold text-gray-800 mb-5 uppercase tracking-wide">Property Details</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Beds</Label>
                  <Input value={form.beds} onChange={(v) => setField("beds", v)} type="number" placeholder="3" />
                </div>
                <div>
                  <Label>Baths</Label>
                  <Input value={form.baths} onChange={(v) => setField("baths", v)} type="number" placeholder="2" />
                </div>
                <div>
                  <Label>Sq Ft</Label>
                  <Input value={form.sqft} onChange={(v) => setField("sqft", v)} placeholder="1,850" />
                </div>
                <div>
                  <Label>Lot Size</Label>
                  <Input value={form.lotSize} onChange={(v) => setField("lotSize", v)} placeholder="0.25 acres" />
                </div>
                <div>
                  <Label>Utilities</Label>
                  <Input value={form.utilities} onChange={(v) => setField("utilities", v)} placeholder="City water + sewer" />
                </div>
              </div>
            </div>

            {/* Description card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-sm font-bold text-gray-800 mb-5 uppercase tracking-wide">Description</h2>
              <Textarea
                value={form.description}
                onChange={(v) => setField("description", v)}
                placeholder="Describe the property — features, finishes, neighborhood highlights…"
                rows={5}
              />
            </div>

            {/* Images card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-sm font-bold text-gray-800 mb-5 uppercase tracking-wide">Images</h2>
              <div className="space-y-4">
                <div>
                  <Label>Primary Image URL</Label>
                  <Input value={form.imageUrl} onChange={(v) => setField("imageUrl", v)} placeholder="https://cdn.example.com/photo.jpg" />
                  {form.imageUrl && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-gray-100" style={{ maxHeight: 200 }}>
                      <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" style={{ maxHeight: 200 }} />
                    </div>
                  )}
                </div>
                <div>
                  <Label>Gallery URLs (JSON array)</Label>
                  <Textarea
                    value={form.imageUrls}
                    onChange={(v) => setField("imageUrls", v)}
                    placeholder={'["https://cdn.example.com/photo2.jpg", "https://cdn.example.com/photo3.jpg"]'}
                    rows={3}
                  />
                  <p className="text-xs text-gray-400 mt-1">Paste a JSON array of image URLs for the gallery carousel.</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right column (status + settings) ── */}
          <div className="space-y-6">

            {/* Status card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-sm font-bold text-gray-800 mb-5 uppercase tracking-wide">Status</h2>
              <div className="space-y-4">
                <div>
                  <Label>Property Type</Label>
                  <Select<PropertyType>
                    value={form.propertyType}
                    onChange={(v) => setField("propertyType", v)}
                    options={[
                      { value: "HOME", label: "Home" },
                      { value: "LOT", label: "Lot" },
                    ]}
                  />
                </div>
                <div>
                  <Label>Listing Tag</Label>
                  <Select<PropertyTag>
                    value={form.tag}
                    onChange={(v) => setField("tag", v)}
                    options={[
                      { value: "Available", label: "Available" },
                      { value: "Coming Soon", label: "Coming Soon" },
                      { value: "Under Contract", label: "Under Contract" },
                      { value: "Sold", label: "Sold" },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Visibility card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-sm font-bold text-gray-800 mb-5 uppercase tracking-wide">Visibility</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-800">Featured</div>
                    <div className="text-xs text-gray-400 mt-0.5">Show in homepage carousel</div>
                  </div>
                  <button
                    onClick={() => setField("featured", !form.featured)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.featured ? "bg-blue-600" : "bg-gray-200"}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.featured ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                </div>
                <div>
                  <Label>Sort Order</Label>
                  <Input value={form.sortOrder} onChange={(v) => setField("sortOrder", v)} type="number" placeholder="0" />
                  <p className="text-xs text-gray-400 mt-1">Lower number = higher in list</p>
                </div>
              </div>
            </div>

            {/* Save reminder */}
            {isDirty && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <span className="font-semibold">Unsaved changes</span> — click Save Changes to apply.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
