import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { GlobalFooter } from "@/components/GlobalFooter";
import { useLocation } from "wouter";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FloorPlan {
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
  featured: number;
}

// ─── PDF Gate Modal ───────────────────────────────────────────────────────────

function PdfGateModal({
  plan,
  onClose,
}: {
  plan: FloorPlan;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const requestPdf = trpc.floorPlans.requestPdf.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (e) => setError(e.message),
  });

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!email) { setError("Email is required"); return; }
    setError("");
    requestPdf.mutate({ floorPlanId: plan.id, name, email, phone });
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.55)", display: "flex",
        alignItems: "center", justifyContent: "center", padding: "20px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 16, padding: "40px 36px",
        maxWidth: 480, width: "100%", position: "relative",
        boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
      }}>
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 16, right: 20, background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#888" }}
        >×</button>

        {submitted ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
            <h3 style={{ fontFamily: "Manrope, sans-serif", fontSize: 22, fontWeight: 700, color: "#0f2044", marginBottom: 12 }}>
              Floor Plan Sent!
            </h3>
            <p style={{ color: "#555", lineHeight: 1.6 }}>
              Check your inbox for the <strong>{plan.name}</strong> floor plan details. We'll follow up shortly.
            </p>
            <button
              onClick={onClose}
              style={{ marginTop: 24, background: "#0f2044", color: "#fff", border: "none", borderRadius: 8, padding: "12px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "Manrope, sans-serif" }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h3 style={{ fontFamily: "Manrope, sans-serif", fontSize: 20, fontWeight: 700, color: "#0f2044", marginBottom: 6 }}>
              Get the {plan.name} Floor Plan
            </h3>
            <p style={{ color: "#666", fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
              Enter your info below and we'll send you the full floor plan with pricing details.
            </p>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "11px 14px", fontSize: 15, fontFamily: "Manrope, sans-serif", outline: "none" }}
              />
              <input
                type="email"
                placeholder="Email address *"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "11px 14px", fontSize: 15, fontFamily: "Manrope, sans-serif", outline: "none" }}
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "11px 14px", fontSize: 15, fontFamily: "Manrope, sans-serif", outline: "none" }}
              />
              {error && <p style={{ color: "#e53e3e", fontSize: 13 }}>{error}</p>}
              <button
                type="submit"
                disabled={requestPdf.isPending}
                style={{
                  background: "#0f2044", color: "#fff", border: "none", borderRadius: 8,
                  padding: "13px 0", fontSize: 15, fontWeight: 700, cursor: "pointer",
                  fontFamily: "Manrope, sans-serif", marginTop: 4,
                  opacity: requestPdf.isPending ? 0.7 : 1,
                }}
              >
                {requestPdf.isPending ? "Sending…" : "Send Me the Floor Plan →"}
              </button>
              <p style={{ fontSize: 12, color: "#999", textAlign: "center", marginTop: 4 }}>
                No spam. Unsubscribe anytime.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Floor Plan Card ──────────────────────────────────────────────────────────

const FALLBACK_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/pahrump-home-1_27807d49.jpg";

