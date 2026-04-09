/**
 * SCOPSProperties.tsx — Overhauled April 2026
 *
 * Fixes vs previous version:
 * - Contained in max-w-[1200px] mx-auto px-6 (was full-bleed)
 * - Proper page header with title, subtitle, + Add button
 * - Stats row as white cards (Available, Under Contract, Sold, Featured, Total)
 * - Filter bar inside the container, consistent with other tabs
 * - Map fills a fixed-height frame; right panel shows property detail on pin/card click
 * - Right detail panel replaces the dead "Click a pin" placeholder
 * - List sidebar cards are denser and more informative
 * - bg-slate-50 page background matching Dashboard/Pipeline/Campaigns
 *
 * DROP-IN REPLACEMENT for client/src/pages/scops/SCOPSProperties.tsx
 * (routed at /scops/inventory)
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import SCOPSNav from "@/components/SCOPSNav";
import { toast } from "sonner";
import { MapView } from "@/components/Map";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type PropertyType   = "HOME" | "LOT";
type PropertyStatus = "AVAILABLE" | "UNDER_CONTRACT" | "SOLD" | "COMING_SOON";
type FilterType     = "ALL" | PropertyType;
type FilterStatus   = "ALL" | PropertyStatus;

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  type: PropertyType;
  status: PropertyStatus;
  price: number;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  lotSize?: number | null;
  imageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  tag?: string | null;
  featured?: boolean;
  description?: string | null;
  createdAt?: string;
}

// ─── TAG → STATUS MAPPER ─────────────────────────────────────────────────────
// DB stores tag as "Available" | "Coming Soon" | "Sold" | "Under Contract"
// SCOPSProperties uses status as "AVAILABLE" | "COMING_SOON" | "SOLD" | "UNDER_CONTRACT"
const TAG_TO_STATUS: Record<string, PropertyStatus> = {
  "Available":       "AVAILABLE",
  "Coming Soon":     "COMING_SOON",
  "Sold":            "SOLD",
  "Under Contract":  "UNDER_CONTRACT",
};

function normalizeProperty(raw: any): Property {
  return {
    id:          String(raw.id),
    address:     raw.address ?? "",
    city:        raw.city ?? "Pahrump",
    state:       raw.state ?? "NV",
    zip:         raw.zip ?? "",  // now populated from DB
    type:        (raw.propertyType as PropertyType) ?? "HOME",
    status:      TAG_TO_STATUS[raw.tag] ?? "AVAILABLE",
    price:       raw.priceValue ?? 0,
    beds:        raw.beds ?? null,
    baths:       raw.baths ?? null,
    sqft:        raw.sqft != null ? Number(raw.sqft) : null,
    lotSize:     raw.lotSize != null ? Number(raw.lotSize) : null,
    imageUrl:    raw.imageUrl ?? null,
    latitude:    raw.lat ?? null,
    longitude:   raw.lng ?? null,
    tag:         raw.tag ?? null,
    featured:    raw.featured === 1 || raw.featured === true,
    description: raw.description ?? null,
    createdAt:   raw.createdAt ? String(raw.createdAt) : undefined,
  };
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PropertyStatus, { label: string; dot: string; badge: string }> = {
  AVAILABLE:      { label: "Available",       dot: "bg-emerald-500", badge: "bg-emerald-500 text-white" },
  UNDER_CONTRACT: { label: "Under Contract",  dot: "bg-amber-500",   badge: "bg-amber-500 text-white"   },
  SOLD:           { label: "Sold",            dot: "bg-red-500",     badge: "bg-red-500 text-white"     },
  COMING_SOON:    { label: "Coming Soon",     dot: "bg-blue-500",    badge: "bg-blue-500 text-white"    },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function shortAddr(address: string) {
  // Truncate at ~32 chars for card display
  return address.length > 34 ? address.slice(0, 32) + "…" : address;
}

// ─── STAT CHIP ────────────────────────────────────────────────────────────────

function StatChip({
  label, count, dot, active, onClick,
}: {
  label: string; count: number; dot: string; active?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-left ${
        active
          ? "bg-slate-900 border-slate-900 text-white"
          : "bg-white border-slate-100 hover:border-slate-300 text-slate-700"
      }`}
    >
      <div className={`w-2 h-2 rounded-full shrink-0 ${active ? "bg-white" : dot}`} />
      <span className={`text-[12px] font-semibold ${active ? "text-white" : ""}`}>{count}</span>
      <span className={`text-[11px] font-medium ${active ? "text-white/80" : "text-slate-500"}`}>{label}</span>
    </button>
  );
}

// ─── PROPERTY CARD (sidebar) ─────────────────────────────────────────────────

function PropertyCard({
  property,
  isSelected,
  onClick,
}: {
  property: Property;
  isSelected: boolean;
  onClick: () => void;
}) {
  const s = STATUS_CONFIG[property.status];

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border overflow-hidden transition-all hover:shadow-md ${
        isSelected
          ? "border-blue-400 ring-2 ring-blue-100 shadow-md"
          : "border-slate-100 hover:border-slate-200 bg-white"
      }`}
    >
      {/* Image */}
      <div className="relative h-32 bg-slate-100">
        {property.imageUrl ? (
          <img
            src={property.imageUrl}
            alt={property.address}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl opacity-20">{property.type === "LOT" ? "🏞" : "🏠"}</span>
          </div>
        )}
        <span className={`absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full ${s.badge}`}>
          {s.label}
        </span>
        {property.featured && (
          <span className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
            ★ Featured
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 bg-white">
        <p className="text-[12px] font-semibold text-slate-900 leading-tight mb-0.5">
          {shortAddr(property.address)}
        </p>
        <p className="text-[10px] text-slate-400 mb-2">
          {property.city}, {property.state}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-bold text-slate-900">{fmt$(property.price)}</span>
          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {property.type === "LOT" ? "Lot" : "Home"}
          </span>
        </div>
        {(property.beds || property.baths || property.sqft) && (
          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500">
            {property.beds  && <span>{property.beds} bd</span>}
            {property.baths && <><span className="text-slate-300">·</span><span>{property.baths} ba</span></>}
            {property.sqft  && <><span className="text-slate-300">·</span><span>{property.sqft.toLocaleString()} sqft</span></>}
          </div>
        )}
      </div>
    </button>
  );
}

