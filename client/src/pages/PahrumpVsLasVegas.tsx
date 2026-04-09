import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { GlobalFooter } from "@/components/GlobalFooter";

// ─── Email Gate Modal ─────────────────────────────────────────────────────────

function EmailGateModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const subscribe = trpc.floorPlans.subscribeListingAlerts.useMutation({
    onSuccess: () => onSuccess(),
    onError: (e) => setError(e.message),
  });

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!email) { setError("Email is required"); return; }
    setError("");
    subscribe.mutate({ email, name: name || undefined, propertyType: "BOTH" });
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#fff", borderRadius: 16, padding: "40px 36px", maxWidth: 460, width: "100%", position: "relative", boxShadow: "0 24px 80px rgba(0,0,0,0.2)" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 20, background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#888" }}>×</button>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <h3 style={{ fontFamily: "Manrope, sans-serif", fontSize: 22, fontWeight: 700, color: "#0f2044", marginBottom: 8 }}>
            Download the Full Comparison
          </h3>
          <p style={{ color: "#666", fontSize: 14, lineHeight: 1.5 }}>
            Get the complete Pahrump vs. Las Vegas cost breakdown — land prices, taxes, commute data, and lifestyle comparison — sent directly to your inbox.
          </p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)}
            style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "12px 14px", fontSize: 15, fontFamily: "Manrope, sans-serif", outline: "none" }} />
          <input type="email" placeholder="Email address *" value={email} onChange={e => setEmail(e.target.value)} required
            style={{ border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "12px 14px", fontSize: 15, fontFamily: "Manrope, sans-serif", outline: "none" }} />
          {error && <p style={{ color: "#e53e3e", fontSize: 13 }}>{error}</p>}
          <button type="submit" disabled={subscribe.isPending}
            style={{ background: "#0f2044", color: "#fff", border: "none", borderRadius: 8, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "Manrope, sans-serif", opacity: subscribe.isPending ? 0.7 : 1 }}>
            {subscribe.isPending ? "Sending…" : "Send Me the Full Report →"}
          </button>
          <p style={{ fontSize: 12, color: "#999", textAlign: "center" }}>No spam. Unsubscribe anytime.</p>
        </form>
      </div>
    </div>
  );
}

// ─── Comparison data ──────────────────────────────────────────────────────────

