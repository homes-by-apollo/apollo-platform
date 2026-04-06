import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const G = "#1B3A6B";
const TXT = "#0d1b2a";
const MUT = "#6b7a99";
const BOR = "#e8edf5";
const BG = "#f7f9fc";
const GL = "rgba(27,58,107,0.07)";

const STATIC_POSTS = [
  { cat: "Tips", title: "Why Pahrump is Nevada's Best-Kept Secret for New Home Buyers", date: "Feb 12, 2025", read: "5 min", img: "https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/blog-nevada-homebuying-7NoddsjLZqhAmdfd2knfqU.webp" },
  { cat: "Construction", title: "What to Expect During Your Apollo Home Build", date: "Jan 28, 2025", read: "7 min", img: "https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/blog-construction-4GJBhhCpotjFbWS7hpxogF.webp" },
  { cat: "Investment", title: "The Case for Multi-Family Builds in Southern Nevada", date: "Jan 10, 2025", read: "6 min", img: "https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/blog-investment-8KFZKqzrwoZiwzAc7Cw3b4.webp" },
];

const CATEGORIES = ["All", "Tips", "Construction", "Investment", "Market", "Community"];

export default function PublicBlog() {
  const [, setLocation] = useLocation();
  const [activeFilter, setActiveFilter] = useState("All");
  const { data: dbPosts, isLoading } = trpc.blog.getPublished.useQuery();

  // Merge DB posts with static fallback posts
  const allPosts = dbPosts && dbPosts.length > 0
    ? dbPosts.map(p => ({
        cat: p.category,
        title: p.title,
        date: new Date(p.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        read: p.readTime ?? "5 min",
        img: p.imageUrl ?? STATIC_POSTS[0].img,
        excerpt: p.excerpt,
      }))
    : STATIC_POSTS;

  const filtered = activeFilter === "All"
    ? allPosts
    : allPosts.filter(p => p.cat === activeFilter);

  return (
    <div style={{ fontFamily: "'Manrope',system-ui,sans-serif", background: BG, color: TXT, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root { --pad: clamp(24px, 4.5vw, 80px); --container: 1680px; }
        .blog-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        @media (max-width: 1024px) { .blog-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 640px) { .blog-grid { grid-template-columns: 1fr !important; } .blog-hero-title { font-size: 32px !important; } }
        .blog-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.12) !important; transform: translateY(-2px); }
        .blog-card { transition: all 0.22s ease; }
        .filter-btn { border: 1.5px solid ${BOR}; background: white; color: ${MUT}; padding: 7px 18px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s; }
        .filter-btn:hover { border-color: ${G}; color: ${G}; }
        .filter-btn.active { background: ${G}; color: white; border-color: ${G}; }
        .footer-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 32px; }
        @media (max-width: 768px) { .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 24px !important; } }
      `}</style>

      {/* ── NAV ── */}
      <div style={{ background: "#ffffff", boxShadow: "0 2px 20px rgba(0,0,0,0.07)", flexShrink: 0, zIndex: 200, position: "relative" }}>
        <nav style={{ padding: "0 var(--pad)", height: 80, display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "var(--container)", margin: "0 auto", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setLocation("/")}>
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/homes_by_apollo_clean-Edited_22d5e06c.png" alt="Apollo Owl" style={{ height: 48, width: 48, objectFit: "contain" }} />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1, gap: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.32em", color: TXT, textTransform: "uppercase" }}>HOMES BY</span>
              <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: "0.07em", color: TXT }}>APOLLO</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setLocation("/get-in-touch")}
              style={{ height: 44, padding: "0 20px", borderRadius: 8, fontWeight: 700, cursor: "pointer", border: `1.5px solid ${G}`, fontSize: 13, fontFamily: "inherit", background: "transparent", color: G, letterSpacing: "0.04em" }}>
              GET IN TOUCH
            </button>
            <button
              onClick={() => setLocation("/find-your-home")}
              style={{ height: 44, padding: "0 20px", borderRadius: 8, fontWeight: 700, cursor: "pointer", border: "none", fontSize: 13, fontFamily: "inherit", background: G, color: "white", letterSpacing: "0.04em" }}>
              FIND YOUR HOME
            </button>
          </div>
        </nav>
      </div>

      {/* ── HERO ── */}
      <div style={{ background: G, padding: "64px var(--pad) 56px", color: "white" }}>
        <div style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 14 }}>Insights & Resources</div>
          <h1 className="blog-hero-title" style={{ fontSize: 52, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: 16 }}>From the Blog</h1>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.65)", maxWidth: 560, lineHeight: 1.7 }}>
            Tips, market insights, and construction know-how from the Apollo team — everything you need to make a confident home-buying decision in Pahrump.
          </p>
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div style={{ background: "white", borderBottom: `1px solid ${BOR}`, padding: "16px var(--pad)" }}>
        <div style={{ maxWidth: "var(--container)", margin: "0 auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`filter-btn${activeFilter === cat ? " active" : ""}`}
              onClick={() => setActiveFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── POSTS GRID ── */}
      <div style={{ flex: 1, padding: "48px var(--pad) 64px" }}>
        <div style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
          {isLoading ? (
            <div className="blog-grid">
              {[1, 2, 3].map(i => (
                <div key={i} style={{ background: "white", borderRadius: 14, overflow: "hidden", border: `1px solid ${BOR}` }}>
                  <div style={{ width: "100%", height: 220, background: "#e8edf5", animation: "pulse 1.5s ease-in-out infinite" }} />
                  <div style={{ padding: "18px 20px 24px" }}>
                    <div style={{ height: 12, background: "#e8edf5", borderRadius: 6, width: "30%", marginBottom: 14 }} />
                    <div style={{ height: 18, background: "#e8edf5", borderRadius: 6, width: "90%", marginBottom: 8 }} />
                    <div style={{ height: 18, background: "#e8edf5", borderRadius: 6, width: "70%", marginBottom: 16 }} />
                    <div style={{ height: 12, background: "#e8edf5", borderRadius: 6, width: "40%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: MUT }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No posts in this category yet</div>
              <div style={{ fontSize: 14 }}>Check back soon — we publish new content regularly.</div>
            </div>
          ) : (
            <div className="blog-grid">
              {filtered.map((b, idx) => (
                <div key={idx} className="blog-card" style={{ background: "white", borderRadius: 14, overflow: "hidden", cursor: "pointer", border: `1px solid ${BOR}`, boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}>
                  <div style={{ position: "relative", height: 220, overflow: "hidden" }}>
                    <img src={b.img} alt={b.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
                      onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.04)")}
                      onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")} />
                    <div style={{ position: "absolute", top: 14, left: 14 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: G, background: "rgba(255,255,255,0.92)", padding: "4px 10px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{b.cat}</span>
                    </div>
                  </div>
                  <div style={{ padding: "20px 22px 24px" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: TXT, lineHeight: 1.45, marginBottom: 10 }}>{b.title}</div>
                    {"excerpt" in b && (b as { excerpt?: string }).excerpt && (
                      <div style={{ fontSize: 13, color: MUT, lineHeight: 1.7, marginBottom: 12 }}>{String((b as { excerpt?: string }).excerpt)}</div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                      <div style={{ fontSize: 11, color: MUT }}>{b.date} · {b.read} read</div>
                      <button style={{ fontSize: 12, fontWeight: 700, color: G, background: GL, border: "none", cursor: "pointer", fontFamily: "inherit", padding: "5px 12px", borderRadius: 6 }}>Read More →</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#0f2044", overflow: "hidden", position: "relative", fontFamily: "inherit" }}>
        <div style={{ padding: "52px var(--pad) 48px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ maxWidth: 1650, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/homes_by_apollo_clean-Edited_22d5e06c.png" alt="Apollo" style={{ height: 52, width: 52, objectFit: "contain" }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.32em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>HOMES BY</div>
                    <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: "0.07em", color: "white", lineHeight: 1 }}>APOLLO</div>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.8, maxWidth: 380, marginBottom: 28 }}>
                  Building quality new homes in Pahrump, Nevada. Your vision, our craftsmanship.
                </p>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.28)", textTransform: "uppercase", marginBottom: 8 }}>Call Us Free</div>
                <a href="tel:7753631616" style={{ display: "block", fontSize: 32, fontWeight: 800, color: "rgba(255,255,255,0.85)", textDecoration: "none", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 24 }}>(775) 363-1616</a>
                <div style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>4081 Jessica St<br />Pahrump, NV 89048</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: "52px var(--pad) 40px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ maxWidth: 1650, margin: "0 auto" }}>
            <div className="footer-grid">
              {([
                ["Company", [["Home", "/"], ["Contact", "/get-in-touch"]]] as [string, [string, string][]],
                ["Properties", [["Find Your Home", "/find-your-home"]]] as [string, [string, string][]],
                ["Resources", [["Blog", "/blog"]]] as [string, [string, string][]],
              ]).map(([heading, links]) => (
                <div key={heading}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 18 }}>{heading}</p>
                  {links.map(([label, href]) => (
                    <div key={label} onClick={() => setLocation(href)}
                      style={{ fontSize: 17, color: "rgba(255,255,255,0.55)", marginBottom: 16, cursor: "pointer", transition: "color 0.15s", fontWeight: 500 }}
                      onMouseEnter={e => { e.currentTarget.style.color = "rgba(255,255,255,0.95)"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}>
                      {label}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding: "22px var(--pad)" }}>
          <div style={{ maxWidth: 1650, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.22)" }}>© 2026 Homes by Apollo. All rights reserved.</p>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <a href="/admin-login" style={{ fontSize: 13, fontWeight: 700, color: "#e07b39", textDecoration: "none", border: "1.5px solid #e07b39", borderRadius: 6, padding: "4px 12px", letterSpacing: "0.01em" }}>Admin</a>
              {["Privacy Policy", "Terms"].map(i => (
                <span key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.22)", cursor: "pointer" }}>{i}</span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ overflow: "hidden", pointerEvents: "none", userSelect: "none", width: "100%", maxWidth: 1690, margin: "0 auto" }}>
          <svg viewBox="0 0 1690 200" preserveAspectRatio="xMidYMid meet" style={{ display: "block", width: "100%", height: "auto" }} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="footerGradBlog" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="white" stopOpacity="0.13" />
                <stop offset="100%" stopColor="white" stopOpacity="0.04" />
              </linearGradient>
              <mask id="footerTextMaskBlog">
                <text x="845" y="175" textAnchor="middle" dominantBaseline="auto" fontFamily="inherit" fontWeight="900" letterSpacing="0" fill="white" fontSize="200">Homes by Apollo</text>
              </mask>
            </defs>
            <rect x="0" y="0" width="1690" height="200" fill="url(#footerGradBlog)" mask="url(#footerTextMaskBlog)" />
          </svg>
        </div>
      </footer>
    </div>
  );
}
