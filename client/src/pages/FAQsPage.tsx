import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { GlobalFooter } from "@/components/GlobalFooter";

const LOGO_OWL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/homes_by_apollo_clean-Edited_22d5e06c.png";
const NAVY = "#0f2044";
const GOLD = "#c9a84c";
const BOR = "#e5e7eb";
const MUT = "#6b7280";

const allFaqs: { category: string; icon: string; items: [string, string][] }[] = [
  {
    category: "Pricing & Financing",
    icon: "💰",
    items: [
      [
        "How much does it cost to build with Apollo?",
        "Our all-inclusive homes typically start in the low $300s for standard builds. Pricing scales based on lot size, floor plan, and finishes. Every quote is fixed-price. No change-order surprises.",
      ],
      [
        "What's included in the all-inclusive price?",
        "Everything needed to deliver a move-in ready home: land prep, foundation, framing, roofing, electrical, plumbing, HVAC, drywall, finishes, appliances, and basic landscaping. One number. No hidden costs.",
      ],
      [
        "Do you help buyers secure financing?",
        "Yes. We partner with lenders experienced in construction-to-permanent loans and can connect you early so financing never delays your timeline.",
      ],
      [
        "Can I use my own lender?",
        "Absolutely. We just recommend your lender understands construction draw schedules and milestone-based funding.",
      ],
    ],
  },
  {
    category: "Build Process",
    icon: "🏗️",
    items: [
      [
        "How long does it take from contract to keys?",
        "Most homes take 6–9 months. Larger or custom builds may take 9–12 months. You'll receive a detailed schedule at contract signing.",
      ],
      [
        "What happens after I sign a contract?",
        "We finalize your plan and selections, submit permits (typically 4–8 weeks), then begin construction. You'll receive updates throughout every stage.",
      ],
      [
        "Can I visit the site during construction?",
        "Yes. We schedule formal walkthroughs at key milestones, and you can request visits anytime with notice.",
      ],
      [
        "Can I make changes after construction starts?",
        "Minor finish changes may be possible early. Structural changes require approvals and may impact cost and timeline. We'll outline all implications upfront.",
      ],
    ],
  },
  {
    category: "Lots & Location",
    icon: "📍",
    items: [
      [
        "Do you have lots available now?",
        "Yes. We have lots throughout Pahrump ranging from 0.25 to 1+ acres starting around $45,000.",
      ],
      [
        "Can I build on my own lot?",
        "Yes. We'll evaluate your lot for utilities, setbacks, and build feasibility before finalizing your quote.",
      ],
      [
        "Why build in Pahrump?",
        "No state income tax, lower land costs, and strong growth. Just 60 minutes from Las Vegas, making it ideal for both primary homes and investment properties.",
      ],
    ],
  },
  {
    category: "Warranty & After Move-In",
    icon: "🛡️",
    items: [
      [
        "What warranty does Apollo provide?",
        "1-year workmanship, 2-year systems (plumbing, electrical, HVAC), and 10-year structural warranty.",
      ],
      [
        "How do I submit a warranty request?",
        "Email hello@apollohomebuilders.com or call our office. We respond within 1 business day and schedule repairs quickly.",
      ],
      [
        "Do you build multi-family or investment properties?",
        "Yes. We build duplexes and small multi-unit properties. Get in touch to discuss your goals.",
      ],
    ],
  },
];

function AccordionItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${BOR}`, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "20px 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 600, color: NAVY, lineHeight: 1.4 }}>{question}</span>
        <span
          style={{
            flexShrink: 0,
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: open ? NAVY : "#f3f4f6",
            color: open ? "white" : MUT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 700,
            transition: "all 0.2s",
          }}
        >
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div style={{ paddingBottom: 20, paddingRight: 44 }}>
          <p style={{ fontSize: 15, color: MUT, lineHeight: 1.75, margin: 0 }}>{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQsPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const displayFaqs = activeCategory
    ? allFaqs.filter(f => f.category === activeCategory)
    : allFaqs;

  // Build JSON-LD FAQ schema from all Q&A pairs
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allFaqs.flatMap(cat =>
      cat.items.map(([q, a]) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: {
          "@type": "Answer",
          text: a,
        },
      }))
    ),
  };

  return (
    <div style={{ minHeight: "100vh", background: "white", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Helmet>
        <title>FAQs | Apollo Home Builders — Pahrump, NV</title>
        <meta name="description" content="Answers to the most common questions about building a new home with Apollo in Pahrump, Nevada. Pricing, financing, build timeline, lots, and warranty." />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>
      {/* ── Nav ── */}
      <nav style={{ borderBottom: `1px solid ${BOR}`, padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "white", zIndex: 100 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <img src={LOGO_OWL} alt="Apollo" style={{ height: 40, width: 40, objectFit: "contain" }} />
          <div style={{ lineHeight: 1, display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.28em", color: NAVY, textTransform: "uppercase" }}>HOMES BY</span>
            <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: "0.06em", color: NAVY }}>APOLLO</span>
          </div>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <a href="/blog" style={{ fontSize: 14, fontWeight: 500, color: MUT, textDecoration: "none" }}>Blog</a>
          <a href="/get-in-touch" style={{ fontSize: 14, fontWeight: 700, color: "white", background: NAVY, padding: "9px 18px", borderRadius: 8, textDecoration: "none" }}>
            Get In Touch
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1a3460 100%)`, padding: "72px 24px 80px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 16 }}>
            Frequently Asked Questions
          </div>
          <h1 style={{ fontSize: "clamp(28px,4.5vw,48px)", fontWeight: 800, color: "white", letterSpacing: "-0.025em", lineHeight: 1.12, margin: "0 0 16px" }}>
            Everything you need to know about building with Apollo
          </h1>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.72)", lineHeight: 1.65, margin: "0 0 28px" }}>
            Have a question not covered here? Call us at{" "}
            <a href="tel:+17753631616" style={{ color: GOLD, textDecoration: "none", fontWeight: 600 }}>(775) 363-1616</a>{" "}
            or get in touch with our team.
          </p>
          <a
            href="/get-in-touch"
            style={{ display: "inline-block", background: GOLD, color: NAVY, fontWeight: 800, fontSize: 15, padding: "14px 28px", borderRadius: 10, textDecoration: "none" }}
          >
            Get In Touch →
          </a>
        </div>
      </div>

      {/* ── Category filter ── */}
      <div style={{ borderBottom: `1px solid ${BOR}`, padding: "0 24px", background: "white", position: "sticky", top: 64, zIndex: 90 }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", gap: 4, overflowX: "auto", padding: "12px 0" }}>
          <button
            onClick={() => setActiveCategory(null)}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit",
              fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
              background: activeCategory === null ? NAVY : "#f3f4f6",
              color: activeCategory === null ? "white" : MUT,
              transition: "all 0.15s",
            }}
          >
            All Questions
          </button>
          {allFaqs.map(f => (
            <button
              key={f.category}
              onClick={() => setActiveCategory(activeCategory === f.category ? null : f.category)}
              style={{
                padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit",
                fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
                background: activeCategory === f.category ? NAVY : "#f3f4f6",
                color: activeCategory === f.category ? "white" : MUT,
                transition: "all 0.15s",
              }}
            >
              {f.icon} {f.category}
            </button>
          ))}
        </div>
      </div>

      {/* ── FAQ Content ── */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "56px 24px 80px" }}>
        {displayFaqs.map(section => (
          <div key={section.category} style={{ marginBottom: 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <span style={{ fontSize: 22 }}>{section.icon}</span>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: NAVY, margin: 0, letterSpacing: "-0.015em" }}>{section.category}</h2>
            </div>
            <div style={{ background: "white", borderRadius: 16, border: `1px solid ${BOR}`, padding: "0 28px", boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
              {section.items.map(([q, a]) => (
                <AccordionItem key={q} question={q} answer={a} />
              ))}
            </div>
          </div>
        ))}

        {/* ── Bottom CTA ── */}
        <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1a3460 100%)`, borderRadius: 20, padding: "48px 40px", textAlign: "center", marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>
            Still have questions?
          </div>
          <h3 style={{ fontSize: 26, fontWeight: 800, color: "white", letterSpacing: "-0.02em", margin: "0 0 10px" }}>
            Let's talk. No pressure. Just clear answers.
          </h3>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", lineHeight: 1.65, margin: "0 0 28px", maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
            Talk to a builder, not a salesperson. We'll send you current homes and lots in Pahrump with real pricing.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="/get-in-touch"
              style={{ display: "inline-block", background: GOLD, color: NAVY, fontWeight: 800, fontSize: 15, padding: "14px 28px", borderRadius: 10, textDecoration: "none" }}
            >
              Check Availability →
            </a>
            <a
              href="tel:+17753631616"
              style={{ display: "inline-block", background: "rgba(255,255,255,0.1)", color: "white", fontWeight: 600, fontSize: 15, padding: "14px 28px", borderRadius: 10, textDecoration: "none", border: "1.5px solid rgba(255,255,255,0.2)" }}
            >
              Call (775) 363-1616
            </a>
          </div>
        </div>
      </div>

      <GlobalFooter />
    </div>
  );
}
