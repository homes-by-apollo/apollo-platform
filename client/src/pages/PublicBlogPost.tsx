import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";

const G = "#1B3A6B";
const TXT = "#0d1b2a";
const MUT = "#6b7a99";
const BOR = "#e8edf5";
const BG = "#f7f9fc";
const NAVY = "#0f2044";
const GL = "rgba(27,58,107,0.07)";

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/** Render markdown-style body: headings, bold, images, paragraphs */
function RenderBody({ body }: { body: string }) {
  const lines = body.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("# ")) {
      elements.push(<h1 key={key++} style={{ fontSize: 32, fontWeight: 900, color: TXT, marginTop: 40, marginBottom: 16, lineHeight: 1.2 }}>{line.slice(2)}</h1>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={key++} style={{ fontSize: 22, fontWeight: 800, color: TXT, marginTop: 36, marginBottom: 12, lineHeight: 1.3 }}>{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={key++} style={{ fontSize: 18, fontWeight: 700, color: TXT, marginTop: 28, marginBottom: 10 }}>{line.slice(4)}</h3>);
    } else if (line.startsWith("![")) {
      // Image: ![alt](url)
      const match = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (match) {
        elements.push(
          <figure key={key++} style={{ margin: "32px 0", borderRadius: 12, overflow: "hidden" }}>
            <img src={match[2]} alt={match[1]} style={{ width: "100%", maxHeight: 420, objectFit: "cover", display: "block" }} />
            {match[1] && <figcaption style={{ fontSize: 12, color: MUT, textAlign: "center", padding: "8px 0" }}>{match[1]}</figcaption>}
          </figure>
        );
      }
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      // Collect consecutive list items
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].slice(2));
        i++;
      }
      i--; // back up one since the loop will increment
      elements.push(
        <ul key={key++} style={{ margin: "16px 0 16px 24px", listStyleType: "disc" }}>
          {items.map((item, j) => (
            <li key={j} style={{ fontSize: 16, color: TXT, lineHeight: 1.8, marginBottom: 6 }} dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
          ))}
        </ul>
      );
    } else if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={key++} style={{ borderLeft: `4px solid ${G}`, paddingLeft: 20, margin: "24px 0", color: MUT, fontStyle: "italic", fontSize: 16, lineHeight: 1.7 }}>
          {line.slice(2)}
        </blockquote>
      );
    } else if (line.trim() === "" || line.trim() === "---") {
      // skip blank lines / horizontal rules
    } else {
      elements.push(
        <p key={key++} style={{ fontSize: 16, color: TXT, lineHeight: 1.85, marginBottom: 18 }} dangerouslySetInnerHTML={{ __html: renderInline(line) }} />
      );
    }
  }

  return <div>{elements}</div>;
}

function renderInline(text: string): string {
  // Bold: **text**
  let result = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Italic: *text*
  result = result.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // Links: [text](url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" style="color:${G};text-decoration:underline;" target="_blank" rel="noopener">$1</a>`);
  return result;
}

