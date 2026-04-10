import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { GlobalFooter } from "@/components/GlobalFooter";
import { Helmet } from "react-helmet-async";

const COVER_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/2026-home-buyers-guide-cover_56befa3f.png";
const PDF_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/2026-Pahrump-Home-Buyers-Guide_ad685e4b.pdf";
const GUIDE_SHARE_URL = "https://apollohomebuilders.com/buyers-guide";
// Black owl + wordmark — same as homepage
const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/homes_by_apollo_clean-Edited_22d5e06c.png";
const GOLD = "#c9a84c";
const NAVY = "#0f2044";

// Static fallback blog data (matches DB)
const FALLBACK_POSTS = [
  {
    id: 1,
    title: "Why Pahrump is Nevada's Best-Kept Secret for New Home Buyers",
    slug: "why-pahrump-is-nevadas-best-kept-secret-for-new-home-buyers",
    imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/pahrump-home1_9c98ce21.jpg",
    excerpt: "Pahrump offers everything that drew people to the Las Vegas Valley, at a fraction of the cost, with room to breathe.",
    category: "Tips",
  },
  {
    id: 2,
    title: "What to Expect During Your Apollo Home Build",
    slug: "what-to-expect-during-your-apollo-home-build",
    imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/apollo-home-framing-blog-bouH5QAL4MFwA5GeFtqpAY.webp",
    excerpt: "A new construction build has its own rhythm, milestones, and decision points. Here is an honest walkthrough of every phase.",
    category: "Construction",
  },
  {
    id: 3,
    title: "The Case for Multi-Family Builds in Southern Nevada",
    slug: "the-case-for-multi-family-builds-in-southern-nevada",
    imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/multifamily-nv_dfd486dd.jpg",
    excerpt: "Southern Nevada has a supply problem, not a demand problem. Here is why multi-family construction in Pahrump is compelling.",
    category: "Investment",
  },
];

