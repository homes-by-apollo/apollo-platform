import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { GlobalFooter } from "@/components/GlobalFooter";

export default function ListingAlerts() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [propertyType, setPropertyType] = useState<"HOME" | "LOT" | "BOTH">("BOTH");
  const [priceMax, setPriceMax] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const subscribe = trpc.floorPlans.subscribeListingAlerts.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (e) => setError(e.message),
  });

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!email) { setError("Email is required"); return; }
    setError("");
    subscribe.mutate({
      email,
      name: name || undefined,
      propertyType,
      priceMax: priceMax ? Number(priceMax) : undefined,
    });
  };

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
          <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/apollo-logo-white_e0b7e6c2.png" alt="Homes by Apollo" style={{ height: 44, width: 44, objectFit: "contain" }} />
          <div style={{ lineHeight: 1, display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: "0.28em", textTransform: "uppercase" }}>HOMES BY</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "0.07em", lineHeight: 1 }}>APOLLO</span>
          </div>
        </a>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a href="/get-in-touch" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1.5px solid rgba(255,255,255,0.5)", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700, padding: "0 20px", borderRadius: 8, height: 44, letterSpacing: "0.04em", background: "transparent" }}>GET IN TOUCH ↗</a>
          <a href="/find-your-home" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#0f2044", border: "1.5px solid #fff", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 700, padding: "0 20px", borderRadius: 8, height: 44, letterSpacing: "0.04em" }}>FIND YOUR HOME ↗</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #0f2044 0%, #1a3a6b 100%)",
        padding: "72px 32px 64px", textAlign: "center",
      }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#e07b39", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 14 }}>
          New Listing Alerts
        </p>
        <h1 style={{ fontSize: "clamp(30px, 5vw, 50px)", fontWeight: 800, color: "#fff", margin: "0 0 18px", lineHeight: 1.1 }}>
          Be First to Know When<br />New Homes Hit the Market
        </h1>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.72)", maxWidth: 520, margin: "0 auto", lineHeight: 1.6 }}>
          Sign up for instant email alerts when new homes or lots are added in Pahrump, NV. No spam — just new listings that match your criteria.
        </p>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "56px 32px 80px", display: "grid", gridTemplateColumns: "1fr 420px", gap: 56, alignItems: "start" }}>

        {/* Left: Benefits */}
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0f2044", marginBottom: 24 }}>
            Why Sign Up?
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              {
                icon: "⚡",
                title: "Instant Alerts",
                desc: "Get notified the moment a new home or lot is listed — before it shows up on Zillow or Realtor.com.",
              },
              {
                icon: "🎯",
                title: "Filtered for You",
                desc: "Tell us what you're looking for — home, lot, or both — and we'll only send you relevant listings.",
              },
              {
                icon: "💰",
                title: "Price Range Match",
                desc: "Set a max budget and we'll only alert you when listings fall within your range.",
              },
              {
                icon: "🏠",
                title: "New Construction Only",
                desc: "Every Apollo listing is brand-new construction — no fixer-uppers, no surprises.",
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "#f0f4ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                  {icon}
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f2044", margin: "0 0 6px" }}>{title}</h3>
                  <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6, margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div style={{ marginTop: 40, background: "#fff", borderRadius: 12, padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: 14, color: "#555", lineHeight: 1.7, fontStyle: "italic", margin: "0 0 12px" }}>
              "We signed up for alerts and got a call within 48 hours about a new lot that wasn't even on the website yet. Ended up being exactly what we wanted."
            </p>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#0f2044", margin: 0 }}>— Pahrump buyer, 2025</p>
          </div>
        </div>

        {/* Right: Form */}
        <div>
          {submitted ? (
            <div style={{ background: "#fff", borderRadius: 16, padding: "40px 32px", boxShadow: "0 4px 24px rgba(0,0,0,0.1)", textAlign: "center" }}>
              <div style={{ fontSize: 56, marginBottom: 20 }}>🔔</div>
              <h3 style={{ fontFamily: "Manrope, sans-serif", fontSize: 22, fontWeight: 700, color: "#0f2044", marginBottom: 12 }}>
                You're on the list!
              </h3>
              <p style={{ color: "#555", lineHeight: 1.6, marginBottom: 24 }}>
                We'll email you the moment a new listing matches your criteria. Check your inbox for a confirmation.
              </p>
              <a href="/find-your-home" style={{ background: "#0f2044", color: "#fff", textDecoration: "none", fontSize: 15, fontWeight: 700, padding: "13px 28px", borderRadius: 8, display: "inline-block" }}>
                Browse Current Listings →
              </a>
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 16, padding: "36px 32px", boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }}>
              <h3 style={{ fontFamily: "Manrope, sans-serif", fontSize: 20, fontWeight: 700, color: "#0f2044", marginBottom: 6 }}>
                Set Up Your Alert
              </h3>
              <p style={{ color: "#666", fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
                Free. No obligation. Unsubscribe anytime.
              </p>
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

                {/* Property type */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#444", display: "block", marginBottom: 8 }}>I'm interested in:</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {(["BOTH", "HOME", "LOT"] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setPropertyType(t)}
                        style={{
                          flex: 1, padding: "9px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                          border: propertyType === t ? "none" : "1.5px solid #d1d9e6",
                          background: propertyType === t ? "#0f2044" : "#fff",
                          color: propertyType === t ? "#fff" : "#444",
                          transition: "all 0.15s",
                          fontFamily: "Manrope, sans-serif",
                        }}
                      >
                        {t === "BOTH" ? "Homes & Lots" : t === "HOME" ? "Homes" : "Lots"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Max price */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#444", display: "block", marginBottom: 8 }}>Max budget (optional):</label>
                  <select
                    value={priceMax}
                    onChange={e => setPriceMax(e.target.value)}
                    style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "12px 14px", fontSize: 15, fontFamily: "Manrope, sans-serif", outline: "none", background: "#fff", color: "#444" }}
                  >
                    <option value="">No maximum</option>
                    <option value="300000">Under $300,000</option>
                    <option value="400000">Under $400,000</option>
                    <option value="500000">Under $500,000</option>
                    <option value="600000">Under $600,000</option>
                    <option value="750000">Under $750,000</option>
                  </select>
                </div>

                {error && <p style={{ color: "#e53e3e", fontSize: 13 }}>{error}</p>}

                <button
                  type="submit"
                  disabled={subscribe.isPending}
                  style={{
                    background: "#0f2044", color: "#fff", border: "none", borderRadius: 8,
                    padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: "pointer",
                    fontFamily: "Manrope, sans-serif", marginTop: 4,
                    opacity: subscribe.isPending ? 0.7 : 1,
                  }}
                >
                  {subscribe.isPending ? "Setting up alert…" : "🔔 Alert Me to New Listings"}
                </button>
                <p style={{ fontSize: 12, color: "#999", textAlign: "center" }}>
                  No spam. Unsubscribe anytime.
                </p>
              </form>
            </div>
          )}
        </div>
      </div>

      <GlobalFooter />
    </div>
  );
}