const rows = [
  { category: "Median Home Price", pahrump: "$320,000", lasvegas: "$450,000+", winner: "pahrump", note: "New construction in Pahrump starts ~$280K" },
  { category: "Land / Lot Cost", pahrump: "$30K–$80K", lasvegas: "$120K–$300K+", winner: "pahrump", note: "Pahrump lots are 1–2.5 acres; LV lots are fractions" },
  { category: "Property Tax Rate", pahrump: "~0.6%", lasvegas: "~0.6%", winner: "tie", note: "Both in Nevada — no state income tax" },
  { category: "HOA Fees", pahrump: "None / minimal", lasvegas: "$100–$400/mo", winner: "pahrump", note: "Most Pahrump properties have no HOA" },
  { category: "Cost of Living Index", pahrump: "~85", lasvegas: "~105", winner: "pahrump", note: "Groceries, utilities, and services all cheaper" },
  { category: "Commute to Las Vegas", pahrump: "60–75 min", lasvegas: "0 min", winner: "lasvegas", note: "US-160 via Mountain Springs — scenic drive" },
  { category: "Lot Size", pahrump: "1–5 acres typical", lasvegas: "0.1–0.2 acres typical", winner: "pahrump", note: "Room for RV, shop, horses, or guest house" },
  { category: "Traffic / Congestion", pahrump: "Very low", lasvegas: "High", winner: "pahrump", note: "No freeway gridlock; open roads" },
  { category: "Air Quality", pahrump: "Excellent", lasvegas: "Moderate", winner: "pahrump", note: "Less urban pollution; clean desert air" },
  { category: "Community Size", pahrump: "~40,000 residents", lasvegas: "~650,000 city", winner: "tie", note: "Depends on lifestyle preference" },
  { category: "Schools", pahrump: "Nye County USD", lasvegas: "Clark County USD", winner: "tie", note: "Both served by Nevada public school districts" },
  { category: "New Construction Availability", pahrump: "High — many open lots", lasvegas: "Limited — mostly infill", winner: "pahrump", note: "Apollo builds new on open land" },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PahrumpVsLasVegas() {
  const [showGate, setShowGate] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  return (
    <div style={{ fontFamily: "Manrope, sans-serif", minHeight: "100vh", background: "#f8f9fb" }}>
      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "#0f2044", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68, boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/apollo-logo-white_e0b7e6c2.png" alt="Homes by Apollo" style={{ height: 36 }} />
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.18em", textTransform: "uppercase" }}>Homes by</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em", lineHeight: 1 }}>Apollo</div>
          </div>
        </a>
        <div style={{ display: "flex", gap: 12 }}>
          <a href="/find-your-home" style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none", fontSize: 14, fontWeight: 600, padding: "8px 16px" }}>View Homes</a>
          <a href="/get-in-touch" style={{ background: "#e07b39", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700, padding: "9px 20px", borderRadius: 8 }}>Get in Touch</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #0f2044 0%, #1a3a6b 100%)", padding: "72px 32px 64px", textAlign: "center" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#e07b39", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 14 }}>
          Free Comparison Guide
        </p>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 800, color: "#fff", margin: "0 0 18px", lineHeight: 1.1 }}>
          Pahrump vs. Las Vegas:<br />The True Cost of Living
        </h1>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.72)", maxWidth: 560, margin: "0 auto 32px", lineHeight: 1.6 }}>
          Side-by-side comparison of land prices, taxes, commute, and lifestyle. See exactly how much you save by choosing Pahrump.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="#comparison" style={{ background: "#e07b39", color: "#fff", textDecoration: "none", fontSize: 15, fontWeight: 700, padding: "13px 28px", borderRadius: 8 }}>
            See the Comparison ↓
          </a>
          <button
            onClick={() => setShowGate(true)}
            style={{ background: "transparent", color: "#fff", border: "1.5px solid rgba(255,255,255,0.35)", fontSize: 15, fontWeight: 600, padding: "13px 28px", borderRadius: 8, cursor: "pointer", fontFamily: "Manrope, sans-serif" }}
          >
            Download Full Report
          </button>
        </div>
      </div>

      {/* Key stats bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e8ecf2", padding: "28px 32px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 0, justifyContent: "space-around", flexWrap: "wrap" }}>
          {[
            { stat: "30%", label: "Lower home prices" },
            { stat: "0", label: "State income tax (NV)" },
            { stat: "$0", label: "HOA fees typical" },
            { stat: "1–5 ac", label: "Lot sizes available" },
          ].map(({ stat, label }) => (
            <div key={label} style={{ textAlign: "center", padding: "8px 24px" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#0f2044" }}>{stat}</div>
              <div style={{ fontSize: 13, color: "#888", fontWeight: 600, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison table */}
      <div id="comparison" style={{ maxWidth: 960, margin: "0 auto", padding: "56px 32px 80px" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0f2044", marginBottom: 8, textAlign: "center" }}>
          Head-to-Head Comparison
        </h2>
        <p style={{ color: "#666", textAlign: "center", marginBottom: 40, fontSize: 15 }}>
          Based on 2024–2025 market data for Pahrump, NV and Las Vegas metro.
        </p>

        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 0, marginBottom: 8 }}>
          <div style={{ padding: "12px 20px", fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em" }}>Category</div>
          <div style={{ padding: "12px 20px", background: "#0f2044", borderRadius: "12px 0 0 0", fontSize: 14, fontWeight: 700, color: "#fff", textAlign: "center" }}>
            🏜️ Pahrump, NV
          </div>
          <div style={{ padding: "12px 20px", background: "#e8ecf2", borderRadius: "0 12px 0 0", fontSize: 14, fontWeight: 700, color: "#555", textAlign: "center" }}>
            🎰 Las Vegas
          </div>
        </div>

        {/* Table rows */}
        {rows.map((row, i) => (
          <div key={row.category} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 0, borderBottom: "1px solid #e8ecf2", background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>
            <div style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#0f2044" }}>{row.category}</div>
              {row.note && <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>{row.note}</div>}
            </div>
            <div style={{
              padding: "16px 20px", textAlign: "center", fontSize: 15, fontWeight: 700,
              color: row.winner === "pahrump" ? "#16a34a" : row.winner === "tie" ? "#555" : "#555",
              background: row.winner === "pahrump" ? "rgba(22,163,74,0.06)" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              {row.winner === "pahrump" && <span style={{ color: "#16a34a" }}>✓</span>}
              {row.pahrump}
            </div>
            <div style={{
              padding: "16px 20px", textAlign: "center", fontSize: 15, fontWeight: row.winner === "lasvegas" ? 700 : 500,
              color: row.winner === "lasvegas" ? "#16a34a" : "#888",
              background: row.winner === "lasvegas" ? "rgba(22,163,74,0.06)" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              {row.winner === "lasvegas" && <span style={{ color: "#16a34a" }}>✓</span>}
              {row.lasvegas}
            </div>
          </div>
        ))}

        {/* Table footer */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 0 }}>
          <div style={{ padding: "16px 20px", background: "#f8f9fb", borderRadius: "0 0 0 12px" }} />
          <div style={{ padding: "16px 20px", background: "#0f2044", textAlign: "center", borderRadius: "0 0 0 0" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Winner</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginTop: 4 }}>Pahrump</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>9 of 12 categories</div>
          </div>
          <div style={{ padding: "16px 20px", background: "#e8ecf2", textAlign: "center", borderRadius: "0 0 12px 0" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em" }}>Las Vegas</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#555", marginTop: 4 }}>1 category</div>
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Commute only</div>
          </div>
        </div>

        {/* Download CTA */}
        <div style={{ marginTop: 48, background: "linear-gradient(135deg, #0f2044 0%, #1a3a6b 100%)", borderRadius: 16, padding: "40px 36px", textAlign: "center" }}>
          <h3 style={{ fontFamily: "Manrope, sans-serif", fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 12 }}>
            Want the Full Report?
          </h3>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, maxWidth: 420, margin: "0 auto 24px", lineHeight: 1.6 }}>
            Get the complete PDF with detailed data sources, financing comparisons, and a personalized cost calculator.
          </p>
          {downloaded ? (
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "16px 24px", display: "inline-block" }}>
              <p style={{ color: "#fff", fontWeight: 700, margin: 0 }}>✓ Check your inbox — the full report is on its way!</p>
            </div>
          ) : (
            <button
              onClick={() => setShowGate(true)}
              style={{ background: "#e07b39", color: "#fff", border: "none", borderRadius: 8, padding: "14px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "Manrope, sans-serif" }}
            >
              Download the Full Report →
            </button>
          )}
        </div>

        {/* Narrative section */}
        <div style={{ marginTop: 56 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0f2044", marginBottom: 24 }}>Why Las Vegas Escapees Choose Pahrump</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {[
              {
                title: "Your dollar goes further",
                body: "The same budget that buys a 1,400 sqft townhome in Henderson gets you a 2,000+ sqft new construction home on a full acre in Pahrump. That's not a compromise — that's an upgrade.",
              },
              {
                title: "No HOA. No drama.",
                body: "Most Pahrump properties have zero HOA fees. Park your RV, build a shop, get a few chickens. Your land, your rules — something that's nearly impossible in Las Vegas subdivisions.",
              },
              {
                title: "Still close to everything",
                body: "Pahrump is 60–75 minutes from the Las Vegas Strip via a scenic mountain highway. Close enough for day trips, far enough to escape the noise and cost.",
              },
              {
                title: "New construction, not fixer-uppers",
                body: "Apollo builds brand-new homes from the ground up. No deferred maintenance, no surprises, no bidding wars on aging inventory. Move-in ready on your timeline.",
              },
            ].map(({ title, body }) => (
              <div key={title} style={{ background: "#fff", borderRadius: 12, padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f2044", marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div style={{ marginTop: 56, textAlign: "center" }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0f2044", marginBottom: 12 }}>Ready to Make the Move?</h2>
          <p style={{ color: "#666", fontSize: 16, maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.6 }}>
            Talk to our team about available homes and lots in Pahrump. No pressure — just honest answers.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/get-in-touch" style={{ background: "#0f2044", color: "#fff", textDecoration: "none", fontSize: 15, fontWeight: 700, padding: "13px 28px", borderRadius: 8 }}>
              Schedule a Free Call →
            </a>
            <a href="/find-your-home" style={{ background: "transparent", color: "#0f2044", textDecoration: "none", fontSize: 15, fontWeight: 600, padding: "13px 28px", borderRadius: 8, border: "1.5px solid #0f2044" }}>
              Browse Available Homes
            </a>
          </div>
        </div>
      </div>

      <GlobalFooter />

      {showGate && (
        <EmailGateModal
          onClose={() => setShowGate(false)}
          onSuccess={() => { setShowGate(false); setDownloaded(true); }}
        />
      )}
    </div>
  );
}