export default function BuyersGuideThankYou() {
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const { data: posts } = trpc.blog.getPublished.useQuery();
  const displayPosts = (posts && posts.length > 0 ? posts.slice(0, 3) : FALLBACK_POSTS) as typeof FALLBACK_POSTS;

  // PDF download tracking — reads email from sessionStorage set by the guide form
  const trackDownload = trpc.leads.trackPdfDownload.useMutation();
  const handleDownload = () => {
    const email = sessionStorage.getItem("guide_email") ?? "";
    if (email) {
      trackDownload.mutate({ email });
    }
    window.open(PDF_URL, "_blank", "noopener,noreferrer");
  };

  // Copy guide link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(GUIDE_SHARE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("input");
      el.value = GUIDE_SHARE_URL;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // SMS text-share (opens native SMS app with pre-filled message)
  const handleTextShare = () => {
    const msg = encodeURIComponent(`Hey! I just got the free 2026 Pahrump Home Buyer's Guide from Apollo Home Builders. Thought you'd find it useful: ${GUIDE_SHARE_URL}`);
    window.location.href = `sms:?body=${msg}`;
  };

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", background: "#f8f7f4", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Helmet>
        <title>Your Free Buyer's Guide Is on Its Way | Apollo Home Builders</title>
        <meta name="description" content="Download your free 2026 Pahrump Home Buyer's Guide. Covers pricing, financing, build timelines, lot availability, and what to expect when building with Apollo." />
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Your Free 2026 Pahrump Home Buyer's Guide | Apollo Home Builders" />
        <meta property="og:description" content="Everything you need to know before building in Pahrump, Nevada — pricing, financing, timelines, and lot availability. Download free." />
        <meta property="og:image" content={COVER_IMG} />
        <meta property="og:image:width" content="800" />
        <meta property="og:image:height" content="1035" />
        <meta property="og:image:alt" content="2026 Pahrump Home Buyer's Guide cover" />
        <meta property="og:url" content="https://apollohomebuilders.com/buyers-guide-thank-you" />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Your Free 2026 Pahrump Home Buyer's Guide | Apollo Home Builders" />
        <meta name="twitter:description" content="Everything you need to know before building in Pahrump, Nevada. Download free." />
        <meta name="twitter:image" content={COVER_IMG} />
      </Helmet>

      {/* ── NAV ── */}
      <nav style={{ background: "white", borderBottom: "1px solid rgba(15,32,68,0.08)", padding: "0 5vw", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
        <button
          onClick={() => setLocation("/")}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
        >
          <img
            src={LOGO_URL}
            alt="Homes by Apollo"
            style={{ height: 52, width: "auto", objectFit: "contain", display: "block" }}
          />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setLocation("/get-in-touch")}
            style={{ background: "transparent", color: NAVY, border: `1.5px solid rgba(15,32,68,0.25)`, borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em" }}
          >
            GET IN TOUCH
          </button>
          <button
            onClick={() => setLocation("/find-your-home")}
            style={{ background: NAVY, color: "white", border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em" }}
          >
            FIND A HOME
          </button>
        </div>
      </nav>

      {/* ── HERO CONFIRMATION ── */}
      <section style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1a3a6e 100%)`, padding: "72px 5vw 80px", textAlign: "center" }}>
        {/* Checkmark */}
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(201,168,76,0.18)", border: "2px solid rgba(201,168,76,0.45)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M6 16.5L12.5 23L26 9" stroke={GOLD} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, marginBottom: 16 }}>You're in</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.08em", marginBottom: 10 }}>Homes by Apollo</div>
        <h1 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, color: "white", marginBottom: 18, lineHeight: 1.15 }}>
          Your 2026 Pahrump Home<br />Buyer's Guide Is on Its Way
        </h1>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.68)", maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.6 }}>
          Check your inbox for the download link. While you wait, preview the guide below and explore the articles our buyers read most.
        </p>

        {/* PDF Cover Preview Card */}
        <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 20, padding: "32px 40px", gap: 24, maxWidth: 500, width: "100%", boxSizing: "border-box" }}>
          {/* Cover image — responsive, max 297px, never overflows on small screens */}
          <img
            src={COVER_IMG}
            alt="2026 Pahrump Home Buyer's Guide Cover"
            style={{ width: 297, maxWidth: "100%", borderRadius: 10, boxShadow: "0 16px 48px rgba(0,0,0,0.45)", display: "block" }}
          />
          <div style={{ textAlign: "center", width: "100%" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 6 }}>2026 Pahrump Home Buyer's Guide</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.50)", marginBottom: 20 }}>11 pages · 6 chapters · Free PDF</div>

            {/* Download button */}
            <button
              onClick={handleDownload}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: GOLD, color: NAVY, border: "none", borderRadius: 9, padding: "11px 24px", fontSize: 13, fontWeight: 800, cursor: "pointer", letterSpacing: "0.04em", width: "100%", justifyContent: "center", boxSizing: "border-box" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download PDF Now
            </button>

            {/* Share row */}
            <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "center" }}>
              {/* Copy link */}
              <button
                onClick={handleCopyLink}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.10)", color: "white", border: "1px solid rgba(255,255,255,0.20)", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: "0.03em", transition: "background 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
              >
                {copied ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Copy Link
                  </>
                )}
              </button>

              {/* SMS text share */}
              <button
                onClick={handleTextShare}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.10)", color: "white", border: "1px solid rgba(255,255,255,0.20)", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: "0.03em", transition: "background 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Text a Friend
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT'S INSIDE STRIP ── */}
      <section style={{ background: "white", borderBottom: "1px solid rgba(15,32,68,0.07)", padding: "36px 5vw" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center" }}>
          {[
            { icon: "🏡", label: "Pahrump market overview & price trends" },
            { icon: "💰", label: "Financing options & qualification checklist" },
            { icon: "🏗️", label: "New construction timeline (6–9 months)" },
            { icon: "📍", label: "Best lots & neighborhoods in Pahrump" },
            { icon: "📋", label: "Buyer's checklist & closing day guide" },
            { icon: "🔑", label: "Working with Apollo from contract to keys" },
          ].map(({ icon, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, background: "#f8f7f4", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, color: NAVY }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* ── BLOG POSTS ── */}
      <section style={{ padding: "72px 5vw 80px", flex: 1 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, marginBottom: 12 }}>Keep Reading</div>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 900, color: NAVY, marginBottom: 12 }}>Articles Our Buyers Read Most</h2>
            <p style={{ fontSize: 15, color: "rgba(15,32,68,0.55)", maxWidth: 480, margin: "0 auto" }}>
              Get familiar with the Pahrump market, the build process, and what makes Apollo different.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 28 }}>
            {displayPosts.map((post) => (
              <article
                key={post.id}
                onClick={() => setLocation(`/blog/${post.slug ?? post.id}`)}
                style={{ background: "white", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(15,32,68,0.08)", boxShadow: "0 2px 16px rgba(15,32,68,0.06)", cursor: "pointer", transition: "transform 0.18s, box-shadow 0.18s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(15,32,68,0.12)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 16px rgba(15,32,68,0.06)"; }}
              >
                <div style={{ height: 200, overflow: "hidden" }}>
                  <img src={post.imageUrl ?? ""} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.3s" }} />
                </div>
                <div style={{ padding: "22px 24px 26px" }}>
                  <div style={{ display: "inline-block", background: "rgba(201,168,76,0.12)", color: GOLD, fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", borderRadius: 6, padding: "3px 10px", marginBottom: 12 }}>
                    {post.category}
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: NAVY, marginBottom: 10, lineHeight: 1.3 }}>{post.title}</h3>
                  <p style={{ fontSize: 13, color: "rgba(15,32,68,0.55)", lineHeight: 1.6, marginBottom: 18 }}>{post.excerpt}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: NAVY }}>
                    Read Article
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Bottom CTA */}
          <div style={{ textAlign: "center", marginTop: 56 }}>
            <p style={{ fontSize: 15, color: "rgba(15,32,68,0.55)", marginBottom: 20 }}>Ready to take the next step?</p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => setLocation("/find-your-home")}
                style={{ background: NAVY, color: "white", border: "none", borderRadius: 10, padding: "14px 32px", fontSize: 14, fontWeight: 800, cursor: "pointer", letterSpacing: "0.04em" }}
              >
                BROWSE HOMES & LOTS
              </button>
              <button
                onClick={() => setLocation("/get-in-touch")}
                style={{ background: "transparent", color: NAVY, border: `1.5px solid rgba(15,32,68,0.25)`, borderRadius: 10, padding: "14px 32px", fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em" }}
              >
                GET IN TOUCH
              </button>
            </div>
          </div>
        </div>
      </section>

      <GlobalFooter />
    </div>
  );
}
