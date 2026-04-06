import { useState } from "react";
import { Helmet } from "react-helmet-async";
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
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].slice(2));
        i++;
      }
      i--;
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
      // skip
    } else {
      elements.push(
        <p key={key++} style={{ fontSize: 16, color: TXT, lineHeight: 1.85, marginBottom: 18 }} dangerouslySetInnerHTML={{ __html: renderInline(line) }} />
      );
    }
  }

  return <div>{elements}</div>;
}

function renderInline(text: string): string {
  let result = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/\*(.+?)\*/g, "<em>$1</em>");
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" style="color:${G};text-decoration:underline;" target="_blank" rel="noopener">$1</a>`);
  return result;
}

// ─── Share Button ─────────────────────────────────────────────────────────────

function ShareButton({ url, title, excerpt }: { url: string; title: string; excerpt?: string }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const xUrl = `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          background: "transparent", border: `1.5px solid ${BOR}`,
          borderRadius: 8, padding: "7px 14px", cursor: "pointer",
          fontSize: 13, fontWeight: 700, color: G, fontFamily: "inherit",
          transition: "all 0.15s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = G; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = BOR; }}
      >
        {/* Share icon */}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
        Share
      </button>

      {open && (
        <>
          {/* Backdrop to close */}
          <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 100,
            background: "white", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
            border: `1px solid ${BOR}`, padding: "8px", minWidth: 200,
            fontFamily: "inherit",
          }}>
            {/* Copy link */}
            <button
              onClick={handleCopy}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                background: copied ? "#f0fdf4" : "transparent",
                border: "none", borderRadius: 8, padding: "10px 12px",
                cursor: "pointer", fontSize: 13, fontWeight: 600,
                color: copied ? "#16a34a" : TXT, fontFamily: "inherit", textAlign: "left",
                transition: "background 0.15s",
              }}
            >
              {copied ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              )}
              {copied ? "Link copied!" : "Copy link"}
            </button>

            <div style={{ height: 1, background: BOR, margin: "4px 0" }} />

            {/* LinkedIn */}
            <a
              href={linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                background: "transparent", border: "none", borderRadius: 8,
                padding: "10px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600,
                color: TXT, fontFamily: "inherit", textDecoration: "none",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#f0f4ff"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
            >
              {/* LinkedIn icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              Share on LinkedIn
            </a>

            {/* X (Twitter) */}
            <a
              href={xUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                background: "transparent", border: "none", borderRadius: 8,
                padding: "10px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600,
                color: TXT, fontFamily: "inherit", textDecoration: "none",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#f0f4ff"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
            >
              {/* X icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#000000">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Share on X
            </a>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

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

  // Canonical URL for OG tags
  const canonicalUrl = typeof window !== "undefined"
    ? `${window.location.origin}/blog/${slug}`
    : `https://apollohomebuilders.com/blog/${slug}`;

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

  const ogDescription = post.excerpt ?? `Read ${post.title} on the Apollo Home Builders blog.`;
  const ogImage = post.imageUrl ?? "https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/apollo-logo-white_48c145a3.png";

  return (
    <div style={{ fontFamily: "'Manrope',system-ui,sans-serif", background: BG, color: TXT, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ── OG / SEO META TAGS ── */}
      <Helmet>
        <title>{post.title} | Apollo Home Builders</title>
        <meta name="description" content={ogDescription} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="Apollo Home Builders" />
        {post.publishedAt && <meta property="article:published_time" content={new Date(post.publishedAt).toISOString()} />}
        {post.author && <meta property="article:author" content={post.author} />}

        {/* Twitter / X Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>

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

          {/* Meta row — author, date, read time, SHARE */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 36, paddingBottom: 24, borderBottom: `1px solid ${BOR}`, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: G, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
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

            {/* Spacer pushes Share button to the right */}
            <div style={{ flex: 1 }} />

            {/* Share button */}
            <ShareButton
              url={canonicalUrl}
              title={post.title}
              excerpt={post.excerpt ?? undefined}
            />
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
              <button onClick={() => setLocation("/get-in-touch")} style={{ background: "transparent", color: "white", border: "1.5px solid rgba(255,255,255,0.4)", borderRadius: 8, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.04em" }}>
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
                  onClick={() => setLocation(`/blog/${(r as { slug?: string }).slug ?? r.id}`)}
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