export default function PublicBlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();

  const { data: post, isLoading, error } = trpc.blog.getBySlug.useQuery(
    { slug: slug ?? "" },
    { enabled: !!slug }
  );

  const { data: related } = trpc.blog.getRelated.useQuery(
    { category: post?.category ?? "", excludeId: post?.id ?? 0 },
    { enabled: !!post?.category && !!post?.id }
  );

  if (isLoading) {
    return (
      <div style={{ fontFamily: "'Manrope',system-ui,sans-serif", background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: MUT }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <div style={{ fontSize: 16 }}>Loading article...</div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{ fontFamily: "'Manrope',system-ui,sans-serif", background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: MUT }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: TXT, marginBottom: 8 }}>Article not found</div>
          <div style={{ fontSize: 15, marginBottom: 24 }}>This post may have been moved or is no longer available.</div>
          <button onClick={() => setLocation("/blog")} style={{ background: G, color: "white", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Back to Blog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Manrope',system-ui,sans-serif", background: BG, color: TXT, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root { --pad: clamp(24px, 4.5vw, 80px); --container: 1680px; }
        .related-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        @media (max-width: 900px) { .related-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 580px) { .related-grid { grid-template-columns: 1fr !important; } }
        .related-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.12) !important; transform: translateY(-2px); }
        .related-card { transition: all 0.22s ease; }
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
            <button onClick={() => setLocation("/blog")} style={{ height: 44, padding: "0 20px", borderRadius: 8, fontWeight: 700, cursor: "pointer", border: `1.5px solid ${G}`, fontSize: 13, fontFamily: "inherit", background: "transparent", color: G, letterSpacing: "0.04em" }}>
              BACK TO BLOG
            </button>
            <button onClick={() => setLocation("/find-your-home")} style={{ height: 44, padding: "0 20px", borderRadius: 8, fontWeight: 700, cursor: "pointer", border: "none", fontSize: 13, fontFamily: "inherit", background: G, color: "white", letterSpacing: "0.04em" }}>
              FIND YOUR HOME
            </button>
          </div>
        </nav>
      </div>

      {/* ── HERO IMAGE ── */}
      {post.imageUrl && (
        <div style={{ width: "100%", height: "clamp(260px, 38vw, 500px)", overflow: "hidden", position: "relative" }}>
          <img src={post.imageUrl} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.45) 100%)" }} />
        </div>
      )}

      {/* ── ARTICLE ── */}
      <div style={{ flex: 1, padding: "0 var(--pad) 80px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>

          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 32, marginBottom: 24, fontSize: 13, color: MUT }}>
            <span style={{ cursor: "pointer", color: G, fontWeight: 600 }} onClick={() => setLocation("/")}>Home</span>
            <span>/</span>
            <span style={{ cursor: "pointer", color: G, fontWeight: 600 }} onClick={() => setLocation("/blog")}>Blog</span>
            <span>/</span>
            <span style={{ color: MUT }}>{post.category}</span>
          </div>

          {/* Category badge */}
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: G, background: GL, padding: "5px 12px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>{post.category}</span>
          </div>

          {/* Title */}
          <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: TXT, lineHeight: 1.15, marginBottom: 20, letterSpacing: "-0.02em" }}>{post.title}</h1>

          {/* Meta row */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 36, paddingBottom: 24, borderBottom: `1px solid ${BOR}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14, fontWeight: 800 }}>
                {(post.author ?? "A")[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: TXT }}>{post.author ?? "Apollo Home Builders"}</div>
                <div style={{ fontSize: 11, color: MUT }}>Apollo Home Builders</div>
              </div>
            </div>
            <div style={{ width: 1, height: 32, background: BOR }} />
            <div style={{ fontSize: 13, color: MUT }}>{formatDate(post.publishedAt)}</div>
            <div style={{ width: 1, height: 32, background: BOR }} />
            <div style={{ fontSize: 13, color: MUT }}>{post.readTime ?? "5 min"} read</div>
          </div>

          {/* Body */}
          {post.body ? (
            <RenderBody body={post.body} />
          ) : (
            <p style={{ color: MUT, fontSize: 16 }}>Content coming soon.</p>
          )}

          {/* CTA */}
          <div style={{ marginTop: 56, background: NAVY, borderRadius: 16, padding: "40px 36px", textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>Ready to Build?</div>
            <h3 style={{ fontSize: 26, fontWeight: 900, color: "white", marginBottom: 12, lineHeight: 1.2 }}>Start Your Apollo Home Journey</h3>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", marginBottom: 28, maxWidth: 480, margin: "0 auto 28px" }}>
              Schedule a free consultation with our team and find the perfect lot in Pahrump.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => setLocation("/find-your-home")} style={{ background: "white", color: G, border: "none", borderRadius: 8, padding: "12px 28px", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.04em" }}>
                FIND YOUR HOME
              </button>
              <button onClick={() => setLocation("/get-in-touch")} style={{ background: "transparent", color: "white", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 8, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                GET IN TOUCH
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── RELATED POSTS ── */}
      {related && related.length > 0 && (
        <div style={{ background: "white", padding: "64px var(--pad)", borderTop: `1px solid ${BOR}` }}>
          <div style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: MUT, marginBottom: 8 }}>More from {post.category}</div>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: TXT }}>Related Articles</h2>
            </div>
            <div className="related-grid">
              {related.map((r) => (
                <div
                  key={r.id}
                  className="related-card"
                  onClick={() => setLocation(`/blog/${r.slug ?? r.id}`)}
                  style={{ background: BG, borderRadius: 14, overflow: "hidden", cursor: "pointer", border: `1px solid ${BOR}`, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
                >
                  {r.imageUrl && (
                    <div style={{ height: 180, overflow: "hidden" }}>
                      <img src={r.imageUrl} alt={r.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
                        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.04)")}
                        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")} />
                    </div>
                  )}
                  <div style={{ padding: "18px 20px 22px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: G, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{r.category}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: TXT, lineHeight: 1.45, marginBottom: 10 }}>{r.title}</div>
                    {r.excerpt && <div style={{ fontSize: 13, color: MUT, lineHeight: 1.7, marginBottom: 12 }}>{r.excerpt}</div>}
                    <div style={{ fontSize: 11, color: MUT }}>{formatDate(r.publishedAt)} · {r.readTime ?? "5 min"} read</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer style={{ background: NAVY, padding: "52px var(--pad) 32px", color: "white", fontFamily: "inherit" }}>
        <div style={{ maxWidth: "var(--container)", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/apollo-logo-white_48c145a3.png" alt="Homes by Apollo" style={{ height: 48, width: 48, objectFit: "contain" }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.4em", textTransform: "uppercase" }}>HOMES BY</div>
              <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: "0.07em" }}>APOLLO</div>
            </div>
          </div>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", maxWidth: 480, lineHeight: 1.7, marginBottom: 32 }}>
            Building quality homes in Pahrump, Nevada. New construction, custom builds, and multi-family developments.
          </p>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 32 }}>
            {["/", "/blog", "/find-your-home", "/get-in-touch"].map((href, i) => (
              <span key={i} onClick={() => setLocation(href)} style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", cursor: "pointer", fontWeight: 600 }}>
                {["Home", "Blog", "Find Your Home", "Get in Touch"][i]}
              </span>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 24, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
            &copy; {new Date().getFullYear()} Apollo Home Builders. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
