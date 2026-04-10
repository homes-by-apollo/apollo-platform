import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { GlobalFooter } from "@/components/GlobalFooter";

const FALLBACK_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/pahrump-home-1_27807d49.jpg";

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

// ─── PDF Gate Form ────────────────────────────────────────────────────────────

function PdfGateForm({ plan }: { plan: FloorPlan }) {
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

  if (submitted) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>✓</div>
        <h3 style={{ fontFamily: "Manrope, sans-serif", fontSize: 22, fontWeight: 700, color: "#0f2044", marginBottom: 12 }}>
          Floor Plan Sent!
        </h3>
        <p style={{ color: "#555", lineHeight: 1.6 }}>
          Check your inbox for the <strong>{plan.name}</strong> floor plan details. Our team will follow up shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={e => setName(e.target.value)}
        style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "12px 14px", fontSize: 15, fontFamily: "Manrope, sans-serif", outline: "none" }}
      />
      <input
        type="email"
        placeholder="Email address *"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "12px 14px", fontSize: 15, fontFamily: "Manrope, sans-serif", outline: "none" }}
      />
      <input
        type="tel"
        placeholder="Phone (optional)"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "12px 14px", fontSize: 15, fontFamily: "Manrope, sans-serif", outline: "none" }}
      />
      {error && <p style={{ color: "#e53e3e", fontSize: 13 }}>{error}</p>}
      <button
        type="submit"
        disabled={requestPdf.isPending}
        style={{
          background: "#0f2044", color: "#fff", border: "none", borderRadius: 8,
          padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: "pointer",
          fontFamily: "Manrope, sans-serif", marginTop: 4,
          opacity: requestPdf.isPending ? 0.7 : 1,
        }}
      >
        {requestPdf.isPending ? "Sending…" : "Send Me the Floor Plan →"}
      </button>
      <p style={{ fontSize: 12, color: "#999", textAlign: "center" }}>
        No spam. Unsubscribe anytime.
      </p>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FloorPlanDetail() {
  const [, params] = useRoute("/floor-plans/:slug");
  const [, setLocation] = useLocation();
  const slug = params?.slug ?? "";

  const { data: plan, isLoading, error } = trpc.floorPlans.getBySlug.useQuery({ slug }, {
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div style={{ fontFamily: "Manrope, sans-serif", minHeight: "100vh", background: "#f8f9fb", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#888", fontSize: 18 }}>Loading floor plan…</p>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div style={{ fontFamily: "Manrope, sans-serif", minHeight: "100vh", background: "#f8f9fb", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <p style={{ color: "#888", fontSize: 18 }}>Floor plan not found.</p>
        <button onClick={() => setLocation("/floor-plans")} style={{ color: "#0f2044", background: "none", border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>
          ← Back to Floor Plans
        </button>
      </div>
    );
  }

  const fp = plan as FloorPlan;

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
          <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/homes_by_apollo_white_a5a8cfc6.png" alt="Homes by Apollo" style={{ height: 52, width: 52, objectFit: "contain" }} />
          <div style={{ lineHeight: 1, display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "0.28em", textTransform: "uppercase" }}>HOMES BY</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "0.07em", lineHeight: 1 }}>APOLLO</span>
          </div>
        </a>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a href="/get-in-touch" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1.5px solid rgba(255,255,255,0.5)", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700, padding: "0 20px", borderRadius: 8, height: 44, letterSpacing: "0.04em", background: "transparent" }}>GET IN TOUCH ↗</a>
          <a href="/find-your-home" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#0f2044", border: "1.5px solid #fff", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700, padding: "0 20px", borderRadius: 8, height: 44, letterSpacing: "0.04em" }}>FIND YOUR HOME ↗</a>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e8ecf2", padding: "14px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", fontSize: 13, color: "#888" }}>
          <a href="/" style={{ color: "#888", textDecoration: "none" }}>Home</a>
          {" / "}
          <a href="/floor-plans" style={{ color: "#888", textDecoration: "none" }}>Floor Plans</a>
          {" / "}
          <span style={{ color: "#0f2044", fontWeight: 600 }}>{fp.name}</span>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 32px 80px", display: "grid", gridTemplateColumns: "1fr 400px", gap: 48, alignItems: "start" }}>

        {/* Left: Image + details */}
        <div>
          <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }}>
            <img
              src={fp.imageUrl || FALLBACK_IMG}
              alt={fp.name}
              style={{ width: "100%", height: 420, objectFit: "cover", display: "block" }}
            />
          </div>

          <h1 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: "#0f2044", margin: "0 0 8px" }}>
            {fp.name}
          </h1>
          {fp.startingPrice && (
            <p style={{ fontSize: 22, fontWeight: 700, color: "#e07b39", margin: "0 0 24px" }}>
              Starting from ${fp.startingPrice.toLocaleString()}
            </p>
          )}

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
            {[
              { label: "Square Feet", value: fp.sqft.toLocaleString() },
              { label: "Bedrooms", value: String(fp.beds) },
              { label: "Bathrooms", value: fp.baths },
              { label: "Garage", value: `${fp.garage}-car` },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: "#fff", borderRadius: 12, padding: "18px 16px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0f2044", marginBottom: 4 }}>{value}</div>
                <div style={{ fontSize: 12, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
              </div>
            ))}
          </div>

          {fp.description && (
            <div style={{ background: "#fff", borderRadius: 12, padding: "28px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f2044", marginBottom: 14 }}>About This Floor Plan</h2>
              <p style={{ color: "#555", lineHeight: 1.7, fontSize: 15, margin: 0 }}>{fp.description}</p>
            </div>
          )}

          {/* What's included */}
          <div style={{ background: "#fff", borderRadius: 12, padding: "28px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginTop: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f2044", marginBottom: 18 }}>What's Included</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                "New construction — move-in ready",
                "Energy-efficient design",
                "Open-concept living areas",
                "Modern kitchen with island",
                "Primary suite with walk-in closet",
                "Covered patio / outdoor space",
                "2–3 car attached garage",
                "Pahrump, NV location",
              ].map(item => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#444" }}>
                  <span style={{ color: "#e07b39", fontWeight: 700 }}>✓</span> {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Sticky PDF gate form */}
        <div style={{ position: "sticky", top: 88 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "32px", boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }}>
            <h3 style={{ fontFamily: "Manrope, sans-serif", fontSize: 20, fontWeight: 700, color: "#0f2044", marginBottom: 6 }}>
              Get the {fp.name} Floor Plan
            </h3>
            <p style={{ color: "#666", fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
              Enter your info and we'll send you the full floor plan with pricing details.
            </p>
            <PdfGateForm plan={fp} />
          </div>

          <div style={{ background: "#f0f4ff", borderRadius: 12, padding: "20px", marginTop: 16, textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#0f2044", fontWeight: 600, marginBottom: 8 }}>
              Want to see this plan in person?
            </p>
            <a href="/get-in-touch" style={{ color: "#e07b39", textDecoration: "none", fontSize: 14, fontWeight: 700 }}>
              Schedule a Free Tour →
            </a>
          </div>
        </div>
      </div>

      {/* Related plans */}
      <div style={{ background: "#fff", padding: "56px 32px", borderTop: "1px solid #e8ecf2" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0f2044", marginBottom: 8 }}>Browse All Floor Plans</h2>
          <p style={{ color: "#666", marginBottom: 28 }}>We have 9 plans available — find the one that fits your family.</p>
          <a href="/floor-plans" style={{ background: "#0f2044", color: "#fff", textDecoration: "none", fontSize: 15, fontWeight: 700, padding: "13px 28px", borderRadius: 8, display: "inline-block" }}>
            View All Floor Plans →
          </a>
        </div>
      </div>

      <GlobalFooter />

      <style>{`
        @media (max-width: 768px) {
          .fp-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