function FloorPlanCard({
  plan,
  onRequestPdf,
  onClick,
}: {
  plan: FloorPlan;
  onRequestPdf: () => void;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: hovered ? "0 12px 40px rgba(15,32,68,0.13)" : "0 2px 12px rgba(0,0,0,0.07)",
        transition: "box-shadow 0.2s, transform 0.2s",
        transform: hovered ? "translateY(-3px)" : "none",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Image */}
      <div onClick={onClick} style={{ position: "relative", height: 220, overflow: "hidden", flexShrink: 0 }}>
        <img
          src={plan.imageUrl || FALLBACK_IMG}
          alt={plan.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s", transform: hovered ? "scale(1.04)" : "scale(1)" }}
        />
        {plan.featured === 1 && (
          <span style={{
            position: "absolute", top: 14, left: 14,
            background: "#e07b39", color: "#fff",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
            padding: "4px 10px", borderRadius: 20, textTransform: "uppercase",
          }}>Featured</span>
        )}
      </div>

      {/* Content */}
      <div onClick={onClick} style={{ padding: "22px 24px 16px", flex: 1 }}>
        <h3 style={{ fontFamily: "Manrope, sans-serif", fontSize: 20, fontWeight: 700, color: "#0f2044", margin: "0 0 6px" }}>
          {plan.name}
        </h3>
        {plan.startingPrice && (
          <p style={{ fontSize: 17, fontWeight: 700, color: "#e07b39", margin: "0 0 14px" }}>
            From ${plan.startingPrice.toLocaleString()}
          </p>
        )}
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 14 }}>
          {[
            { icon: "⬜", label: `${plan.sqft.toLocaleString()} sqft` },
            { icon: "🛏", label: `${plan.beds} bed` },
            { icon: "🚿", label: `${plan.baths} bath` },
            { icon: "🚗", label: `${plan.garage}-car garage` },
          ].map(({ icon, label }) => (
            <span key={label} style={{ fontSize: 13, color: "#555", display: "flex", alignItems: "center", gap: 5 }}>
              <span>{icon}</span> {label}
            </span>
          ))}
        </div>
        {plan.description && (
          <p style={{ fontSize: 14, color: "#666", lineHeight: 1.55, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {plan.description}
          </p>
        )}
      </div>

      {/* CTA */}
      <div style={{ padding: "0 24px 22px", display: "flex", gap: 10 }}>
        <button
          onClick={(e) => { e.stopPropagation(); onRequestPdf(); }}
          style={{
            flex: 1, background: "#0f2044", color: "#fff", border: "none",
            borderRadius: 8, padding: "11px 0", fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: "Manrope, sans-serif",
          }}
        >
          Get Floor Plan
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          style={{
            flex: 1, background: "transparent", color: "#0f2044",
            border: "1.5px solid #0f2044", borderRadius: 8, padding: "11px 0",
            fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Manrope, sans-serif",
          }}
        >
          View Details
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FloorPlans() {
  const [, setLocation] = useLocation();
  const [bedsFilter, setBedsFilter] = useState<number | null>(null);
  const [maxSqft, setMaxSqft] = useState<number | null>(null);
  const [gateTarget, setGateTarget] = useState<FloorPlan | null>(null);

  const { data: plans = [], isLoading } = trpc.floorPlans.getAll.useQuery(
    bedsFilter || maxSqft
      ? { beds: bedsFilter ?? undefined, maxSqft: maxSqft ?? undefined }
      : undefined
  );

  const bedOptions = [null, 2, 3, 4, 5];
  const sqftOptions = [
    { label: "Any size", value: null },
    { label: "Under 1,500 sqft", value: 1500 },
    { label: "Under 2,000 sqft", value: 2000 },
    { label: "Under 2,500 sqft", value: 2500 },
  ];

  return (
    <div style={{ fontFamily: "Manrope, sans-serif", minHeight: "100vh", background: "#f8f9fb" }}>
      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "#0f2044", padding: "0 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 68, boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/apollo-logo-white_e0b7e6c2.png" alt="Apollo Home Builders" style={{ height: 40 }} />
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.18em", textTransform: "uppercase" }}>Home Builders</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em", lineHeight: 1 }}>Apollo</div>
          </div>
        </a>
        <div style={{ display: "flex", gap: 12 }}>
          <a href="/find-your-home" style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none", fontSize: 14, fontWeight: 600, padding: "8px 16px" }}>View Homes</a>
          <a href="/get-in-touch" style={{ background: "#e07b39", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700, padding: "9px 20px", borderRadius: 8 }}>Get in Touch</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #0f2044 0%, #1a3a6b 100%)",
        padding: "72px 32px 64px", textAlign: "center",
      }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#e07b39", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 14 }}>
          Floor Plan Lookbook
        </p>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, color: "#fff", margin: "0 0 18px", lineHeight: 1.1 }}>
          Find Your Perfect Floor Plan
        </h1>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.72)", maxWidth: 560, margin: "0 auto 32px", lineHeight: 1.6 }}>
          Browse our 9 available floor plans — from 1,200 to 2,448 sqft — all built new in Pahrump, NV. Request any plan to receive full details and pricing.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="#plans" style={{ background: "#e07b39", color: "#fff", textDecoration: "none", fontSize: 15, fontWeight: 700, padding: "13px 28px", borderRadius: 8 }}>
            Browse Plans ↓
          </a>
          <a href="/get-in-touch" style={{ background: "transparent", color: "#fff", textDecoration: "none", fontSize: 15, fontWeight: 600, padding: "13px 28px", borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.35)" }}>
            Talk to an Agent
          </a>
        </div>
      </div>

      {/* Filters */}
      <div id="plans" style={{ background: "#fff", borderBottom: "1px solid #e8ecf2", padding: "20px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#555", marginRight: 4 }}>Filter:</span>

          {/* Beds filter */}
          <div style={{ display: "flex", gap: 8 }}>
            {bedOptions.map(b => (
              <button
                key={b ?? "any"}
                onClick={() => setBedsFilter(b)}
                style={{
                  padding: "7px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  border: bedsFilter === b ? "none" : "1.5px solid #d1d9e6",
                  background: bedsFilter === b ? "#0f2044" : "#fff",
                  color: bedsFilter === b ? "#fff" : "#444",
                  transition: "all 0.15s",
                }}
              >
                {b === null ? "Any beds" : `${b}+ bed`}
              </button>
            ))}
          </div>

          {/* Sqft filter */}
          <select
            value={maxSqft ?? ""}
            onChange={e => setMaxSqft(e.target.value ? Number(e.target.value) : null)}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1.5px solid #d1d9e6", fontSize: 13, fontWeight: 600, color: "#444", background: "#fff", cursor: "pointer" }}
          >
            {sqftOptions.map(o => (
              <option key={o.label} value={o.value ?? ""}>{o.label}</option>
            ))}
          </select>

          <span style={{ marginLeft: "auto", fontSize: 13, color: "#888" }}>
            {isLoading ? "Loading…" : `${plans.length} plan${plans.length !== 1 ? "s" : ""}`}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 32px 80px" }}>
        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 28 }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ background: "#e8ecf2", borderRadius: 16, height: 380, animation: "pulse 1.5s ease-in-out infinite" }} />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#888" }}>
            <p style={{ fontSize: 18 }}>No floor plans match your filters.</p>
            <button onClick={() => { setBedsFilter(null); setMaxSqft(null); }} style={{ marginTop: 16, color: "#0f2044", background: "none", border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 28 }}>
            {(plans as FloorPlan[]).map(plan => (
              <FloorPlanCard
                key={plan.id}
                plan={plan}
                onRequestPdf={() => setGateTarget(plan)}
                onClick={() => setLocation(`/floor-plans/${plan.slug}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lead capture strip */}
      <div style={{ background: "#0f2044", padding: "64px 32px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "Manrope, sans-serif", fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "#fff", marginBottom: 14 }}>
          Not sure which plan is right for you?
        </h2>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 17, maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.6 }}>
          Talk to our team about which floor plan fits your lifestyle and budget.
        </p>
        <a href="/get-in-touch" style={{ background: "#e07b39", color: "#fff", textDecoration: "none", fontSize: 15, fontWeight: 700, padding: "14px 32px", borderRadius: 8, display: "inline-block" }}>
          Get in Touch →
        </a>
      </div>

      <GlobalFooter />

      {/* PDF Gate Modal */}
      {gateTarget && (
        <PdfGateModal plan={gateTarget} onClose={() => setGateTarget(null)} />
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }
      `}</style>
    </div>
  );
}
