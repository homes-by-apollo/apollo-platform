import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { GlobalFooter } from "@/components/GlobalFooter";

// ─── Calendly Widget ──────────────────────────────────────────────────────────

function CalendlyEmbed({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!document.querySelector('script[src*="calendly.com/assets/external/widget.js"]')) {
      const script = document.createElement("script");
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="calendly-inline-widget"
      data-url={url}
      style={{ minWidth: 320, height: "clamp(500px, 70vh, 700px)", width: "100%" }}
    />
  );
}

// ─── Intake Form ──────────────────────────────────────────────────────────────

function IntakeForm({ onSubmit }: { onSubmit: () => void }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    lotAddress: "",
    apn: "",
    goals: "",
    timeline: "",
  });
  const [error, setError] = useState("");

  const submit = trpc.floorPlans.submitLotAnalysis.useMutation({
    onSuccess: () => onSubmit(),
    onError: (e) => setError(e.message),
  });

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form.name || !form.email) { setError("Name and email are required"); return; }
    setError("");
    submit.mutate(form);
  };

  const inputStyle = {
    border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "12px 14px",
    fontSize: 15, fontFamily: "Manrope, sans-serif", outline: "none", width: "100%",
    boxSizing: "border-box" as const,
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#444", display: "block", marginBottom: 6 }}>Full Name *</label>
          <input type="text" placeholder="John Smith" value={form.name} onChange={handleChange("name")} required style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#444", display: "block", marginBottom: 6 }}>Email *</label>
          <input type="email" placeholder="john@email.com" value={form.email} onChange={handleChange("email")} required style={inputStyle} />
        </div>
      </div>

      <div>
        <label style={{ fontSize: 13, fontWeight: 700, color: "#444", display: "block", marginBottom: 6 }}>Phone</label>
        <input type="tel" placeholder="(775) 555-0100" value={form.phone} onChange={handleChange("phone")} style={inputStyle} />
      </div>

      <div>
        <label style={{ fontSize: 13, fontWeight: 700, color: "#444", display: "block", marginBottom: 6 }}>Lot Address or Location</label>
        <input type="text" placeholder="e.g. 420 E Calvada Blvd, Pahrump NV" value={form.lotAddress} onChange={handleChange("lotAddress")} style={inputStyle} />
      </div>

      <div>
        <label style={{ fontSize: 13, fontWeight: 700, color: "#444", display: "block", marginBottom: 6 }}>APN (Assessor Parcel Number) — if known</label>
        <input type="text" placeholder="e.g. 37-241-01" value={form.apn} onChange={handleChange("apn")} style={inputStyle} />
      </div>

      <div>
        <label style={{ fontSize: 13, fontWeight: 700, color: "#444", display: "block", marginBottom: 6 }}>What are your goals for this lot?</label>
        <textarea
          placeholder="e.g. Build a 3-bed home for retirement, want to understand buildability and utility hookups..."
          value={form.goals}
          onChange={handleChange("goals")}
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      <div>
        <label style={{ fontSize: 13, fontWeight: 700, color: "#444", display: "block", marginBottom: 6 }}>Build Timeline</label>
        <select value={form.timeline} onChange={handleChange("timeline")} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="">Select a timeline</option>
          <option value="asap">As soon as possible</option>
          <option value="3-6mo">3–6 months</option>
          <option value="6-12mo">6–12 months</option>
          <option value="1-2yr">1–2 years</option>
          <option value="exploring">Just exploring</option>
        </select>
      </div>

      {error && <p style={{ color: "#e53e3e", fontSize: 13 }}>{error}</p>}

      <button
        type="submit"
        disabled={submit.isPending}
        style={{
          background: "#0f2044", color: "#fff", border: "none", borderRadius: 8,
          padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: "pointer",
          fontFamily: "Manrope, sans-serif", marginTop: 4,
          opacity: submit.isPending ? 0.7 : 1,
        }}
      >
        {submit.isPending ? "Submitting…" : "Submit & Schedule My Analysis →"}
      </button>
      <p style={{ fontSize: 12, color: "#999", textAlign: "center" }}>
        Free consultation. No obligation. We'll review your lot before the call.
      </p>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FreeLotAnalysis() {
  const [step, setStep] = useState<"form" | "schedule">("form");

  return (
    <div style={{ fontFamily: "Manrope, sans-serif", minHeight: "100vh", background: "#f8f9fb" }}>
      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "#0f2044", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68, boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}>
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
      <div style={{ background: "linear-gradient(135deg, #0f2044 0%, #1a3a6b 100%)", padding: "72px 32px 64px", textAlign: "center" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#e07b39", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 14 }}>
          Free Lot Analysis
        </p>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 50px)", fontWeight: 800, color: "#fff", margin: "0 0 18px", lineHeight: 1.1 }}>
          Is Your Lot Buildable?<br />Find Out for Free.
        </h1>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.72)", maxWidth: 540, margin: "0 auto 32px", lineHeight: 1.6 }}>
          Our team will personally evaluate your Pahrump lot for buildability — utilities, setbacks, zoning, and soil — before you spend a dollar on permits.
        </p>
        {/* Step indicator */}
        <div style={{ display: "flex", gap: 0, justifyContent: "center", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: step === "form" ? "#e07b39" : "rgba(255,255,255,0.3)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>1</div>
            <span style={{ color: step === "form" ? "#fff" : "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600 }}>Tell Us About Your Lot</span>
          </div>
          <div style={{ width: 40, height: 2, background: "rgba(255,255,255,0.2)", margin: "0 12px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: step === "schedule" ? "#e07b39" : "rgba(255,255,255,0.3)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>2</div>
            <span style={{ color: step === "schedule" ? "#fff" : "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600 }}>Schedule Your Call</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "56px 32px 80px" }}>
        {step === "form" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 48, alignItems: "start" }}>
            {/* Form */}
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0f2044", marginBottom: 8 }}>Step 1: Tell Us About Your Lot</h2>
              <p style={{ color: "#666", fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>
                Share what you know about your lot and your goals. We'll review the details before your call so we can give you specific, actionable feedback.
              </p>
              <div style={{ background: "#fff", borderRadius: 16, padding: "32px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
                <IntakeForm onSubmit={() => setStep("schedule")} />
              </div>
            </div>

            {/* What we check */}
            <div style={{ position: "sticky", top: 88 }}>
              <div style={{ background: "#fff", borderRadius: 16, padding: "28px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: 20 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#0f2044", marginBottom: 16 }}>What We Evaluate</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { icon: "⚡", label: "Utility hookups", desc: "Water, sewer, electric availability" },
                    { icon: "📐", label: "Setbacks & zoning", desc: "Buildable area and use restrictions" },
                    { icon: "🌍", label: "Soil & grading", desc: "Foundation suitability and drainage" },
                    { icon: "🏗️", label: "Permit requirements", desc: "Nye County process and timeline" },
                    { icon: "💰", label: "Cost estimate", desc: "Rough build cost for your lot" },
                  ].map(({ icon, label, desc }) => (
                    <div key={label} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f2044" }}>{label}</div>
                        <div style={{ fontSize: 12, color: "#888" }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: "#f0f4ff", borderRadius: 12, padding: "20px", textAlign: "center" }}>
                <p style={{ fontSize: 14, color: "#0f2044", fontWeight: 700, marginBottom: 4 }}>100% Free</p>
                <p style={{ fontSize: 13, color: "#666", margin: 0 }}>No cost, no obligation. We do this because we build in Pahrump and want to help buyers make informed decisions.</p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#e6f4ea", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px" }}>✓</div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0f2044", marginBottom: 8 }}>
                Lot Details Received!
              </h2>
              <p style={{ color: "#666", fontSize: 16, maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
                Now pick a time that works for you. We'll review your lot details before the call so we can give you specific feedback right away.
              </p>
            </div>
            <div style={{ background: "#fff", borderRadius: 16, padding: "8px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", maxWidth: 720, margin: "0 auto" }}>
              <CalendlyEmbed url="https://calendly.com/d/cyjg-rx9-q39/meeting" />
            </div>
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <button
                onClick={() => setStep("form")}
                style={{ color: "#888", background: "none", border: "none", fontSize: 14, cursor: "pointer", textDecoration: "underline", fontFamily: "Manrope, sans-serif" }}
              >
                ← Edit my lot details
              </button>
            </div>
          </div>
        )}
      </div>

      {/* What happens next */}
      {step === "form" && (
        <div style={{ background: "#fff", borderTop: "1px solid #e8ecf2", padding: "56px 32px" }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0f2044", marginBottom: 32, textAlign: "center" }}>What Happens After You Submit</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
              {[
                { step: "1", title: "We review your lot", desc: "Our team looks up your parcel, checks county records, and reviews utility maps before the call." },
                { step: "2", title: "You schedule a call", desc: "Pick a 30-minute slot that works for you. We'll send a calendar invite with a Zoom link." },
                { step: "3", title: "You get real answers", desc: "On the call, we walk through buildability, estimated costs, and next steps — no sales pitch." },
              ].map(({ step: s, title, desc }) => (
                <div key={s} style={{ textAlign: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#0f2044", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, margin: "0 auto 16px" }}>{s}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f2044", marginBottom: 8 }}>{title}</h3>
                  <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6, margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <GlobalFooter />
    </div>
  );
}
