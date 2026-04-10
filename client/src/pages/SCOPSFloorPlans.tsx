/**
 * SCOPSFloorPlans.tsx — Admin tab for managing floor plan listings.
 *
 * Features:
 *   - List all floor plans with key specs, pricing, and lead count
 *   - Create / edit / delete floor plans via slide-over form
 *   - Upload floor plan image and PDF via S3 (server-side storagePut)
 *   - View PDF request leads per plan
 *   - Toggle featured / sort order
 */

import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import SCOPSNav from "@/components/SCOPSNav";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

// ─── Types ────────────────────────────────────────────────────────────────────

type FloorPlan = {
  id: number;
  name: string;
  slug: string;
  sqft: number;
  beds: number;
  baths: string;
  garage: number;
  startingPrice: number | null;
  description: string | null;
  imageUrl: string | null;
  pdfUrl: string | null;
  featured: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

type FormState = {
  name: string;
  slug: string;
  sqft: string;
  beds: string;
  baths: string;
  garage: string;
  startingPrice: string;
  description: string;
  imageUrl: string;
  pdfUrl: string;
  featured: boolean;
  sortOrder: string;
};

const EMPTY_FORM: FormState = {
  name: "", slug: "", sqft: "", beds: "", baths: "2",
  garage: "2", startingPrice: "", description: "",
  imageUrl: "", pdfUrl: "", featured: false, sortOrder: "0",
};

function toForm(p: FloorPlan): FormState {
  return {
    name: p.name, slug: p.slug, sqft: String(p.sqft), beds: String(p.beds),
    baths: p.baths, garage: String(p.garage),
    startingPrice: p.startingPrice ? String(p.startingPrice) : "",
    description: p.description ?? "", imageUrl: p.imageUrl ?? "",
    pdfUrl: p.pdfUrl ?? "", featured: p.featured === 1,
    sortOrder: String(p.sortOrder),
  };
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ─── Upload helper (via server tRPC) ─────────────────────────────────────────

function UploadButton({
  label, accept, onUploaded,
}: { label: string; accept: string; onUploaded: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const upload = trpc.floorPlans.uploadAsset.useMutation({
    onSuccess: (data) => { onUploaded(data.url); toast.success("Uploaded"); },
    onError: (e) => toast.error(e.message),
  });

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      upload.mutate({ filename: file.name, mimeType: file.type, base64 });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex items-center gap-2">
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={handleFile} />
      <Button type="button" variant="outline" size="sm" onClick={() => ref.current?.click()} disabled={upload.isPending}>
        {upload.isPending ? "Uploading…" : label}
      </Button>
    </div>
  );
}

// ─── Slide-over form ─────────────────────────────────────────────────────────

function FloorPlanForm({
  initial, onClose, onSaved,
}: { initial: FloorPlan | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<FormState>(initial ? toForm(initial) : EMPTY_FORM);
  const utils = trpc.useUtils();

  const create = trpc.floorPlans.create.useMutation({
    onSuccess: () => { toast.success("Floor plan created"); utils.floorPlans.getAll.invalidate(); onSaved(); },
    onError: (e) => toast.error(e.message),
  });
  const update = trpc.floorPlans.update.useMutation({
    onSuccess: () => { toast.success("Floor plan updated"); utils.floorPlans.getAll.invalidate(); onSaved(); },
    onError: (e) => toast.error(e.message),
  });

  function set(k: keyof FormState, v: string | boolean) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function handleNameBlur() {
    if (!form.slug && form.name) set("slug", slugify(form.name));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name, slug: form.slug,
      sqft: parseInt(form.sqft) || 0,
      beds: parseInt(form.beds) || 0,
      baths: form.baths,
      garage: parseInt(form.garage) || 2,
      startingPrice: form.startingPrice ? parseInt(form.startingPrice) : undefined,
      description: form.description || undefined,
      imageUrl: form.imageUrl || undefined,
      pdfUrl: form.pdfUrl || undefined,
      featured: form.featured,
      sortOrder: parseInt(form.sortOrder) || 0,
    };
    if (initial) {
      update.mutate({ id: initial.id, ...payload });
    } else {
      create.mutate(payload);
    }
  }

  const isPending = create.isPending || update.isPending;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="relative w-full max-w-lg h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
          <h2 className="text-[14px] font-semibold text-slate-800">
            {initial ? `Edit: ${initial.name}` : "New Floor Plan"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-5 flex-1">
          {/* Identity */}
          <section>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Identity</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-[11px] text-slate-500 mb-1 block">Plan Name *</label>
                <Input value={form.name} onChange={e => set("name", e.target.value)} onBlur={handleNameBlur} placeholder="The Ridgeline" required />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] text-slate-500 mb-1 block">Slug (URL) *</label>
                <Input value={form.slug} onChange={e => set("slug", e.target.value)} placeholder="the-ridgeline" required className="font-mono text-[12px]" />
              </div>
            </div>
          </section>

          {/* Specs */}
          <section>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Specs</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 mb-1 block">Sq Ft *</label>
                <Input type="number" value={form.sqft} onChange={e => set("sqft", e.target.value)} placeholder="1800" required />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 mb-1 block">Beds *</label>
                <Input type="number" value={form.beds} onChange={e => set("beds", e.target.value)} placeholder="3" required />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 mb-1 block">Baths *</label>
                <Input value={form.baths} onChange={e => set("baths", e.target.value)} placeholder="2.5" required />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 mb-1 block">Garage Bays</label>
                <Input type="number" value={form.garage} onChange={e => set("garage", e.target.value)} placeholder="2" />
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Pricing</p>
            <div>
              <label className="text-[11px] text-slate-500 mb-1 block">Starting Price (USD) — leave blank for "Contact for pricing"</label>
              <Input type="number" value={form.startingPrice} onChange={e => set("startingPrice", e.target.value)} placeholder="289000" />
            </div>
          </section>

          {/* Content */}
          <section>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Content</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] text-slate-500 mb-1 block">Description</label>
                <Textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Open-concept living with a split-bedroom layout…" rows={3} />
              </div>

              {/* Image */}
              <div>
                <label className="text-[11px] text-slate-500 mb-1 block">Floor Plan Image URL</label>
                <div className="flex gap-2">
                  <Input value={form.imageUrl} onChange={e => set("imageUrl", e.target.value)} placeholder="https://cdn…/plan.png" className="flex-1 text-[11px]" />
                  <UploadButton label="Upload" accept="image/*" onUploaded={url => set("imageUrl", url)} />
                </div>
                {form.imageUrl && (
                  <img src={form.imageUrl} alt="preview" className="mt-2 h-24 w-auto rounded border border-slate-100 object-contain" />
                )}
              </div>

              {/* PDF */}
              <div>
                <label className="text-[11px] text-slate-500 mb-1 block">PDF URL (gated download)</label>
                <div className="flex gap-2">
                  <Input value={form.pdfUrl} onChange={e => set("pdfUrl", e.target.value)} placeholder="https://cdn…/plan.pdf" className="flex-1 text-[11px]" />
                  <UploadButton label="Upload PDF" accept="application/pdf" onUploaded={url => set("pdfUrl", url)} />
                </div>
                {form.pdfUrl && (
                  <a href={form.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-indigo-500 hover:underline mt-1 block">Preview PDF ↗</a>
                )}
              </div>
            </div>
          </section>

          {/* Display */}
          <section>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Display</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 mb-1 block">Sort Order (lower = first)</label>
                <Input type="number" value={form.sortOrder} onChange={e => set("sortOrder", e.target.value)} placeholder="0" />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={e => set("featured", e.target.checked)} className="w-4 h-4 rounded" />
                  <span className="text-[12px] text-slate-600">Featured on homepage</span>
                </label>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex gap-3 pt-2 mt-auto">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? "Saving…" : initial ? "Save Changes" : "Create Floor Plan"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── PDF Requests Panel ───────────────────────────────────────────────────────

function PdfRequestsPanel({ plan, onClose }: { plan: FloorPlan; onClose: () => void }) {
  const { data: requests, isLoading } = trpc.floorPlans.getPdfRequests.useQuery();
  const filtered = (requests ?? []).filter(r => r.floorPlanId === plan.id);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="relative w-full max-w-md h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 sticky top-0">
          <div>
            <div className="text-[13px] font-semibold text-slate-800">PDF Requests — {plan.name}</div>
            <div className="text-[10px] text-slate-400">{filtered.length} lead{filtered.length !== 1 ? "s" : ""}</div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl p-1">✕</button>
        </div>

        <div className="flex-1 px-6 py-4">
          {isLoading ? (
            <div className="text-[12px] text-slate-300 text-center py-12">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-[12px] text-slate-400 text-center py-12">No PDF requests yet for this plan.</div>
          ) : (
            <div className="flex flex-col divide-y divide-slate-50">
              {filtered.map(r => (
                <div key={r.id} className="py-3">
                  <div className="text-[12px] font-semibold text-slate-800">{r.name ?? "—"}</div>
                  <div className="text-[11px] text-slate-500">{r.email}</div>
                  {r.phone && <div className="text-[11px] text-slate-400">{r.phone}</div>}
                  <div className="text-[10px] text-slate-300 mt-0.5">
                    {new Date(r.requestedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SCOPSFloorPlans() {
  const { user } = useAuth();
  const [editing, setEditing] = useState<FloorPlan | null | "new">(null);
  const [viewingLeads, setViewingLeads] = useState<FloorPlan | null>(null);
  const utils = trpc.useUtils();

  const { data: plans, isLoading } = trpc.floorPlans.getAll.useQuery();
  const { data: pdfRequests } = trpc.floorPlans.getPdfRequests.useQuery();

  const deletePlan = trpc.floorPlans.delete.useMutation({
    onSuccess: () => { toast.success("Floor plan deleted"); utils.floorPlans.getAll.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  // Build lead count map per plan
  const leadCountMap: Record<number, number> = {};
  for (const r of pdfRequests ?? []) {
    leadCountMap[r.floorPlanId] = (leadCountMap[r.floorPlanId] ?? 0) + 1;
  }

  function handleDelete(plan: FloorPlan) {
    if (!confirm(`Delete "${plan.name}"? This cannot be undone.`)) return;
    deletePlan.mutate({ id: plan.id });
  }

  return (
    <div className="min-h-screen bg-[#f4f6fa] flex flex-col">
      <SCOPSNav adminUser={user ? { name: user.name ?? "Admin" } : null} currentPage="floor-plans" />

      {/* Slide-overs */}
      {editing === "new" && (
        <FloorPlanForm initial={null} onClose={() => setEditing(null)} onSaved={() => setEditing(null)} />
      )}
      {editing && editing !== "new" && (
        <FloorPlanForm initial={editing} onClose={() => setEditing(null)} onSaved={() => setEditing(null)} />
      )}
      {viewingLeads && (
        <PdfRequestsPanel plan={viewingLeads} onClose={() => setViewingLeads(null)} />
      )}

      <div className="flex-1 px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Floor Plans</h1>
            <p className="text-[12px] text-slate-400 mt-0.5">
              {plans?.length ?? 0} plan{(plans?.length ?? 0) !== 1 ? "s" : ""} · {Object.values(leadCountMap).reduce((a, b) => a + b, 0)} PDF leads total
            </p>
          </div>
          <Button onClick={() => setEditing("new")} className="gap-2">
            <span className="text-lg leading-none">+</span> New Floor Plan
          </Button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-20 text-slate-300 text-[13px]">Loading floor plans…</div>
        ) : (plans ?? []).length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-[13px]">
            No floor plans yet. Click <strong>New Floor Plan</strong> to add the first one.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Plan", "Specs", "Price", "PDF Leads", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[9px] font-bold text-slate-400 uppercase tracking-[0.06em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(plans ?? []).map(plan => {
                  const leads = leadCountMap[plan.id] ?? 0;
                  return (
                    <tr key={plan.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      {/* Plan */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {plan.imageUrl ? (
                            <img src={plan.imageUrl} alt={plan.name} className="w-12 h-10 object-cover rounded border border-slate-100 flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-10 rounded border border-slate-100 bg-slate-50 flex items-center justify-center text-slate-300 text-[18px] flex-shrink-0">🏠</div>
                          )}
                          <div>
                            <div className="text-[13px] font-semibold text-slate-800">{plan.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">/{plan.slug}</div>
                          </div>
                        </div>
                      </td>

                      {/* Specs */}
                      <td className="px-4 py-3">
                        <div className="text-[12px] text-slate-700">
                          {plan.sqft.toLocaleString()} sqft · {plan.beds}bd / {plan.baths}ba
                        </div>
                        <div className="text-[10px] text-slate-400">{plan.garage}-car garage</div>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3 text-[12px] font-semibold text-slate-800">
                        {plan.startingPrice
                          ? `$${plan.startingPrice.toLocaleString()}`
                          : <span className="text-slate-400 font-normal">Contact</span>}
                      </td>

                      {/* PDF Leads */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setViewingLeads(plan)}
                          className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors group"
                        >
                          <span className="text-[13px] font-bold text-slate-800 group-hover:text-indigo-600">{leads}</span>
                          {leads > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                          <span className="text-[10px] text-slate-400 group-hover:text-indigo-400">leads ↗</span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {plan.featured === 1 && (
                            <Badge variant="secondary" className="text-[9px] w-fit">Featured</Badge>
                          )}
                          {plan.pdfUrl ? (
                            <Badge className="text-[9px] w-fit bg-emerald-50 text-emerald-700 border-emerald-200">PDF ready</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] w-fit text-amber-600 border-amber-200">No PDF</Badge>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditing(plan)}
                            className="text-[11px] font-semibold text-indigo-600 hover:underline"
                          >Edit</button>
                          <span className="text-slate-200">|</span>
                          <a
                            href={`/floor-plans/${plan.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-semibold text-slate-500 hover:text-slate-700"
                          >View ↗</a>
                          <span className="text-slate-200">|</span>
                          <button
                            onClick={() => handleDelete(plan)}
                            className="text-[11px] font-semibold text-red-400 hover:text-red-600"
                          >Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer note */}
        <p className="text-[10px] text-slate-400 mt-4">
          Changes here update the public Floor Plans page at apollohomebuilders.com/floor-plans immediately.
        </p>
      </div>
    </div>
  );
}
