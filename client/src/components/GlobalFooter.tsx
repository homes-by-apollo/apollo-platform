import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Record<string, string | number | boolean> }) => void;
  }
}
const track = (event: string, props?: Record<string, string | number | boolean>) => {
  try { window.plausible?.(event, props ? { props } : undefined); } catch {}
};

export function GlobalFooter() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);

  const newsletterMutation = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => { setSubmitted(true); setNewsletterError(null); track("footer_subscribe"); },
    onError: (err: { message?: string }) => { setNewsletterError(err.message || "Something went wrong. Please try again."); },
  });

  const nav = (pg: string) => {
    navigate("/");
    // Use hash-based navigation after a short delay so ApolloSite can mount
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("apollo-nav", { detail: pg }));
    }, 50);
  };

  return (
    <footer style={{ background:"#0f2044", overflow:"hidden", position:"relative", fontFamily:"inherit" }}>
      <style>{`
        .gf-subscribe { display: flex; gap: 0; max-width: 420px; }
        .gf-footer-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 32px; }
        @media (max-width: 768px) {
          .gf-subscribe { flex-direction: column !important; gap: 10px !important; max-width: 100% !important; }
          .gf-subscribe input { border-radius: 8px !important; border-right: 1px solid rgba(255,255,255,0.18) !important; height: 48px !important; }
          .gf-subscribe button { border-radius: 8px !important; height: 48px !important; width: 100% !important; }
          .gf-footer-grid { grid-template-columns: 1fr 1fr !important; }
          .gf-top-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>

      {/* ── Top band: Brand + Contact info ──────────────────────────────── */}
      <div style={{ padding:"52px var(--pad,48px) 48px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ maxWidth:1650, margin:"0 auto" }}>
          <div className="gf-top-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:64, alignItems:"flex-start" }}>

            {/* LEFT: Logo + tagline + email form */}
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/apollo-logo-white_48c145a3.png"
                  alt="Homes by Apollo"
                  style={{ height:52, width:52, objectFit:"contain", flexShrink:0 }}
                />
                <div style={{ display:"flex", flexDirection:"column", lineHeight:1, gap:3 }}>
                  <span style={{ fontSize:16, fontWeight:700, letterSpacing:"0.52em", color:"white", textTransform:"uppercase" }}>HOMES BY</span>
                  <span style={{ fontSize:30, fontWeight:900, letterSpacing:"0.085em", color:"white", lineHeight:1 }}>APOLLO</span>
                </div>
              </div>
              <p style={{ fontSize:19.5, color:"white", lineHeight:1.65, maxWidth:400, marginBottom:28 }}>
                Pahrump's premier new home builder. All-inclusive builds, one price, no surprises.
              </p>
              {submitted ? (
                <div style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,0.07)", borderRadius:8, padding:"14px 20px", maxWidth:420 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6ee7a0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <span style={{ color:"rgba(255,255,255,0.75)", fontSize:14, fontWeight:600 }}>You're on the list.</span>
                </div>
              ) : (
                <>
                  <div className="gf-subscribe">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={e=>setEmail(e.target.value)}
                      onKeyDown={e=>{ if(e.key==="Enter" && email) newsletterMutation.mutate({ email }); }}
                      style={{ flex:1, padding:"14px 18px", borderRadius:"8px 0 0 8px", border:"1px solid rgba(255,255,255,0.18)", borderRight:"none", fontSize:14, outline:"none", background:"rgba(255,255,255,0.08)", color:"white", fontFamily:"inherit" }}
                    />
                    <button
                      onClick={()=>{ if(email) newsletterMutation.mutate({ email }); }}
                      disabled={newsletterMutation.isPending || !email}
                      style={{ background:"#4B9CD3", color:"white", border:"none", padding:"14px 22px", borderRadius:"0 8px 8px 0", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap", opacity: (!email || newsletterMutation.isPending) ? 0.5 : 1, transition:"opacity 0.15s" }}>
                      {newsletterMutation.isPending ? "Saving…" : "Subscribe"}
                    </button>
                  </div>
                  {newsletterError && <p style={{ marginTop:8, fontSize:13, color:"#f87171" }}>{newsletterError}</p>}
                </>
              )}
              {/* Instagram CTA */}
              <a href="https://www.instagram.com/homesby.apollo/" target="_blank" rel="noopener noreferrer"
                style={{ display:"inline-flex", alignItems:"center", gap:8, marginTop:20, fontSize:14, color:"rgba(255,255,255,0.55)", textDecoration:"none", transition:"color 0.15s" }}
                onMouseEnter={e=>{e.currentTarget.style.color="rgba(255,255,255,0.9)"}}
                onMouseLeave={e=>{e.currentTarget.style.color="rgba(255,255,255,0.55)"}}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
                </svg>
                Follow @homesby.apollo
              </a>
            </div>

            {/* RIGHT: Call Us Free + phone + address */}
            <div style={{ paddingTop:4 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.4)", marginBottom:10, letterSpacing:"0.02em" }}>Call Us Free</div>
              <a href="tel:7753631616" style={{ display:"block", fontSize:"clamp(28px,3.5vw,42px)", fontWeight:800, color:"rgba(255,255,255,0.85)", textDecoration:"none", letterSpacing:"-0.02em", lineHeight:1.1, marginBottom:24 }}>(775) 363-1616</a>
              <div style={{ fontSize:15, color:"rgba(255,255,255,0.45)", lineHeight:1.7 }}>
                4081 Jessica St<br/>
                Pahrump, NV 89048
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Middle band: Nav columns ─────────────────────────────── */}
      <div style={{ padding:"52px var(--pad,48px) 40px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth:1650, margin:"0 auto" }}>
          <div className="gf-footer-grid">
            {([
              ["Company",  [["Home","/"],["About Us","/"],["Contact","/get-in-touch"]]],
              ["Properties",[["Homes","/find-your-home"],["Lots","/find-your-home"]]],
              ["Resources", [["Blog","/blog"],["FAQ","/"],["Instagram","https://www.instagram.com/homesby.apollo/"]]],
            ] as [string, [string, string][]][]).map(([heading, links])=>(
              <div key={heading}>
                <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.28)", textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:18 }}>{heading}</p>
                {links.map(([label, href])=>(
                  <a key={label} href={href}
                    style={{ display:"block", fontSize:17, color:"rgba(255,255,255,0.55)", marginBottom:16, cursor:"pointer", transition:"color 0.15s", fontWeight:500, textDecoration:"none" }}
                    onMouseEnter={e=>{e.currentTarget.style.color="rgba(255,255,255,0.95)"}}
                    onMouseLeave={e=>{e.currentTarget.style.color="rgba(255,255,255,0.55)"}}>
                    {label}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────── */}
      <div style={{ padding:"22px var(--pad,48px)" }}>
        <div style={{ maxWidth:1650, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.22)" }}>© 2026 Homes by Apollo. All rights reserved.</p>
          <div style={{ display:"flex", gap:20, alignItems:"center" }}>
            <a href="/admin-login" style={{ fontSize:13, fontWeight:700, color:"#e07b39", textDecoration:"none", border:"1.5px solid #e07b39", borderRadius:6, padding:"4px 12px", letterSpacing:"0.01em", transition:"background 0.15s, color 0.15s" }}
              onMouseEnter={e=>{ e.currentTarget.style.background="#e07b39"; e.currentTarget.style.color="white"; }}
              onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#e07b39"; }}>
              Admin
            </a>
            {["Privacy Policy","Terms"].map(i=>(
              <span key={i} style={{ fontSize:13, color:"rgba(255,255,255,0.22)", cursor:"pointer", transition:"color 0.15s" }}
                onMouseEnter={e=>{e.currentTarget.style.color="rgba(255,255,255,0.6)"}}
                onMouseLeave={e=>{e.currentTarget.style.color="rgba(255,255,255,0.22)"}}>{i}</span>
            ))}
          </div>
        </div>
      </div>

      {/* MONOCHROMATIC WATERMARK */}
      <div style={{ overflow:"hidden", pointerEvents:"none", userSelect:"none", width:"100%", maxWidth:1690, margin:"0 auto", padding:0, boxSizing:"border-box" }}>
        <svg viewBox="0 0 1690 200" preserveAspectRatio="xMidYMid meet" style={{ display:"block", width:"100%", height:"auto" }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gfFooterGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0.13"/>
              <stop offset="100%" stopColor="white" stopOpacity="0.04"/>
            </linearGradient>
            <mask id="gfFooterTextMask">
              <text x="845" y="175" textAnchor="middle" dominantBaseline="auto"
                fontFamily="inherit" fontWeight="900" letterSpacing="0"
                fill="white" fontSize="200">Homes by Apollo</text>
            </mask>
          </defs>
          <rect x="0" y="0" width="1690" height="200" fill="url(#gfFooterGrad)" mask="url(#gfFooterTextMask)"/>
        </svg>
      </div>
    </footer>
  );
}
