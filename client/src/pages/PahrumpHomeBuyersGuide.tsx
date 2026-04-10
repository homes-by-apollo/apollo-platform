import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { GlobalFooter } from "@/components/GlobalFooter";

const WHITE_OWL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/homes_by_apollo_white_a5a8cfc6.png";
const BOOK_COVER = "https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/2026-home-buyers-guide-cover_56befa3f.png";
const PDF_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/2026-Pahrump-Home-Buyers-Guide_ad685e4b.pdf";

const NAVY = "#0f2044";
const GOLD = "#c9a84c";

const WHATS_INSIDE = [
  { icon: "🏠", title: "Pahrump Market Overview", desc: "Median prices, absorption rates, and why 2026 is a buyer's window." },
  { icon: "💰", title: "Financing & Loan Programs", desc: "FHA, VA, USDA, and conventional options explained — plus preferred lenders." },
  { icon: "📐", title: "Floor Plan Comparison Guide", desc: "Side-by-side specs for every Apollo floor plan from 1,200 to 2,800 sq ft." },
  { icon: "📍", title: "Lot Selection Checklist", desc: "12 questions to ask before you choose a lot — utilities, views, HOA, and more." },
  { icon: "🔨", title: "The Build Process, Step by Step", desc: "From permit to keys — what happens at each stage and how long it takes." },
  { icon: "📋", title: "Warranty & After Move-In", desc: "Apollo's 1-2-10 warranty explained, plus what to expect in year one." },
];

const TESTIMONIALS = [
  { quote: "We signed up for the guide and got a call within 48 hours about a new lot that wasn't even on the website yet. Ended up being exactly what we wanted.", name: "Pahrump buyer, 2025" },
  { quote: "The financing chapter alone saved us from making a mistake with our loan. We didn't know USDA was an option out here.", name: "First-time buyer, Pahrump 2025" },
  { quote: "Honest, no-fluff information. We'd been burned by vague builder promises before — this guide was refreshingly specific.", name: "Retired couple relocating from Las Vegas" },
];