// ─── DETAIL PANEL ─────────────────────────────────────────────────────────────

function DetailPanel({
  property,
  onClose,
  onEdit,
}: {
  property: Property;
  onClose: () => void;
  onEdit: (id: string) => void;
}) {
  const s = STATUS_CONFIG[property.status];

  return (
    <div className="w-[280px] shrink-0 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
      {/* Image */}
      <div className="relative h-44 bg-slate-100">
        {property.imageUrl ? (
          <img src={property.imageUrl} alt={property.address} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-20">{property.type === "LOT" ? "🏞" : "🏠"}</span>
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors"
        >
          <span className="text-white text-[13px]">✕</span>
        </button>
        <span className={`absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${s.badge}`}>
          {s.label}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Address + price */}
        <div>
          <p className="text-[15px] font-bold text-slate-900 leading-tight">{property.address}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{property.city}, {property.state} {property.zip}</p>
          <p className="text-[22px] font-bold text-slate-900 mt-2 tracking-tight">{fmt$(property.price)}</p>
        </div>

        {/* Specs */}
        {(property.beds || property.baths || property.sqft || property.lotSize) && (
          <div className="grid grid-cols-2 gap-2">
            {[
              ["Beds",     property.beds,    "bd"],
              ["Baths",    property.baths,   "ba"],
              ["Sqft",     property.sqft?.toLocaleString(), "sqft"],
              ["Lot",      property.lotSize?.toLocaleString(), "sqft"],
            ].filter(([, v]) => v).map(([label, val, unit]) => (
              <div key={String(label)} className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                <p className="text-[9px] text-slate-400 uppercase tracking-wide font-medium">{label}</p>
                <p className="text-[14px] font-bold text-slate-800 mt-0.5">{val} <span className="text-[10px] font-normal text-slate-400">{unit}</span></p>
              </div>
            ))}
          </div>
        )}

        {/* Property details */}
        <div className="space-y-2">
          {[
            ["Type",     property.type === "LOT" ? "Available Lot" : "Home"],
            ["Tag",      property.tag],
            ["Featured", property.featured ? "Yes" : null],
          ].filter(([, v]) => v).map(([label, val]) => (
            <div key={String(label)} className="flex justify-between items-baseline">
              <span className="text-[10px] text-slate-400">{label}</span>
              <span className="text-[11px] font-medium text-slate-700">{val}</span>
            </div>
          ))}
        </div>

        {/* Description */}
        {property.description && (
          <p className="text-[11px] text-slate-500 leading-relaxed">{property.description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-slate-100 space-y-2">
        <button
          onClick={() => onEdit(property.id)}
          className="w-full py-2 rounded-xl bg-slate-900 text-white text-[12px] font-semibold hover:bg-slate-700 transition-colors"
        >
          Edit Listing
        </button>
        <a
          href={`/homes/${property.id}`}
          target="_blank"
          rel="noreferrer"
          className="block w-full py-2 rounded-xl text-center text-[12px] font-semibold text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors"
        >
          View Public Page ↗
        </a>
      </div>
    </div>
  );
}

// ─── MAP COMPONENT ────────────────────────────────────────────────────────────
const MAP_STATUS_COLORS: Record<PropertyStatus, string> = {
  AVAILABLE:      "#10b981",
  UNDER_CONTRACT: "#f59e0b",
  SOLD:           "#ef4444",
  COMING_SOON:    "#3b82f6",
};

function PropertyMap({
  properties,
  selectedId,
  onSelect,
}: {
  properties: Property[];
  selectedId: string | null;
  onSelect: (p: Property) => void;
}) {
  const mapObjRef  = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const renderMarkers = useCallback(() => {
    const mapObj = mapObjRef.current;
    if (!mapObj || !window.google) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    properties.forEach((p) => {
      if (!p.latitude || !p.longitude) return;
      const marker = new window.google.maps.Marker({
        position: { lat: p.latitude, lng: p.longitude },
        map: mapObj,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: selectedId === p.id ? 10 : 7,
          fillColor: MAP_STATUS_COLORS[p.status] ?? "#10b981",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: selectedId === p.id ? 3 : 2,
        },
        title: p.address,
      });
      marker.addListener("click", () => onSelect(p));
      markersRef.current.push(marker);
    });
  }, [properties, selectedId, onSelect]);

  useEffect(() => {
    renderMarkers();
  }, [renderMarkers]);

  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapObjRef.current = map;
    renderMarkers();
  }, [renderMarkers]);

  return (
    <MapView
      className="w-full h-full rounded-xl overflow-hidden"
      initialCenter={{ lat: 36.2078, lng: -115.9845 }}
      initialZoom={11}
      onMapReady={handleMapReady}
    />
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function SCOPSProperties() {
  const [, navigate] = useLocation();

  const [typeFilter,   setTypeFilter]   = useState<FilterType>("ALL");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [search,       setSearch]       = useState("");
  const [selected,     setSelected]     = useState<Property | null>(null);
  const [view,         setView]         = useState<"map" | "list">("map");

  // Admin user for nav
  const { data: adminUser } = trpc.adminAuth.me.useQuery();

  // Data
  const { data: rawData, refetch } = trpc.properties.getAll.useQuery(undefined, { refetchInterval: 60_000 });
  const deleteMutation = trpc.properties.delete?.useMutation?.({ onSuccess: () => refetch() });
  const geocodeAllMutation = trpc.properties.geocodeAll.useMutation({
    onSuccess: (res) => {
      toast.success(`Geocoded ${res.succeeded} of ${res.total} listings${res.failed > 0 ? ` (${res.failed} failed)` : ""}`);
      refetch();
    },
    onError: (err) => toast.error(`Geocoding failed: ${err.message}`),
  });

  const rawList: any[] = (rawData as any)?.properties ?? (Array.isArray(rawData) ? rawData : []);
  const allProperties: Property[] = rawList.map(normalizeProperty);

  // Stats
  const stats = {
    available:     allProperties.filter((p) => p.status === "AVAILABLE").length,
    underContract: allProperties.filter((p) => p.status === "UNDER_CONTRACT").length,
    sold:          allProperties.filter((p) => p.status === "SOLD").length,
    featured:      allProperties.filter((p) => p.featured).length,
    total:         allProperties.length,
  };

  // Filtered list
  const filtered = allProperties.filter((p) => {
    const matchType   = typeFilter   === "ALL" || p.type   === typeFilter;
    const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
    const matchSearch = !search || p.address.toLowerCase().includes(search.toLowerCase()) || p.city.toLowerCase().includes(search.toLowerCase());
    return matchType && matchStatus && matchSearch;
  });

  function handleEdit(id: string) {
    navigate(`/scops/properties/${id}/edit`);
  }

  function handleAdd() {
    navigate("/scops/properties/new");
  }

  const totalValue = filtered.reduce((s, p) => s + (p.price ?? 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <SCOPSNav currentPage="properties" adminUser={adminUser as any} />

      <div className="max-w-[1200px] mx-auto px-6 py-6 space-y-4">

        {/* ── PAGE HEADER ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Inventory</h1>
            <p className="text-[13px] text-slate-400 mt-0.5">
              {filtered.length} listing{filtered.length !== 1 ? "s" : ""}
              {totalValue > 0 && <span className="ml-1.5 text-slate-300">·</span>}
              {totalValue > 0 && <span className="ml-1.5">{fmt$(totalValue)} total value</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => geocodeAllMutation.mutate()}
              disabled={geocodeAllMutation.isPending}
              title="Geocode all listings missing coordinates"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-[12px] font-semibold hover:bg-slate-50 disabled:opacity-60 transition-colors"
            >
              {geocodeAllMutation.isPending ? "Geocoding…" : "📍 Geocode All"}
            </button>
            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-[12px] font-semibold hover:bg-slate-700 transition-colors"
            >
              + Add Listing
            </button>
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div className="flex items-center gap-2 flex-wrap overflow-x-auto pb-1">
          <StatChip label="Available"      count={stats.available}     dot="bg-emerald-500" active={statusFilter === "AVAILABLE"}      onClick={() => setStatusFilter(statusFilter === "AVAILABLE"      ? "ALL" : "AVAILABLE")}      />
          <StatChip label="Under Contract" count={stats.underContract} dot="bg-amber-500"   active={statusFilter === "UNDER_CONTRACT"} onClick={() => setStatusFilter(statusFilter === "UNDER_CONTRACT" ? "ALL" : "UNDER_CONTRACT")} />
          <StatChip label="Sold"           count={stats.sold}          dot="bg-red-500"     active={statusFilter === "SOLD"}           onClick={() => setStatusFilter(statusFilter === "SOLD"           ? "ALL" : "SOLD")}           />
          <StatChip label="Featured"       count={stats.featured}      dot="bg-amber-400"   />
          <div className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-slate-100">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-[12px] font-bold text-slate-800">{stats.total}</span>
            <span className="text-[11px] text-slate-400 font-medium">Total</span>
          </div>
        </div>

        {/* ── FILTER + SEARCH BAR ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Type filters */}
          <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-100 p-1">
            {([["ALL", "All Types"], ["HOME", "Homes"], ["LOT", "Lots"]] as [FilterType, string][]).map(([k, l]) => (
              <button key={k} onClick={() => setTypeFilter(k)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${typeFilter === k ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
                {l}
              </button>
            ))}
          </div>

          {/* Status filters */}
          <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-100 p-1 overflow-x-auto max-w-full">
            {([["ALL", "All Status"], ["AVAILABLE", "Available"], ["UNDER_CONTRACT", "Under Contract"], ["SOLD", "Sold"], ["COMING_SOON", "Coming Soon"]] as [FilterStatus, string][]).map(([k, l]) => (
              <button key={k} onClick={() => setStatusFilter(k)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${statusFilter === k ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
                {l}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-auto sm:ml-auto">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[12px]">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search address or city..."
              className="text-[12px] pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 w-full sm:w-52 transition-all"
            />
          </div>

          {/* Map / List toggle */}
          <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-100 p-1">
            {(["map", "list"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-colors ${view === v ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
                {v === "map" ? "🗺 Map" : "☰ List"}
              </button>
            ))}
          </div>
        </div>

        {/* ── MAIN CONTENT: MAP VIEW ── */}
        {view === "map" && (
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* Sidebar list */}
            <div className="w-full sm:w-[220px] shrink-0 space-y-2 sm:max-h-[620px] overflow-y-auto pr-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-1">
                {filtered.length} listing{filtered.length !== 1 ? "s" : ""}
              </p>
              {filtered.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  isSelected={selected?.id === p.id}
                  onClick={() => setSelected(selected?.id === p.id ? null : p)}
                />
              ))}
              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <span className="text-2xl mb-2 opacity-30">🏠</span>
                  <p className="text-[12px] text-slate-400">No listings match filters</p>
                </div>
              )}
            </div>

            {/* Map */}
            <div className="flex-1 h-[400px] sm:h-[620px] rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
              <PropertyMap
                properties={filtered}
                selectedId={selected?.id ?? null}
                onSelect={(p) => setSelected(selected?.id === p.id ? null : p)}
              />
            </div>

            {/* Detail panel */}
            {selected && (
              <DetailPanel
                property={selected}
                onClose={() => setSelected(null)}
                onEdit={handleEdit}
              />
            )}
          </div>
        )}

        {/* ── MAIN CONTENT: LIST VIEW ── */}
        {view === "list" && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Property", "Type", "Status", "Price", "Beds", "Baths", "Sqft", "Featured", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[9px] font-bold text-slate-400 uppercase tracking-[0.06em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const s = STATUS_CONFIG[p.status];
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelected(selected?.id === p.id ? null : p)}
                      className={`border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors group ${selected?.id === p.id ? "bg-blue-50" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt="" className="w-10 h-7 rounded-md object-cover border border-slate-100 shrink-0" />
                          ) : (
                            <div className="w-10 h-7 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                              <span className="text-[13px] opacity-40">{p.type === "LOT" ? "🏞" : "🏠"}</span>
                            </div>
                          )}
                          <div>
                            <p className="text-[12px] font-semibold text-slate-900 truncate max-w-[200px]">{p.address}</p>
                            <p className="text-[10px] text-slate-400">{p.city}, {p.state}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-500">{p.type === "LOT" ? "Lot" : "Home"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.badge}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] font-bold text-slate-900">{fmt$(p.price)}</td>
                      <td className="px-4 py-3 text-[12px] text-slate-600">{p.beds ?? "—"}</td>
                      <td className="px-4 py-3 text-[12px] text-slate-600">{p.baths ?? "—"}</td>
                      <td className="px-4 py-3 text-[12px] text-slate-600">{p.sqft?.toLocaleString() ?? "—"}</td>
                      <td className="px-4 py-3 text-[12px]">
                        {p.featured ? <span className="text-amber-500 font-bold">★</span> : <span className="text-slate-200">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(p.id); }}
                          className="opacity-0 group-hover:opacity-100 px-3 py-1 rounded-lg text-[10px] font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[12px] text-slate-400">
                      No listings match your current filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Map legend */}
            <div className="flex items-center gap-4 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <div key={k} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${v.dot}`} />
                  <span className="text-[10px] text-slate-500">{v.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detail panel in list view */}
        {view === "list" && selected && (
          <div className="flex justify-end">
            <DetailPanel
              property={selected}
              onClose={() => setSelected(null)}
              onEdit={handleEdit}
            />
          </div>
        )}

      </div>
    </div>
  );
}
