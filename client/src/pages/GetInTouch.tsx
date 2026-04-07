import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { GlobalFooter } from "@/components/GlobalFooter";
import { useLocation } from "wouter";

const LOGO_OWL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/homes_by_apollo_clean-Edited_22d5e06c.png";
const NAVY = "#0f2044";
const GOLD = "#c9a84c";
const BOR = "#e5e7eb";
const MUT = "#6b7280";

type Step1 = { name: string; contact: string };
type Step2 = { timeline: string; priceRange: string; financing: string; message: string };

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="8" fill="#22c55e" />
      <path d="M4.5 8.5L6.5 10.5L11.5 5.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function GetInTouch() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<1 | 2 | "success">(1);
  const [step1, setStep1] = useState<Step1>({ name: "", contact: "" });
  const [step2, setStep2] = useState<Step2>({ timeline: "", priceRange: "", financing: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [interestedIn, setInterestedIn] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prop = params.get("property");
    if (prop) setInterestedIn(decodeURIComponent(prop));
    // Load Calendly script for success state
    if (!document.getElementById("calendly-script")) {
      const s = document.createElement("script");
      s.id = "calendly-script";
      s.src = "https://assets.calendly.com/assets/external/widget.js";
      s.async = true;
      document.head.appendChild(s);
    }
  }, []);

  const submitMutation = trpc.leads.submit.useMutation({
    onSuccess: () => setStep("success"),
  });

  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isPhone = (v: string) => /^[\d\s\-\+\(\)]{7,}$/.test(v);

  function validateStep1() {
    const e: Record<string, string> = {};
    if (!step1.name.trim()) e.name = "Name is required";
    if (!step1.contact.trim()) {
      e.contact = "Phone or email is required";
    } else if (!isEmail(step1.contact) && !isPhone(step1.contact)) {
      e.contact = "Enter a valid phone number or email address";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleStep1Submit() {
    if (!validateStep1()) return;
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleFinalSubmit() {
    const parts = step1.name.trim().split(" ");
    const firstName = parts[0] || step1.name;
    const lastName = parts.slice(1).join(" ") || "-";
    const emailVal = isEmail(step1.contact) ? step1.contact : undefined;
    const phoneVal = !isEmail(step1.contact) && isPhone(step1.contact) ? step1.contact : undefined;
    const finalEmail = emailVal ?? `${step1.contact.replace(/\D/g, "")}@noemail.local`;
    const finalPhone = phoneVal ?? step1.contact;
    const priceMap: Record<string, [number, number]> = {
      "300_400": [300000, 400000], "400_500": [400000, 500000],
      "500_600": [500000, 600000], "600_plus": [600000, 999999],
    };
    const [prMin, prMax] = step2.priceRange ? (priceMap[step2.priceRange] ?? [undefined, undefined]) : [undefined, undefined];
    const messageBody = [step2.message || "", interestedIn ? `Interested in: ${interestedIn}` : ""].filter(Boolean).join("\n\n");
    submitMutation.mutate({
      contactType: "BUYER",
      firstName, lastName,
      email: finalEmail,
      phone: finalPhone,
      timeline: step2.timeline ? step2.timeline as "ASAP" | "1_3_MONTHS" | "3_6_MONTHS" | "6_12_MONTHS" | "JUST_BROWSING" : undefined,
      priceRangeMin: prMin,
      priceRangeMax: prMax,
      financingStatus: step2.financing ? step2.financing as "PRE_APPROVED" | "IN_PROCESS" | "NOT_STARTED" | "CASH_BUYER" : undefined,
      message: messageBody || undefined,
      landingPage: "/get-in-touch",
    });
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "14px 16px", borderRadius: 10,
    border: `1.5px solid ${BOR}`, fontSize: 16, outline: "none",
    color: NAVY, background: "white", fontFamily: "inherit",
    transition: "border-color 0.15s", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: NAVY, display: "block", marginBottom: 6 };
  const errorStyle: React.CSSProperties = { fontSize: 12, color: "#dc2626", marginTop: 4 };

  return (
    <div style={{ minHeight: "100vh", background: "white", fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif" }}>
      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${BOR}`, padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "white", zIndex: 100 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src={LOGO_OWL} alt="Apollo" style={{ height: 40, width: 40, objectFit: "contain" }} />
          <div style={{ lineHeight: 1, display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.28em", color: NAVY, textTransform: "uppercase" }}>HOMES BY</span>
            <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: "0.06em", color: NAVY }}>APOLLO</span>
          </div>
        </a>
        <a href="tel:7753631616" style={{ fontSize: 14, fontWeight: 600, color: NAVY, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
          (775) 363-1616
        </a>
      </nav>

      {/* Main */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div className="git-grid" style={{ display: "grid", gridTemplateColumns: "1fr 440px", gap: 64, alignItems: "start" }}>
          {/* Left copy */}
          <div className="git-left">
            <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Free Consultation</div>
            <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.1, color: NAVY, margin: "0 0 16px" }}>
              Find Your Home in Pahrump &mdash; Get Pricing &amp; Availability Today
            </h1>
            <p style={{ fontSize: 17, color: MUT, lineHeight: 1.7, marginBottom: 28 }}>
              Talk to a builder, not a salesperson. We'll help you find the right home, timeline, and financing options.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 40 }}>
              {["Homes starting in the $300s", "Move-in ready + build options", "Limited inventory in Pahrump"].map(b => (
                <div key={b} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, fontWeight: 500, color: NAVY }}>
                  <CheckIcon />{b}
                </div>
              ))}
            </div>
            {interestedIn && (
              <div style={{ background: "#f0f7ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 16px", marginBottom: 28, fontSize: 14, color: "#1e40af", fontWeight: 500 }}>
                <span style={{ fontWeight: 700 }}>Interested in:</span> {interestedIn}
              </div>
            )}
            <div style={{ background: "#fafafa", border: `1px solid ${BOR}`, borderRadius: 14, padding: "20px 24px", marginBottom: 40 }}>
              <div style={{ color: GOLD, fontSize: 18, marginBottom: 8, letterSpacing: 2 }}>&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              <p style={{ fontSize: 15, color: NAVY, lineHeight: 1.65, fontStyle: "italic", margin: "0 0 10px" }}>
                "Best home buying experience we've had. Transparent pricing and fast build."
              </p>
              <div style={{ fontSize: 13, color: MUT, fontWeight: 600 }}>— Recent Buyer, Pahrump NV</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Phone", val: "(775) 363-1616", href: "tel:7753631616" },
                { label: "Email", val: "brandon@apollohomebuilders.com", href: "mailto:brandon@apollohomebuilders.com" },
                { label: "Office", val: "5158 Arville St, Las Vegas, NV 89118", href: undefined },
                { label: "License", val: "NV No. 0077907", href: undefined },
              ].map(({ label, val, href }) => (
                <div key={label} style={{ display: "flex", gap: 12, fontSize: 14 }}>
                  <span style={{ fontWeight: 700, color: NAVY, minWidth: 56 }}>{label}:</span>
                  {href ? <a href={href} style={{ color: MUT, textDecoration: "none" }}>{val}</a> : <span style={{ color: MUT }}>{val}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Right form */}
          <div className="git-right">
            {step === "success" ? (
              <div style={{ background: "white", border: `1px solid ${BOR}`, borderRadius: 20, padding: 36, boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }}>
                <div style={{ textAlign: "center", marginBottom: 28 }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M6 16L12 22L26 10" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: NAVY, marginBottom: 8 }}>You're on the list!</h2>
                  <p style={{ fontSize: 15, color: MUT, lineHeight: 1.6 }}>We'll be in touch within 5 minutes during business hours. Schedule a call below.</p>
                </div>
                <div style={{ background: "#f8fafc", borderRadius: 14, border: `1px solid ${BOR}`, overflow: "hidden", marginBottom: 20 }}>
                  <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BOR}`, fontSize: 13, fontWeight: 600, color: NAVY }}>Schedule a Call</div>
                  <div className="calendly-inline-widget" data-url="https://calendly.com/d/cyjg-rx9-q39/meeting?hide_event_type_details=1" style={{ minWidth: 320, height: 500 }} />
                </div>
                <button onClick={() => setLocation("/")} style={{ width: "100%", padding: "13px", borderRadius: 10, border: `1.5px solid ${BOR}`, background: "white", fontSize: 14, fontWeight: 600, color: NAVY, cursor: "pointer", fontFamily: "inherit" }}>
                  ← Back to Homepage
                </button>
              </div>
            ) : (
              <div style={{ background: "white", border: `1px solid ${BOR}`, borderRadius: 20, padding: 36, boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }}>
                {/* Step indicator */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
                  {([1, 2] as const).map(n => (
                    <div key={n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: step >= n ? NAVY : "#f3f4f6", color: step >= n ? "white" : MUT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, transition: "all 0.2s" }}>
                        {(step as number) > n ? "✓" : n}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: step >= n ? NAVY : MUT }}>{n === 1 ? "Your Info" : "Your Search"}</span>
                      {n < 2 && <div style={{ width: 24, height: 1, background: (step as number) > 1 ? NAVY : BOR, margin: "0 4px" }} />}
                    </div>
                  ))}
                </div>

                {step === 1 ? (
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 6 }}>Get Available Homes</h2>
                    <p style={{ fontSize: 14, color: MUT, marginBottom: 24 }}>We'll send you current availability and pricing right away.</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div>
                        <label style={labelStyle}>Full Name *</label>
                        <input type="text" placeholder="John Smith" value={step1.name} onChange={e => setStep1({ ...step1, name: e.target.value })}
                          style={{ ...inputStyle, borderColor: errors.name ? "#dc2626" : BOR }}
                          onFocus={e => { e.currentTarget.style.borderColor = NAVY; }} onBlur={e => { e.currentTarget.style.borderColor = errors.name ? "#dc2626" : BOR; }}
                          onKeyDown={e => e.key === "Enter" && handleStep1Submit()} />
                        {errors.name && <div style={errorStyle}>{errors.name}</div>}
                      </div>
                      <div>
                        <label style={labelStyle}>Phone or Email *</label>
                        <input type="text" placeholder="(702) 555-0100 or you@email.com" value={step1.contact} onChange={e => setStep1({ ...step1, contact: e.target.value })}
                          style={{ ...inputStyle, borderColor: errors.contact ? "#dc2626" : BOR }}
                          onFocus={e => { e.currentTarget.style.borderColor = NAVY; }} onBlur={e => { e.currentTarget.style.borderColor = errors.contact ? "#dc2626" : BOR; }}
                          onKeyDown={e => e.key === "Enter" && handleStep1Submit()} />
                        {errors.contact && <div style={errorStyle}>{errors.contact}</div>}
                      </div>
                      <button onClick={handleStep1Submit}
                        style={{ width: "100%", padding: "15px", borderRadius: 10, border: "none", background: NAVY, color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s", marginTop: 4 }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#1a3460"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = NAVY; }}>
                        Get Available Homes &#8594;
                      </button>
                      <p style={{ fontSize: 12, color: MUT, textAlign: "center", margin: 0 }}>We respond within 5 minutes during business hours</p>
                      <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${BOR}`, textAlign: "center" }}>
                        <p style={{ fontSize: 13, color: MUT, marginBottom: 8 }}>Prefer to talk now?</p>
                        <a href="https://calendly.com/d/cyjg-rx9-q39/meeting" target="_blank" rel="noreferrer" style={{ fontSize: 14, fontWeight: 600, color: NAVY, textDecoration: "none" }}>Schedule a call &#8594;</a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 6 }}>Tell Us More</h2>
                    <p style={{ fontSize: 14, color: MUT, marginBottom: 24 }}>Help us find the right match. All fields are optional.</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div>
                        <label style={labelStyle}>Timeline</label>
                        <select value={step2.timeline} onChange={e => setStep2({ ...step2, timeline: e.target.value })} style={{ ...inputStyle, color: step2.timeline ? NAVY : MUT }}>
                          <option value="">When are you looking to move?</option>
                          <option value="ASAP">ASAP — I'm ready now</option>
                          <option value="1_3_MONTHS">1–3 months</option>
                          <option value="3_6_MONTHS">3–6 months</option>
                          <option value="6_12_MONTHS">6–12 months</option>
                          <option value="JUST_BROWSING">Just browsing</option>
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Price Range</label>
                        <select value={step2.priceRange} onChange={e => setStep2({ ...step2, priceRange: e.target.value })} style={{ ...inputStyle, color: step2.priceRange ? NAVY : MUT }}>
                          <option value="">Select your budget</option>
                          <option value="300_400">$300K–$400K</option>
                          <option value="400_500">$400K–$500K</option>
                          <option value="500_600">$500K–$600K</option>
                          <option value="600_plus">$600K+</option>
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Financing Status</label>
                        <select value={step2.financing} onChange={e => setStep2({ ...step2, financing: e.target.value })} style={{ ...inputStyle, color: step2.financing ? NAVY : MUT }}>
                          <option value="">Where are you with financing?</option>
                          <option value="PRE_APPROVED">Pre-approved</option>
                          <option value="IN_PROCESS">In process</option>
                          <option value="NOT_STARTED">Not started yet</option>
                          <option value="CASH_BUYER">Cash buyer</option>
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Message <span style={{ fontWeight: 400, color: MUT }}>(optional)</span></label>
                        <textarea placeholder="Tell us what you're looking for..." rows={3} value={step2.message} onChange={e => setStep2({ ...step2, message: e.target.value })}
                          style={{ ...inputStyle, resize: "vertical" }}
                          onFocus={e => { e.currentTarget.style.borderColor = NAVY; }} onBlur={e => { e.currentTarget.style.borderColor = BOR; }} />
                      </div>
                      {submitMutation.isError && (
                        <div style={{ background: "#fff0f0", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#dc2626" }}>
                          Something went wrong. Please try again or call us at (775) 363-1616.
                        </div>
                      )}
                      <button onClick={handleFinalSubmit} disabled={submitMutation.isPending}
                        style={{ width: "100%", padding: "15px", borderRadius: 10, border: "none", background: submitMutation.isPending ? "#6b7a99" : NAVY, color: "white", fontSize: 15, fontWeight: 700, cursor: submitMutation.isPending ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "background 0.15s" }}>
                        {submitMutation.isPending ? "Checking availability\u2026" : "Check Availability \u2192"}
                      </button>
                      <p style={{ fontSize: 12, color: MUT, textAlign: "center", margin: 0 }}>We respond within 5 minutes during business hours</p>
                      <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: MUT, fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: 0, textAlign: "center" }}>&#8592; Back</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .git-grid { grid-template-columns: 1fr !important; }
          .git-left { order: 2; }
          .git-right { order: 1; }
          .git-sticky { display: flex !important; }
        }
      `}</style>
      <div className="git-sticky" style={{ display: "none", position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200, background: "white", borderTop: `1px solid ${BOR}`, padding: "12px 16px", boxShadow: "0 -4px 24px rgba(0,0,0,0.10)" }}>
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ flex: 1, background: NAVY, color: "white", border: "none", borderRadius: 10, padding: "14px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Get Available Homes &#8594;
        </button>
      </div>

      <GlobalFooter />
    </div>
  );
}