export default function PahrumpHomeBuyersGuide() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const subscribe = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      // Fire Plausible event
      if (typeof window !== "undefined" && (window as any).plausible) {
        (window as any).plausible("guide_download", { props: { source: "buyers-guide-landing" } });
      }
    },
    onError: (err) => setError(err.message || "Something went wrong. Please try again."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    subscribe.mutate({ email: email.trim(), source: "pahrump-home-buyers-guide" });
  };

  return (
    <div style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif", background: "#fff", minHeight: "100vh" }}>
      {/* ── NAV ── */}
      <nav style={{
        background: NAVY, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 32px", height: 72,
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src={WHITE_OWL} alt="Homes by Apollo" style={{ height: 52, width: 52, objectFit: "contain" }} />
          <div style={{ lineHeight: 1, display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "0.28em", textTransform: "uppercase" }}>HOMES BY</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "0.07em", lineHeight: 1 }}>APOLLO</span>
          </div>
        </a>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a href="/get-in-touch" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1.5px solid rgba(255,255,255,0.5)", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700, padding: "0 20px", borderRadius: 8, height: 44, letterSpacing: "0.04em", background: "transparent" }}>GET IN TOUCH ↗</a>
          <a href="/find-your-home" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: NAVY, border: "1.5px solid #fff", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700, padding: "0 20px", borderRadius: 8, height: 44, letterSpacing: "0.04em" }}>FIND YOUR HOME ↗</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{
        background: `linear-gradient(135deg, ${NAVY} 0%, #1a3a6b 60%, #0f2044 100%)`,
        padding: "64px 32px 0",
        overflow: "hidden",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 420px", gap: 64, alignItems: "flex-end" }}>
          {/* Left: headline + form */}
          <div style={{ paddingBottom: 64 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 16 }}>
              Free Download · 2026 Edition
            </p>
            <h1 style={{ fontSize: "clamp(32px, 4.5vw, 54px)", fontWeight: 900, color: "#fff", margin: "0 0 20px", lineHeight: 1.08, letterSpacing: "-0.02em" }}>
              The 2026 Pahrump<br />Home Buyer's Guide
            </h1>
            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.75)", maxWidth: 480, lineHeight: 1.65, margin: "0 0 36px" }}>
              Everything you need to buy or build a new home in Pahrump, Nevada — financing options, floor plan comparisons, lot selection, build timelines, and warranty coverage. 47 pages. Free.
            </p>

            {submitted ? (
              <div style={{ background: "rgba(201,168,76,0.15)", border: "1.5px solid rgba(201,168,76,0.5)", borderRadius: 12, padding: "24px 28px" }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: GOLD, margin: "0 0 8px" }}>Check your inbox!</p>
                <p style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", margin: "0 0 16px", lineHeight: 1.6 }}>
                  Your guide is on its way. While you wait, browse our available homes and lots.
                </p>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <a href={PDF_URL} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: GOLD, color: NAVY, textDecoration: "none", fontSize: 14, fontWeight: 700, padding: "12px 22px", borderRadius: 8, letterSpacing: "0.02em" }}>
                    ↓ Download PDF Now
                  </a>
                  <a href="/find-your-home" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", border: "1.5px solid rgba(255,255,255,0.4)", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700, padding: "12px 22px", borderRadius: 8, letterSpacing: "0.02em" }}>
                    Browse Homes →
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ display: "flex", gap: 0, maxWidth: 460 }}>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    style={{
                      flex: 1, height: 52, padding: "0 18px", fontSize: 15,
                      border: "none", borderRadius: "8px 0 0 8px",
                      outline: "none", background: "#fff", color: NAVY,
                    }}
                  />
                  <button
                    type="submit"
                    disabled={subscribe.isPending}
                    style={{
                      height: 52, padding: "0 24px", background: GOLD,
                      color: NAVY, border: "none", borderRadius: "0 8px 8px 0",
                      fontSize: 14, fontWeight: 800, cursor: "pointer",
                      letterSpacing: "0.04em", whiteSpace: "nowrap",
                      opacity: subscribe.isPending ? 0.7 : 1,
                    }}
                  >
                    {subscribe.isPending ? "Sending…" : "GET FREE GUIDE →"}
                  </button>
                </div>
                {error && <p style={{ fontSize: 13, color: "#ff8080", marginTop: 10 }}>{error}</p>}
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 10 }}>
                  No spam. Unsubscribe anytime. Your email is never shared.
                </p>
              </form>
            )}

            {/* Social proof strip */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 32 }}>
              <div style={{ display: "flex", gap: -6 }}>
                {["KR", "ML", "DP", "SJ"].map((initials, i) => (
                  <div key={i} style={{ width: 32, height: 32, borderRadius: "50%", background: ["#3b82f6","#10b981","#f59e0b","#8b5cf6"][i], border: "2px solid #0f2044", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", marginLeft: i === 0 ? 0 : -8 }}>
                    {initials}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: 0 }}>
                <strong style={{ color: "#fff" }}>1,200+ buyers</strong> downloaded this guide in the last 90 days
              </p>
            </div>
          </div>

          {/* Right: Book cover */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
            <img
              src={BOOK_COVER}
              alt="2026 Pahrump Home Buyer's Guide"
              style={{
                width: "100%", maxWidth: 380,
                filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.5))",
                transform: "perspective(800px) rotateY(-6deg) rotateX(2deg)",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── WHAT'S INSIDE ── */}
      <div style={{ background: "#f8f9fc", padding: "72px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase", textAlign: "center", marginBottom: 12 }}>
            Inside the Guide
          </p>
          <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, color: NAVY, textAlign: "center", margin: "0 0 48px", letterSpacing: "-0.02em" }}>
            47 pages. 6 chapters. No fluff.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            {WHATS_INSIDE.map(({ icon, title, desc }, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "28px 28px", border: "1px solid #e8ecf4", display: "flex", gap: 18, alignItems: "flex-start" }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "#f0f4ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                  {icon}
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, margin: "0 0 6px" }}>{title}</h3>
                  <p style={{ fontSize: 14, color: "#666", lineHeight: 1.65, margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TESTIMONIALS ── */}
      <div style={{ background: "#fff", padding: "72px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase", textAlign: "center", marginBottom: 12 }}>
            What Buyers Say
          </p>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: NAVY, textAlign: "center", margin: "0 0 48px", letterSpacing: "-0.02em" }}>
            Real feedback from Pahrump home buyers
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {TESTIMONIALS.map(({ quote, name }, i) => (
              <div key={i} style={{ background: "#f8f9fc", borderRadius: 14, padding: "28px", border: "1px solid #e8ecf4" }}>
                <div style={{ fontSize: 28, color: GOLD, lineHeight: 1, marginBottom: 12 }}>"</div>
                <p style={{ fontSize: 15, color: "#444", lineHeight: 1.7, fontStyle: "italic", margin: "0 0 16px" }}>{quote}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: 0 }}>— {name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM CTA ── */}
      <div style={{ background: NAVY, padding: "72px 32px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <img src={WHITE_OWL} alt="Homes by Apollo" style={{ height: 56, marginBottom: 20 }} />
          <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 900, color: "#fff", margin: "0 0 16px", letterSpacing: "-0.02em" }}>
            Ready to find your home in Pahrump?
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.7)", lineHeight: 1.65, margin: "0 0 36px" }}>
            The guide is the first step. When you're ready to talk lots, floor plans, and timelines, our team is here.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/get-in-touch" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: GOLD, color: NAVY, textDecoration: "none", fontSize: 15, fontWeight: 800, padding: "14px 28px", borderRadius: 8, letterSpacing: "0.02em" }}>
              Get in Touch ↗
            </a>
            <a href="/find-your-home" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "transparent", border: "1.5px solid rgba(255,255,255,0.4)", color: "#fff", textDecoration: "none", fontSize: 15, fontWeight: 700, padding: "14px 28px", borderRadius: 8, letterSpacing: "0.02em" }}>
              Browse Homes & Lots →
            </a>
          </div>
        </div>
      </div>

      <GlobalFooter />

      {/* ── MOBILE STYLES ── */}
      <style>{`
        @media (max-width: 768px) {
          .buyers-guide-hero-grid { grid-template-columns: 1fr !important; }
          .buyers-guide-book { display: none !important; }
        }
        @media (max-width: 480px) {
          .buyers-guide-form-row { flex-direction: column !important; }
          .buyers-guide-form-row input { border-radius: 8px !important; }
          .buyers-guide-form-row button { border-radius: 8px !important; height: 48px !important; }
        }
      `}</style>
    </div>
  );
}
