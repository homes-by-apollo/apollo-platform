import { useState, useEffect, useRef } from "react";

// ── Navy theme ──────────────────────────────────────────────────────────────
const G   = "#0f2044";
const GM  = "#1a3366";
const GL  = "#eef1f8";
const BG  = "#f7f8fb";
const TXT = "#0d1520";
const MUT = "#6b7a99";
const BOR = "#dde3ef";
const ACC = "#c8a96e";

const LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/apollo-logo_31888db6.webp";

const homes = [
  { id:1, tag:"For Sale", price:"$389,900", title:"3-Bed Ranch Home", addr:"480 E Arapahoe St", city:"Pahrump, NV 89048", sqft:"1,800", bed:3, bath:2.5, img:"https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/pahrump-home-1-esiDT2wxav6EBQnFHtCgBX.webp" },
  { id:2, tag:"For Sale", price:"$749,900", title:"12-Bed Investment Property", addr:"461 Comstock Ave", city:"Pahrump, NV 89048", sqft:"4,400", bed:12, bath:8, img:"https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/pahrump-home-3-iGSesPKDzLQrVDfJwcyYWN.webp" },
  { id:3, tag:"For Sale", price:"$409,900", title:"All-Inclusive Dream Home", addr:"4081 Jessica St", city:"Pahrump, NV 89048", sqft:"1,800", bed:3, bath:2.5, img:"https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/pahrump-home-2-6CPy9723w6iJntcgGgyqZT.webp" },
];

const lots = [
  { id:1, tag:"Available", size:"0.25 Acres", price:"$45,000", addr:"Lot 14 – Basin Ave", city:"Pahrump, NV", utilities:"Water · Electric · Sewer", img:"https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/pahrump-lot-1-LPkvwaegUz9KxvnbjdxWHo.webp" },
  { id:2, tag:"Available", size:"0.50 Acres", price:"$72,000", addr:"Lot 22 – Desert Rose Dr", city:"Pahrump, NV", utilities:"Water · Electric", img:"https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/pahrump-lot-2-bHUiWvenUxSzpbYgPZpx6m.webp" },
  { id:3, tag:"Reserved", size:"1.0 Acre", price:"$115,000", addr:"Lot 7 – Mesquite Ln", city:"Pahrump, NV", utilities:"Water · Electric · Sewer · Gas", img:"https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/pahrump-lot-1-LPkvwaegUz9KxvnbjdxWHo.webp" },
];

const blogs = [
  { cat:"Tips", title:"Why Pahrump is Nevada's Best-Kept Secret for New Home Buyers", date:"Feb 12, 2025", read:"5 min", img:"https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80" },
  { cat:"Construction", title:"What to Expect During Your Apollo Home Build", date:"Jan 28, 2025", read:"7 min", img:"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80" },
  { cat:"Investment", title:"The Case for Multi-Family Builds in Southern Nevada", date:"Jan 10, 2025", read:"6 min", img:"https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80" },
];

const faqs: [string, string][] = [
  ["What's included in an all-inclusive build?","Our all-inclusive packages cover land prep, foundation, framing, electrical, plumbing, HVAC, insulation, drywall, flooring, cabinets, appliances, and landscaping. One price, no surprises."],
  ["How long does it take to build a home in Pahrump?","Typical builds run 6–9 months from contract to keys, depending on plan complexity. We'll give you a firm timeline at contract signing."],
  ["Do you offer financing assistance?","Yes — we work with preferred lenders familiar with Pahrump construction loans and can connect you with financing options at your consultation."],
  ["Can I customize a floor plan?","Absolutely. Every floor plan is a starting point. Our team will adjust layouts, elevations, and finishes to match your vision and budget."],
  ["What areas do you build in?","We primarily build in Pahrump, NV. Our office is in Las Vegas and we serve all of the Nye County area."],
];

const testimonials = [
  { quote:"Apollo made the entire process seamless. From picking our lot to getting the keys, they were with us every step. No hidden costs — exactly what they promised.", name:"Marcus & Diana R.", role:"First-Time Homebuyers", img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" },
  { quote:"We built a 12-unit investment property with Apollo. Their local knowledge of Pahrump saved us months of permitting headaches. I'd build with them again tomorrow.", name:"James Kowalski", role:"Real Estate Investor", img:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80" },
  { quote:"The all-inclusive pricing was the deciding factor for us. We knew exactly what we were spending from day one. The home turned out even better than the plans.", name:"Sandra Tran", role:"Homebuyer, Pahrump NV", img:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80" },
];

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
    <div style={{ width:32, height:1.5, background:ACC, borderRadius:2 }} />
    <span style={{ fontSize:11, fontWeight:700, color:MUT, textTransform:"uppercase", letterSpacing:"0.12em" }}>{children}</span>
  </div>
);

interface BtnProps {
  children: React.ReactNode;
  white?: boolean;
  outline?: boolean;
  small?: boolean;
  full?: boolean;
  onClick?: () => void;
}

const Btn = ({ children, white, outline, small, full, onClick }: BtnProps) => {
  const [hov, setHov] = useState(false);
  const base: React.CSSProperties = {
    display:"inline-flex", alignItems:"center", justifyContent:"center", gap:5,
    borderRadius:8, fontWeight:700, cursor:"pointer", transition:"all 0.18s",
    border:"none", fontSize:small?12:13,
    padding:small?"9px 18px":"12px 22px", fontFamily:"inherit",
    width: full ? "100%" : undefined,
  };
  let style: React.CSSProperties;
  if (white)        style = { ...base, background: hov?"#f0f0f0":"white", color:G };
  else if (outline) style = { ...base, background: hov?GL:"transparent", color:G, border:`1.5px solid ${G}` };
  else              style = { ...base, background: hov?GM:G, color:"white" };
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={style}>
      {children} ↗
    </button>
  );
};

function HomeCard({ h }: { h: typeof homes[0] }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ cursor:"pointer", transition:"all 0.28s ease" }}>
      {/* Image */}
      <div style={{ position:"relative", height:260, overflow:"hidden", borderRadius:16, marginBottom:16 }}>
        <img src={h.img} alt={h.title} style={{ width:"100%", height:"100%", objectFit:"cover", transform:hov?"scale(1.04)":"scale(1)", transition:"transform 0.5s ease" }} />
        <span style={{ position:"absolute", top:14, left:14, background:"white", color:TXT, fontSize:12, fontWeight:700, padding:"5px 12px", borderRadius:8, boxShadow:"0 2px 10px rgba(0,0,0,0.14)" }}>{h.tag}</span>
      </div>
      {/* Info below image — no card box */}
      <div style={{ paddingBottom:8 }}>
        <div style={{ fontSize:22, fontWeight:800, color:TXT, letterSpacing:"-0.03em", marginBottom:4 }}>{h.price}</div>
        <div style={{ fontSize:15, fontWeight:700, color:TXT, marginBottom:5 }}>{h.title}</div>
        <div style={{ fontSize:13, color:MUT, marginBottom:12, display:"flex", alignItems:"center", gap:4 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          {h.addr}, {h.city}
        </div>
        <div style={{ display:"flex", gap:18, fontSize:13, color:MUT }}>
          <span style={{ display:"flex", alignItems:"center", gap:5 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            {h.bed}
          </span>
          <span style={{ display:"flex", alignItems:"center", gap:5 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12h16M4 12a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"/></svg>
            {h.bath}
          </span>
          <span style={{ display:"flex", alignItems:"center", gap:5 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
            {h.sqft} sqft
          </span>
        </div>
      </div>
    </div>
  );
}

function LotCard({ l }: { l: typeof lots[0] }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ cursor:"pointer", transition:"all 0.28s ease" }}>
      {/* Image */}
      <div style={{ position:"relative", height:260, overflow:"hidden", borderRadius:16, marginBottom:16 }}>
        <img src={l.img} alt={l.addr} style={{ width:"100%", height:"100%", objectFit:"cover", transform:hov?"scale(1.04)":"scale(1)", transition:"transform 0.5s ease" }} />
        <span style={{ position:"absolute", top:14, left:14, background:l.tag==="Available"?G:"#888", color:"white", fontSize:12, fontWeight:700, padding:"5px 12px", borderRadius:8 }}>{l.tag}</span>
        <span style={{ position:"absolute", top:14, right:14, background:"white", color:TXT, fontSize:12, fontWeight:700, padding:"5px 12px", borderRadius:8, boxShadow:"0 2px 10px rgba(0,0,0,0.14)" }}>{l.size}</span>
      </div>
      {/* Info below image — no card box */}
      <div style={{ paddingBottom:8 }}>
        <div style={{ fontSize:22, fontWeight:800, color:TXT, letterSpacing:"-0.03em", marginBottom:4 }}>{l.price}</div>
        <div style={{ fontSize:15, fontWeight:700, color:TXT, marginBottom:5 }}>{l.addr}</div>
        <div style={{ fontSize:13, color:MUT, marginBottom:12, display:"flex", alignItems:"center", gap:4 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          {l.city}
        </div>
        <div style={{ fontSize:12, color:G, background:GL, padding:"7px 12px", borderRadius:8, fontWeight:600, display:"inline-flex", alignItems:"center", gap:6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          {l.utilities}
        </div>
      </div>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={()=>setOpen(!open)} style={{ background:open?"white":BG, borderRadius:10, padding:"16px 20px", cursor:"pointer", border:`1px solid ${open?BOR:"transparent"}`, transition:"all 0.2s", boxShadow:open?"0 2px 16px rgba(0,0,0,0.05)":"none" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:16 }}>
        <span style={{ fontSize:14, fontWeight:600, color:TXT, lineHeight:1.4 }}>{q}</span>
        <span style={{ fontSize:18, color:G, fontWeight:300, flexShrink:0, transform:open?"rotate(45deg)":"rotate(0)", transition:"transform 0.2s", lineHeight:1 }}>+</span>
      </div>
      {open && <p style={{ marginTop:12, fontSize:13, color:MUT, lineHeight:1.75 }}>{a}</p>}
    </div>
  );
}

function FilterBtn({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ padding:"7px 14px", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", border:`1px solid ${active?G:BOR}`, background:active?G:"white", color:active?"white":MUT, transition:"all 0.15s", fontFamily:"inherit", whiteSpace:"nowrap" }}>{children}</button>
  );
}

interface FormState {
  name: string; email: string; phone: string; interest: string; message: string;
}

export default function ApolloSite() {
  const [page, setPage] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FormState>({ name:"", email:"", phone:"", interest:"buy", message:"" });
  const [formSent, setFormSent] = useState(false);
  const [homeFilter, setHomeFilter] = useState("All");
  const [lotFilter, setLotFilter] = useState("All");
  const [blogFilter, setBlogFilter] = useState("All");
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [selectedHome, setSelectedHome] = useState<typeof homes[0] | null>(null);
  const [selectedLot, setSelectedLot] = useState<typeof lots[0] | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = topRef.current;
    if (!el) return;
    const h = () => setScrolled(el.scrollTop > 40);
    el.addEventListener("scroll", h);
    return () => el.removeEventListener("scroll", h);
  }, []);

  const nav = (p: string) => {
    setPage(p);
    setMenuOpen(false);
    setTimeout(()=>topRef.current?.scrollTo({top:0,behavior:"smooth"}),0);
  };

  void homeFilter; void lotFilter; void blogFilter;

  const prevTestimonial = () => setTestimonialIdx(i => (i - 1 + testimonials.length) % testimonials.length);
  const nextTestimonial = () => setTestimonialIdx(i => (i + 1) % testimonials.length);

  return (
    <div style={{ fontFamily:"'Manrope',system-ui,sans-serif", background:BG, color:TXT, height:"100vh", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::selection{background:${G};color:white}
        input,textarea,select,button{font-family:inherit}

        .photo-clip-text {
          font-size: 12vw;
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1;
          white-space: nowrap;
          background-image: url('https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/hero-nevada-home-jLv3PVjtmSM8wPtXaTU7Jy.webp');
          background-size: cover;
          background-position: center 40%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          display: block;
          width: 100%;
          text-align: center;
          overflow: hidden;
        }

        /* ── Mobile overrides ─────────────────────────────── */
        @media (max-width: 768px) {
          .desktop-nav-center { display: none !important; }
          .desktop-nav-ctas   { display: none !important; }
          .hamburger-btn      { display: flex !important; }

          .hero-headline      { font-size: clamp(22px,7.5vw,56px) !important; }
          .hero-subtitle      { font-size: 15px !important; }
          .hero-image-wrap    { margin: 0 16px !important; height: 280px !important; border-radius: 16px 16px 0 0 !important; }

          .search-bar         { flex-direction: column !important; border-radius: 16px !important; padding: 12px !important; gap: 8px !important; width: calc(100% - 32px) !important; box-shadow: 0 4px 24px rgba(0,0,0,0.10) !important; }
          .search-bar-item    { border-right: none !important; border-bottom: none !important; border: 1px solid #dde3ef !important; border-radius: 10px !important; padding: 14px 18px !important; width: 100% !important; min-width: unset !important; background: white !important; justify-content: space-between !important; }
          .search-bar-item-inner { flex: 1 !important; }
          .search-bar-chevron { display: flex !important; }
          .search-bar-btn     { width: 100% !important; border-radius: 10px !important; margin: 4px 0 0 !important; padding: 16px !important; font-size: 16px !important; }

          .stat-pills         { gap: 8px !important; flex-wrap: wrap !important; justify-content: center !important; padding: 0 12px !important; }
          .stat-pill          { min-width: 80px !important; padding: 10px 14px !important; }
          .stat-pill-val      { font-size: 16px !important; }

          .section-pad        { padding: 40px 16px !important; }
          .section-pad-top    { padding-top: 40px !important; padding-left: 16px !important; padding-right: 16px !important; }

          .cards-grid         { grid-template-columns: 1fr !important; gap: 16px !important; }
          .cards-grid-2col    { grid-template-columns: 1fr !important; gap: 16px !important; }

          .how-it-works-grid  { grid-template-columns: 1fr !important; gap: 20px !important; }
          .why-apollo-grid    { grid-template-columns: 1fr !important; gap: 32px !important; }
          .why-apollo-icons   { grid-template-columns: 1fr 1fr !important; gap: 24px !important; }

          .testimonial-card   { padding: 28px 20px !important; }
          .testimonial-quote  { font-size: 15px !important; }
          .testimonial-bottom { flex-direction: column !important; gap: 16px !important; align-items: flex-start !important; }

          .footer-grid        { grid-template-columns: 1fr 1fr !important; gap: 24px !important; }
          .footer-bottom      { flex-direction: column !important; gap: 8px !important; }

          .section-header-row { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .filter-row         { overflow-x: auto !important; padding-bottom: 4px !important; }

          .contact-grid       { grid-template-columns: 1fr !important; gap: 28px !important; }

          .cta-banner         { flex-direction: column !important; gap: 20px !important; text-align: center !important; }

          .mobile-full-cta    { width: 100% !important; justify-content: center !important; }
        }

        @media (min-width: 769px) {
          .hamburger-btn { display: none !important; }
          .mobile-menu   { display: none !important; }
        }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav style={{
        background: scrolled ? "rgba(255,255,255,0.97)" : "white",
        borderBottom: `1px solid ${BOR}`,
        padding: "0 24px",
        height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0, zIndex: 200,
        boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.07)" : "none",
        transition: "all 0.2s",
        position: "relative",
      }}>
        {/* Logo — owl icon + wordmark */}
        <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }} onClick={()=>nav("home")}>
          <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/homes_by_apollo_clean-Edited_22d5e06c.png" alt="Apollo Owl" style={{ height:40, width:40, objectFit:"contain", display:"block" }} />
          <div style={{ display:"flex", flexDirection:"column", lineHeight:1, gap:1 }}>
          <span style={{ fontSize:15, fontWeight:700, letterSpacing:"0.32em", color:TXT, textTransform:"uppercase", opacity:1 }}>HOMES BY</span>
          <span style={{ fontSize:26, fontWeight:900, letterSpacing:"0.07em", color:TXT, lineHeight:1 }}>APOLLO</span>
          </div>
        </div>

        {/* Desktop center nav */}
        <div className="desktop-nav-center" style={{ display:"flex", gap:28, alignItems:"center" }}>
          {([["contact","Contact"]] as [string,string][]).map(([p,l])=>(
            <button key={p} onClick={()=>nav(p)} style={{
              background:"none", border:"none", cursor:"pointer",
              fontSize:14, fontWeight:500,
              color: page===p ? TXT : MUT,
              borderBottom: `2px solid ${page===p ? ACC : "transparent"}`,
              paddingBottom: 2, transition:"all 0.15s", fontFamily:"inherit",
            }}>{l}</button>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="desktop-nav-ctas" style={{ display:"flex", gap:10, alignItems:"center" }}>
          <Btn small onClick={()=>nav("contact")}>Schedule a Consultation</Btn>
          <Btn small outline onClick={()=>nav("homes")}>View Homes & Lots</Btn>
        </div>

        {/* Hamburger */}
        <button className="hamburger-btn" onClick={()=>setMenuOpen(!menuOpen)}
          style={{ background:G, border:"none", borderRadius:8, padding:"10px 12px", cursor:"pointer", flexDirection:"column", gap:5, alignItems:"center", justifyContent:"center" }}>
          <span style={{ display:"block", width:20, height:2, background:"white", borderRadius:2, transition:"all 0.2s", transform:menuOpen?"rotate(45deg) translate(4px,4px)":"none" }}/>
          <span style={{ display:"block", width:20, height:2, background:"white", borderRadius:2, transition:"all 0.2s", opacity:menuOpen?0:1 }}/>
          <span style={{ display:"block", width:20, height:2, background:"white", borderRadius:2, transition:"all 0.2s", transform:menuOpen?"rotate(-45deg) translate(4px,-4px)":"none" }}/>
        </button>
      </nav>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="mobile-menu" style={{
          position:"fixed", top:64, left:0, right:0, zIndex:190,
          background:"white", borderBottom:`1px solid ${BOR}`,
          boxShadow:"0 8px 32px rgba(0,0,0,0.12)", padding:"16px 20px 20px",
        }}>
          {([["contact","Contact"]] as [string,string][]).map(([p,l])=>(
            <button key={p} onClick={()=>nav(p)} style={{
              display:"block", width:"100%", textAlign:"left",
              background:"none", border:"none", cursor:"pointer",
              fontSize:16, fontWeight:600, color:page===p?G:TXT,
              padding:"12px 0", borderBottom:`1px solid ${BOR}`, fontFamily:"inherit",
            }}>{l}</button>
          ))}
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:16 }}>
            <Btn full onClick={()=>nav("contact")}>Schedule a Consultation</Btn>
            <Btn full outline onClick={()=>nav("homes")}>View Homes & Lots</Btn>
          </div>
        </div>
      )}

      {/* ── SCROLLABLE CONTENT ───────────────────────────────────────────────── */}
      <div ref={topRef} style={{ flex:1, overflowY:"auto" }}>

        {/* ══ HOME PAGE ══════════════════════════════════════════════════════ */}
        {page==="home" && <>

          {/* HERO */}
          <div style={{ background:"white", paddingTop:72, paddingBottom:0, textAlign:"center", position:"relative" }}>
            <h1 className="hero-headline" style={{
              fontSize: "clamp(36px,5.8vw,92px)",
              fontWeight: 800, color: TXT, lineHeight: 1.05,
              letterSpacing: "-0.04em",
              margin: "0 auto 24px", padding: "0 24px",
              whiteSpace: "normal",
            }}>
              <span style={{ display:"block", whiteSpace:"nowrap" }}>Find Your Dream Home</span>
              <span style={{ display:"block", whiteSpace:"nowrap" }}>in Pahrump</span>
            </h1>
            <p className="hero-subtitle" style={{ fontSize:18, color:MUT, maxWidth:500, margin:"0 auto 40px", lineHeight:1.65, fontWeight:400, padding:"0 24px" }}>
              Explore our listings to find the perfect place to call home.
            </p>

            {/* Search bar */}
            <div className="search-bar" style={{
              display:"inline-flex", alignItems:"stretch",
              background:"white", borderRadius:16,
              boxShadow:"0 4px 40px rgba(0,0,0,0.12)",
              padding:"8px 8px 8px 0", gap:0,
              position:"relative", zIndex:10,
              maxWidth:"calc(100% - 32px)",
            }}>
              {[
                [<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, "Location"],
                [<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, "Property Type"],
                [<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, "Budget"],
              ].map(([icon,label],i)=>(
                <div key={label as string} className="search-bar-item" style={{
                  display:"flex", alignItems:"center", gap:10,
                  padding:"14px 24px",
                  borderRight: i<2 ? `1px solid ${BOR}` : "none",
                  cursor:"pointer", minWidth:160,
                }}>
                  <span style={{ display:"flex", alignItems:"center" }}>{icon}</span>
                  <div style={{ textAlign:"left" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:TXT, letterSpacing:"0.02em", marginBottom:2 }}>{label}</div>
                    <div style={{ fontSize:12, color:"#bbb" }}>Any ▾</div>
                  </div>
                </div>
              ))}
              <button className="search-bar-btn" onClick={()=>nav("homes")} style={{
                background:G, color:"white", border:"none",
                padding:"14px 32px", borderRadius:12,
                fontSize:14, fontWeight:700, cursor:"pointer",
                fontFamily:"inherit", marginLeft:8,
              }}>Search</button>
            </div>

            {/* Hero image */}
            <div className="hero-image-wrap" style={{ margin:"0 24px", position:"relative", marginTop:-28, height:500, overflow:"hidden", borderRadius:"24px 24px 0 0" }}>
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/hero-nevada-home-jLv3PVjtmSM8wPtXaTU7Jy.webp"
                alt="Pahrump custom home"
                style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center 40%" }}
              />
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(8,12,28,0.55) 0%, transparent 50%)" }} />
              {/* Stat pills */}
              <div className="stat-pills" style={{ position:"absolute", bottom:24, left:"50%", transform:"translateX(-50%)", display:"flex", gap:12, whiteSpace:"nowrap" }}>
                {[["50+","Homes Built"],["$389K","Starting Price"],["6–9 mo","Build Time"],["100%","All-Inclusive"]].map(([v,l])=>(
                  <div key={l} className="stat-pill" style={{ background:"rgba(255,255,255,0.93)", backdropFilter:"blur(10px)", borderRadius:12, padding:"12px 18px", textAlign:"center", minWidth:100 }}>
                    <div className="stat-pill-val" style={{ fontSize:18, fontWeight:800, color:G, letterSpacing:"-0.02em" }}>{v}</div>
                    <div style={{ fontSize:10, color:MUT, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginTop:2 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PHOTO-CLIP "HOMES BY APOLLO" + ABOUT US — moved ABOVE featured homes */}
          <div style={{ background:"white", paddingTop:80, paddingBottom:0, textAlign:"center", overflow:"hidden" }}>
            <span className="photo-clip-text">Homes by Apollo</span>
          </div>
          <div className="section-pad" style={{ background:"white", padding:"56px 32px 72px" }}>
            <div style={{ maxWidth:1060, margin:"0 auto" }}>
              <div className="why-apollo-grid" style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:64, alignItems:"start" }}>
                <div>
                  <SectionLabel>About us</SectionLabel>
                  <h2 style={{ fontSize:40, fontWeight:800, letterSpacing:"-0.03em", lineHeight:1.1, marginBottom:16 }}>We provide the best Services</h2>
                  <p style={{ fontSize:16, color:MUT, lineHeight:1.8 }}>Apollo Home Builders is committed to helping you find and build the perfect home in Pahrump, Nevada.</p>
                </div>
                <div className="why-apollo-icons" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:32 }}>
                  {[
                    [<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M7 7h.01M7 11h.01M11 7h6M11 11h6"/></svg>,"All-Inclusive Pricing","One contract, one price. Land prep to final finishes — no hidden costs, ever."],
                    [<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,"Local Pahrump Expertise","We know Nye County inside out — permits, soil, HOAs, and the best lots in the valley."],
                    [<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,"Custom Floor Plans","Every build starts with your vision. We modify layouts and finishes to match your lifestyle."],
                    [<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,"Preferred Lenders","We connect you with Nevada construction loan specialists from day one."],
                  ].map(([icon,title,desc])=>(
                    <div key={title as string}>
                      <div style={{ width:44, height:44, borderRadius:12, background:GL, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14 }}>{icon}</div>
                      <div style={{ fontSize:14, fontWeight:700, color:TXT, marginBottom:6 }}>{title}</div>
                      <div style={{ fontSize:13, color:MUT, lineHeight:1.7 }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* FEATURED HOMES */}
          <div style={{ padding:"64px 32px 0", maxWidth:1060, margin:"0 auto" }}>
            <div className="section-header-row" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}>
              <div>
                <SectionLabel>Featured Properties</SectionLabel>
                <h2 style={{ fontSize:40, fontWeight:800, letterSpacing:"-0.03em" }}>Homes for Sale</h2>
              </div>
              <button onClick={()=>nav("homes")} style={{ fontSize:12, fontWeight:700, color:G, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>View All →</button>
            </div>
            <div className="cards-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
              {homes.map(h=>(
                <div key={h.id} onClick={()=>{ setSelectedHome(h); nav("home-detail"); }}>
                  <HomeCard h={h}/>
                </div>
              ))}
            </div>
          </div>

          {/* HOW IT WORKS */}
          <div style={{ background:GL, padding:"72px 32px", marginTop:64 }}>
            <div style={{ maxWidth:1060, margin:"0 auto" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:48 }}>
                <div>
                  <SectionLabel>Our approach</SectionLabel>
                  <h2 style={{ fontSize:40, fontWeight:800, letterSpacing:"-0.03em" }}>How it works</h2>
                </div>
                <Btn small onClick={()=>nav("homes")}>Our Properties</Btn>
              </div>
              <div className="how-it-works-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:28 }}>
                {[
                  { n:"01", title:"Browse Lots & Plans", desc:"Use our advanced search to find the perfect lot or floor plan in Pahrump. Filter by size, price, and location.", img:"https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80" },
                  { n:"02", title:"Schedule a Consultation", desc:"Sit down with Brandon and the Apollo team. We'll walk through your vision, timeline, and all-inclusive pricing.", img:"https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80" },
                  { n:"03", title:"Sign & Start Building", desc:"One contract, one price. We break ground and keep you updated every step — from foundation to keys.", img:"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80" },
                ].map(step=>(
                  <div key={step.n} style={{ background:"white", borderRadius:16, overflow:"hidden", boxShadow:"0 2px 20px rgba(0,0,0,0.06)" }}>
                    <div style={{ height:180, overflow:"hidden", position:"relative" }}>
                      <img src={step.img} alt={step.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, background:"linear-gradient(to top, rgba(8,12,28,0.45) 0%, transparent 60%)" }} />
                    <div style={{ position:"absolute", bottom:14, left:16, fontSize:52, fontWeight:900, color:"rgba(255,255,255,0.95)", letterSpacing:"-0.04em", lineHeight:1, textShadow:"0 2px 12px rgba(0,0,0,0.4)" }}>{step.n}</div>
                    </div>
                    <div style={{ padding:"18px 20px 22px" }}>
                      <div style={{ fontSize:15, fontWeight:800, color:TXT, marginBottom:8 }}>{step.title}</div>
                      <div style={{ fontSize:13, color:MUT, lineHeight:1.7 }}>{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AVAILABLE LOTS */}
          <div style={{ padding:"72px 32px 64px", maxWidth:1060, margin:"0 auto" }}>
            <div className="section-header-row" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}>
              <div>
                <SectionLabel>Land</SectionLabel>
                <h2 style={{ fontSize:40, fontWeight:800, letterSpacing:"-0.03em" }}>Available Lots</h2>
              </div>
              <button onClick={()=>nav("lots")} style={{ fontSize:12, fontWeight:700, color:G, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>View All →</button>
            </div>
            <div className="cards-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
              {lots.map(l=>(
                <div key={l.id} onClick={()=>{ setSelectedLot(l); nav("lot-detail"); }}>
                  <LotCard l={l}/>
                </div>
              ))}
            </div>
          </div>

          {/* TESTIMONIALS */}
          <div style={{ background:GL, padding:"72px 32px" }}>
            <div style={{ maxWidth:800, margin:"0 auto" }}>
              <div style={{ textAlign:"center", marginBottom:40 }}>
                <SectionLabel>Client Stories</SectionLabel>
                <h2 style={{ fontSize:40, fontWeight:800, letterSpacing:"-0.03em" }}>What our clients say</h2>
                <p style={{ fontSize:14, color:MUT, marginTop:10 }}>Hear from homeowners and investors who built with Apollo.</p>
              </div>
              <div className="testimonial-card" style={{ background:"white", borderRadius:20, padding:"36px 44px", boxShadow:"0 4px 32px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize:72, color:GL, fontWeight:900, lineHeight:0.6, marginBottom:20, fontFamily:"Georgia,serif" }}>"</div>
                <p className="testimonial-quote" style={{ fontSize:17, color:TXT, lineHeight:1.75, fontWeight:500, marginBottom:28, fontStyle:"italic" }}>
                  {testimonials[testimonialIdx].quote}
                </p>
                <div className="testimonial-bottom" style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <img src={testimonials[testimonialIdx].img} alt={testimonials[testimonialIdx].name}
                      style={{ width:46, height:46, borderRadius:"50%", objectFit:"cover", border:`2px solid ${BOR}` }} />
                    <div>
                      <div style={{ fontSize:14, fontWeight:700, color:TXT }}>{testimonials[testimonialIdx].name}</div>
                      <div style={{ fontSize:12, color:MUT }}>{testimonials[testimonialIdx].role}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:10 }}>
                    {([["←", prevTestimonial],["→", nextTestimonial]] as [string, ()=>void][]).map(([arrow, fn])=>(
                      <button key={arrow} onClick={fn}
                        style={{ width:42, height:42, borderRadius:"50%", border:`1.5px solid ${BOR}`, background:"white", fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s", fontFamily:"inherit" }}
                        onMouseEnter={e=>{e.currentTarget.style.background=G; e.currentTarget.style.color="white"; e.currentTarget.style.borderColor=G;}}
                        onMouseLeave={e=>{e.currentTarget.style.background="white"; e.currentTarget.style.color=TXT; e.currentTarget.style.borderColor=BOR;}}>
                        {arrow}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display:"flex", gap:8, justifyContent:"center", marginTop:24 }}>
                  {testimonials.map((_,i)=>(
                    <div key={i} onClick={()=>setTestimonialIdx(i)} style={{ width:i===testimonialIdx?24:8, height:8, borderRadius:4, background:i===testimonialIdx?G:BOR, cursor:"pointer", transition:"all 0.25s" }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* BLOG PREVIEW */}
          <div style={{ padding:"72px 32px 0", maxWidth:1060, margin:"0 auto" }}>
            <div className="section-header-row" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}>
              <div>
                <SectionLabel>Insights</SectionLabel>
                <h2 style={{ fontSize:40, fontWeight:800, letterSpacing:"-0.03em" }}>From the Blog</h2>
              </div>
              <button onClick={()=>nav("blog")} style={{ fontSize:12, fontWeight:700, color:G, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>View All →</button>
            </div>
            <div className="cards-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
              {blogs.map(b=>(
                <div key={b.title} style={{ background:"white", borderRadius:14, overflow:"hidden", cursor:"pointer", border:`1px solid ${BOR}` }}>
                  <img src={b.img} alt={b.title} style={{ width:"100%", height:160, objectFit:"cover" }} />
                  <div style={{ padding:"16px 18px 20px" }}>
                    <span style={{ fontSize:10, fontWeight:700, color:G, background:GL, padding:"3px 9px", borderRadius:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>{b.cat}</span>
                    <div style={{ fontSize:14, fontWeight:700, color:TXT, lineHeight:1.45, marginTop:10, marginBottom:8 }}>{b.title}</div>
                    <div style={{ fontSize:11, color:MUT }}>{b.date} · {b.read} read</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div style={{ padding:"72px 32px 0", maxWidth:720, margin:"0 auto" }}>
            <SectionLabel>FAQ</SectionLabel>
            <h2 style={{ fontSize:40, fontWeight:800, letterSpacing:"-0.03em", marginBottom:24 }}>Common Questions</h2>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {faqs.map(([q,a])=><FAQ key={q} q={q} a={a}/>)}
            </div>
          </div>

          {/* EMAIL CAPTURE — removed standalone section, now in footer */}

          {/* FOOTER */}
          <footer style={{ background:"#080c18", overflow:"hidden", position:"relative" }}>

            {/* Email capture strip */}
            <div style={{ borderBottom:"1px solid rgba(255,255,255,0.07)", padding:"52px 32px" }}>
              <div style={{ maxWidth:1060, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:24 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 }}>Stay Updated</div>
                  <h3 style={{ fontSize:28, fontWeight:800, color:"white", letterSpacing:"-0.02em", lineHeight:1.2, marginBottom:6 }}>New lots and homes, first.</h3>
                  <p style={{ fontSize:14, color:"rgba(255,255,255,0.4)", lineHeight:1.6 }}>Get notified before new properties hit Zillow.</p>
                </div>
                <div style={{ display:"flex", gap:10, flexShrink:0, flexWrap:"wrap" }}>
                  {submitted ? (
                    <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:10, padding:"14px 24px", color:"rgba(255,255,255,0.7)", fontSize:14 }}>✅ You're on the list.</div>
                  ) : (
                    <>
                      <input type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)}
                        style={{ padding:"13px 18px", borderRadius:8, border:"1px solid rgba(255,255,255,0.12)", fontSize:14, outline:"none", background:"rgba(255,255,255,0.07)", color:"white", minWidth:240, fontFamily:"inherit" }} />
                      <button onClick={()=>email&&setSubmitted(true)}
                        style={{ background:"white", color:G, border:"none", padding:"13px 24px", borderRadius:8, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
                        Notify Me
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Footer links */}
            <div style={{ padding:"48px 32px 28px", position:"relative", zIndex:1 }}>
              <div style={{ maxWidth:1060, margin:"0 auto" }}>
                <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:36 }}>
                  <img src={LOGO} alt="Homes by Apollo" style={{ height:38, width:"auto" }} />
                  <span style={{ fontWeight:800, fontSize:13, color:"white" }}>HOMES BY APOLLO</span>
                </div>
                <div className="footer-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:28, marginBottom:40 }}>
                  {([["Company",[["Home","home"],["About Us","home"],["Why Pahrump","home"],["Contact","contact"]]],
                    ["Properties",[["Homes for Sale","homes"],["Available Lots","lots"],["Floor Plans","homes"],["Updates","homes"]]],
                    ["Resources",[["Blog","blog"],["FAQ","home"],["Warranty","home"],["Schedule","contact"]]],
                  ] as [string, [string, string][]][]).map(([heading, links])=>(
                    <div key={heading}>
                      <p style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.22)", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:14 }}>{heading}</p>
                      {links.map(([label, pg])=>(
                        <div key={label} onClick={()=>nav(pg)} style={{ fontSize:13, color:"rgba(255,255,255,0.4)", marginBottom:10, cursor:"pointer" }}
                          onMouseEnter={e=>{e.currentTarget.style.color="rgba(255,255,255,0.85)"}}
                          onMouseLeave={e=>{e.currentTarget.style.color="rgba(255,255,255,0.4)"}}>
                          {label}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="footer-bottom" style={{ borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:20, display:"flex", justifyContent:"space-between" }}>
                  <p style={{ fontSize:12, color:"rgba(255,255,255,0.2)" }}>© 2025 Homes by Apollo. All rights reserved.</p>
                  <div style={{ display:"flex", gap:16 }}>
                    {["Privacy Policy","Terms"].map(i=><span key={i} style={{ fontSize:12, color:"rgba(255,255,255,0.2)", cursor:"pointer" }}>{i}</span>)}
                  </div>
                </div>
              </div>
            </div>

            {/* MONOCHROMATIC WATERMARK — very bottom of footer */}
            <div style={{ overflow:"hidden", pointerEvents:"none", userSelect:"none", lineHeight:0.85, paddingTop:8 }}>
              <div style={{
                fontSize:"13.5vw",
                fontWeight:900,
                letterSpacing:"-0.04em",
                whiteSpace:"nowrap",
                lineHeight:0.85,
                background:"linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)",
                WebkitBackgroundClip:"text",
                backgroundClip:"text",
                WebkitTextFillColor:"transparent",
                color:"transparent",
                display:"block",
                width:"100%",
                textAlign:"left",
                paddingLeft:"1.5vw",
              }}>Homes by Apollo</div>
            </div>
          </footer>
        </>}

        {/* ══ HOMES FOR SALE ══════════════════════════════════════════════════ */}
        {page==="homes" && (
          <div className="section-pad" style={{ maxWidth:1060, margin:"0 auto", padding:"40px 24px" }}>
            <SectionLabel>All Properties</SectionLabel>
            <div className="section-header-row" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:24 }}>
              <h1 style={{ fontSize:32, fontWeight:800, letterSpacing:"-0.02em" }}>Homes for Sale</h1>
              <div className="filter-row" style={{ display:"flex", gap:8 }}>
                {["All","Available","Sold"].map(f=><FilterBtn key={f} active={homeFilter===f} onClick={()=>setHomeFilter(f)}>{f}</FilterBtn>)}
              </div>
            </div>
            <div className="cards-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20, marginBottom:40 }}>
              {homes.map(h=>(
                <div key={h.id} onClick={()=>{ setSelectedHome(h); nav("home-detail"); }}>
                  <HomeCard h={h}/>
                </div>
              ))}
            </div>
            <div className="cta-banner" style={{ background:G, borderRadius:14, padding:"32px 36px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <h3 style={{ fontSize:20, fontWeight:800, color:"white", marginBottom:6 }}>Don't see what you're looking for?</h3>
                <p style={{ fontSize:13, color:"rgba(255,255,255,0.5)" }}>We build custom — tell us your vision and we'll make it happen.</p>
              </div>
              <Btn white onClick={()=>nav("contact")}>Start a Custom Build</Btn>
            </div>
          </div>
        )}

        {/* ══ AVAILABLE LOTS ══════════════════════════════════════════════════ */}
        {page==="lots" && (
          <div className="section-pad" style={{ maxWidth:1060, margin:"0 auto", padding:"40px 24px" }}>
            <SectionLabel>Land</SectionLabel>
            <div className="section-header-row" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:24 }}>
              <h1 style={{ fontSize:32, fontWeight:800, letterSpacing:"-0.02em" }}>Available Lots</h1>
              <div className="filter-row" style={{ display:"flex", gap:8 }}>
                {["All","Available","Reserved"].map(f=><FilterBtn key={f} active={lotFilter===f} onClick={()=>setLotFilter(f)}>{f}</FilterBtn>)}
              </div>
            </div>
            <div className="cards-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
              {lots.map(l=>(
                <div key={l.id} onClick={()=>{ setSelectedLot(l); nav("lot-detail"); }}>
                  <LotCard l={l}/>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ HOME DETAIL PAGE ════════════════════════════════════════════════════════ */}
        {page==="home-detail" && selectedHome && (
          <div style={{ background:"white", minHeight:"100%" }}>
            {/* Back button */}
            <div style={{ maxWidth:1160, margin:"0 auto", padding:"28px 32px 0" }}>
              <button onClick={()=>nav("homes")}
                style={{ display:"inline-flex", alignItems:"center", gap:8, background:"none", border:`1px solid ${BOR}`, borderRadius:8, padding:"8px 16px", fontSize:12, fontWeight:700, color:MUT, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=G; e.currentTarget.style.color=G;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=BOR; e.currentTarget.style.color=MUT;}}>
                ← Back to Homes
              </button>
            </div>

            {/* Opulent O-style: big address headline + price top-right */}
            <div style={{ maxWidth:1160, margin:"0 auto", padding:"32px 32px 0" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:16, marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:G, background:GL, display:"inline-block", padding:"4px 12px", borderRadius:6, marginBottom:12, letterSpacing:"0.06em", textTransform:"uppercase" }}>{selectedHome.tag}</div>
                  <h1 style={{ fontSize:"clamp(28px,4vw,52px)", fontWeight:800, letterSpacing:"-0.03em", lineHeight:1.05, color:TXT, marginBottom:6 }}>{selectedHome.addr},<br/>{selectedHome.city}</h1>
                  <div style={{ display:"flex", gap:20, fontSize:14, color:MUT, marginTop:12 }}>
                    <span>🛏 {selectedHome.bed} Beds</span>
                    <span>🚿 {selectedHome.bath} Baths</span>
                    <span>⬜ {selectedHome.sqft} sqft</span>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:12, color:MUT, marginBottom:4 }}>Price</div>
                  <div style={{ fontSize:"clamp(28px,3.5vw,44px)", fontWeight:800, color:TXT, letterSpacing:"-0.03em" }}>{selectedHome.price}</div>
                </div>
              </div>
            </div>

            {/* Full-bleed hero image */}
            <div style={{ maxWidth:1160, margin:"0 auto", padding:"24px 32px 0" }}>
              <div style={{ borderRadius:20, overflow:"hidden", height:"clamp(320px,45vw,560px)", position:"relative" }}>
                <img src={selectedHome.img} alt={selectedHome.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              </div>
            </div>

            {/* Two-column: overview + sticky contact panel */}
            <div style={{ maxWidth:1160, margin:"0 auto", padding:"48px 32px 64px", display:"grid", gridTemplateColumns:"1fr 340px", gap:48, alignItems:"start" }}>
              {/* Left: overview + details + gallery + features */}
              <div>
                {/* Overview */}
                <div style={{ marginBottom:40 }}>
                  <h2 style={{ fontSize:20, fontWeight:800, color:TXT, marginBottom:16, paddingBottom:12, borderBottom:`1px solid ${BOR}` }}>Overview</h2>
                  <p style={{ fontSize:14, color:MUT, lineHeight:1.85 }}>Experience the warmth and comfort of a brand-new Apollo home in Pahrump, Nevada. Built all-inclusive — land prep, foundation, framing, finishes, and landscaping — one price, no surprises. This {selectedHome.bed}-bedroom, {selectedHome.bath}-bath home is designed for Nevada living with energy-efficient construction and custom finish options.</p>
                </div>

                {/* Details table */}
                <div style={{ marginBottom:40 }}>
                  <h2 style={{ fontSize:20, fontWeight:800, color:TXT, marginBottom:16, paddingBottom:12, borderBottom:`1px solid ${BOR}` }}>Details</h2>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0 }}>
                    {[
                      ["Category","Family Home"],
                      ["Status",selectedHome.tag],
                      ["Year Built","2025"],
                      ["Bedrooms",String(selectedHome.bed)],
                      ["Bathrooms",String(selectedHome.bath)],
                      ["Square Footage",selectedHome.sqft+" sqft"],
                      ["Garage","2-Car"],
                      ["Floors","1"],
                    ].map(([k,v],i)=>(
                      <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"13px 0", borderBottom:`1px solid ${BOR}`, gridColumn:"span 1" }}>
                        <span style={{ fontSize:13, color:MUT, fontWeight:500 }}>{k}</span>
                        <span style={{ fontSize:13, color:TXT, fontWeight:700 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gallery */}
                <div style={{ marginBottom:40 }}>
                  <h2 style={{ fontSize:20, fontWeight:800, color:TXT, marginBottom:8, paddingBottom:12, borderBottom:`1px solid ${BOR}` }}>Gallery</h2>
                  <p style={{ fontSize:13, color:MUT, marginBottom:20 }}>Explore elegant spaces and captivating design</p>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                    {[
                      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80",
                      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80",
                      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&q=80",
                      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&q=80",
                      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&q=80",
                      selectedHome.img,
                    ].map((src,i)=>(
                      <div key={i} style={{ borderRadius:12, overflow:"hidden", height:140 }}>
                        <img src={src} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h2 style={{ fontSize:20, fontWeight:800, color:TXT, marginBottom:8, paddingBottom:12, borderBottom:`1px solid ${BOR}` }}>Features</h2>
                  <p style={{ fontSize:13, color:MUT, marginBottom:24 }}>Exquisite details and all-inclusive amenities</p>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
                    {[
                      ["Construction",[["Build Type","All-Inclusive"],["Foundation","Slab"],["Framing","Wood Frame"],["Roof","Tile"]]],
                      ["Interior",[["Flooring","Luxury Vinyl Plank"],["Cabinets","Custom Shaker"],["Countertops","Granite"],["Appliances","Stainless Steel"]]],
                      ["Exterior",[["Siding","Stucco"],["Garage","2-Car Attached"],["Landscaping","Included"],["Driveway","Concrete"]]],
                      ["Systems",[["HVAC","Central Air"],["Water Heater","Tankless"],["Electrical","200 Amp"],["Plumbing","PEX"]]],
                    ].map(([cat,items])=>(
                      <div key={String(cat)}>
                        <div style={{ fontSize:12, fontWeight:700, color:G, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>{cat}</div>
                        {(items as [string,string][]).map(([k,v])=>(
                          <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${BOR}` }}>
                            <span style={{ fontSize:12, color:MUT }}>{k}</span>
                            <span style={{ fontSize:12, color:TXT, fontWeight:600 }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: sticky contact panel */}
              <div style={{ position:"sticky", top:24 }}>
                <div style={{ background:"white", borderRadius:16, border:`1px solid ${BOR}`, boxShadow:"0 4px 32px rgba(0,0,0,0.08)", overflow:"hidden" }}>
                  <div style={{ background:G, padding:"24px 24px 20px" }}>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:4 }}>Listing Price</div>
                    <div style={{ fontSize:32, fontWeight:800, color:"white", letterSpacing:"-0.03em" }}>{selectedHome.price}</div>
                  </div>
                  <div style={{ padding:"20px 24px 24px" }}>
                    <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
                      {[
                        ["🛏",`${selectedHome.bed} Bedrooms`],
                        ["🚿",`${selectedHome.bath} Bathrooms`],
                        ["⬜",`${selectedHome.sqft} sqft`],
                        ["📍",selectedHome.city],
                      ].map(([icon,val])=>(
                        <div key={val} style={{ display:"flex", alignItems:"center", gap:10, fontSize:13, color:TXT }}>
                          <span style={{ fontSize:16 }}>{icon}</span>{val}
                        </div>
                      ))}
                    </div>
                    <Btn full onClick={()=>nav("contact")}>Request a Call</Btn>
                    <div style={{ marginTop:12, textAlign:"center", fontSize:11, color:MUT }}>No obligation — just a conversation</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ LOT DETAIL PAGE ════════════════════════════════════════════════════════════ */}
        {page==="lot-detail" && selectedLot && (
          <div style={{ background:"white", minHeight:"100%" }}>
            {/* Back button */}
            <div style={{ maxWidth:1160, margin:"0 auto", padding:"28px 32px 0" }}>
              <button onClick={()=>nav("lots")}
                style={{ display:"inline-flex", alignItems:"center", gap:8, background:"none", border:`1px solid ${BOR}`, borderRadius:8, padding:"8px 16px", fontSize:12, fontWeight:700, color:MUT, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=G; e.currentTarget.style.color=G;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=BOR; e.currentTarget.style.color=MUT;}}>
                ← Back to Lots
              </button>
            </div>

            {/* Big address headline */}
            <div style={{ maxWidth:1160, margin:"0 auto", padding:"32px 32px 0" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:16, marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:selectedLot.tag==="Available"?G:"#888", background:selectedLot.tag==="Available"?GL:"#f0f0f0", display:"inline-block", padding:"4px 12px", borderRadius:6, marginBottom:12, letterSpacing:"0.06em", textTransform:"uppercase" }}>{selectedLot.tag}</div>
                  <h1 style={{ fontSize:"clamp(28px,4vw,52px)", fontWeight:800, letterSpacing:"-0.03em", lineHeight:1.05, color:TXT, marginBottom:6 }}>{selectedLot.addr},<br/>{selectedLot.city}</h1>
                  <div style={{ display:"flex", gap:20, fontSize:14, color:MUT, marginTop:12 }}>
                    <span>📍 {selectedLot.size}</span>
                    <span>🔌 {selectedLot.utilities}</span>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:12, color:MUT, marginBottom:4 }}>Price</div>
                  <div style={{ fontSize:"clamp(28px,3.5vw,44px)", fontWeight:800, color:TXT, letterSpacing:"-0.03em" }}>{selectedLot.price}</div>
                </div>
              </div>
            </div>

            {/* Full-bleed hero image */}
            <div style={{ maxWidth:1160, margin:"0 auto", padding:"24px 32px 0" }}>
              <div style={{ borderRadius:20, overflow:"hidden", height:"clamp(280px,40vw,480px)", position:"relative" }}>
                <img src={selectedLot.img} alt={selectedLot.addr} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(8,12,28,0.3) 0%, transparent 60%)" }} />
              </div>
            </div>

            {/* Two-column: overview + sticky contact panel */}
            <div style={{ maxWidth:1160, margin:"0 auto", padding:"48px 32px 64px", display:"grid", gridTemplateColumns:"1fr 340px", gap:48, alignItems:"start" }}>
              {/* Left */}
              <div>
                {/* Overview */}
                <div style={{ marginBottom:40 }}>
                  <h2 style={{ fontSize:20, fontWeight:800, color:TXT, marginBottom:16, paddingBottom:12, borderBottom:`1px solid ${BOR}` }}>Overview</h2>
                  <p style={{ fontSize:14, color:MUT, lineHeight:1.85 }}>A {selectedLot.size} lot in Pahrump, Nevada — ready for your Apollo custom build. Utilities are already stubbed to the lot line: {selectedLot.utilities}. Pahrump offers no state income tax, low property taxes, and wide-open desert views just 60 miles from Las Vegas.</p>
                </div>

                {/* Details */}
                <div style={{ marginBottom:40 }}>
                  <h2 style={{ fontSize:20, fontWeight:800, color:TXT, marginBottom:16, paddingBottom:12, borderBottom:`1px solid ${BOR}` }}>Lot Details</h2>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0 }}>
                    {[
                      ["Size",selectedLot.size],
                      ["Status",selectedLot.tag],
                      ["County","Nye County, NV"],
                      ["Zoning","Residential"],
                      ["Utilities",selectedLot.utilities],
                      ["Road Access","Paved"],
                      ["HOA","None"],
                      ["Build-Ready","Yes"],
                    ].map(([k,v])=>(
                      <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"13px 0", borderBottom:`1px solid ${BOR}` }}>
                        <span style={{ fontSize:13, color:MUT, fontWeight:500 }}>{k}</span>
                        <span style={{ fontSize:13, color:TXT, fontWeight:700 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Location features */}
                <div>
                  <h2 style={{ fontSize:20, fontWeight:800, color:TXT, marginBottom:8, paddingBottom:12, borderBottom:`1px solid ${BOR}` }}>Location Highlights</h2>
                  <p style={{ fontSize:13, color:MUT, marginBottom:24 }}>What makes Pahrump, NV the right place to build</p>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                    {[
                      ["🏕️","60 mi to Las Vegas","Easy access to the Strip, airport, and employment"],
                      ["🌡️","Desert Climate","300+ sunny days per year, low humidity"],
                      ["💰","No State Income Tax","Nevada is one of 9 states with zero income tax"],
                      ["🏡","Low Property Taxes","Nye County rates well below national average"],
                    ].map(([icon,title,desc])=>(
                      <div key={title} style={{ background:BG, borderRadius:12, padding:"16px 18px" }}>
                        <div style={{ fontSize:22, marginBottom:8 }}>{icon}</div>
                        <div style={{ fontSize:13, fontWeight:700, color:TXT, marginBottom:4 }}>{title}</div>
                        <div style={{ fontSize:12, color:MUT, lineHeight:1.6 }}>{desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: sticky contact panel */}
              <div style={{ position:"sticky", top:24 }}>
                <div style={{ background:"white", borderRadius:16, border:`1px solid ${BOR}`, boxShadow:"0 4px 32px rgba(0,0,0,0.08)", overflow:"hidden" }}>
                  <div style={{ background:G, padding:"24px 24px 20px" }}>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginBottom:4 }}>Lot Price</div>
                    <div style={{ fontSize:32, fontWeight:800, color:"white", letterSpacing:"-0.03em" }}>{selectedLot.price}</div>
                  </div>
                  <div style={{ padding:"20px 24px 24px" }}>
                    <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
                      {[
                        ["📍",selectedLot.size+" lot"],
                        ["🔌",selectedLot.utilities],
                        ["🏠","Build-ready"],
                        ["📍",selectedLot.city],
                      ].map(([icon,val])=>(
                        <div key={val} style={{ display:"flex", alignItems:"center", gap:10, fontSize:13, color:TXT }}>
                          <span style={{ fontSize:16 }}>{icon}</span>{val}
                        </div>
                      ))}
                    </div>
                    <Btn full onClick={()=>nav("contact")}>Request a Call</Btn>
                    <div style={{ marginTop:12, textAlign:"center", fontSize:11, color:MUT }}>No obligation — just a conversation</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ BLOG ════════════════════════════════════════════════════════════ */}
        {page==="blog" && (
          <div className="section-pad" style={{ maxWidth:1060, margin:"0 auto", padding:"40px 24px" }}>
            <SectionLabel>Insights</SectionLabel>
            <div className="section-header-row" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:24 }}>
              <h1 style={{ fontSize:32, fontWeight:800, letterSpacing:"-0.02em" }}>From the Blog</h1>
              <div className="filter-row" style={{ display:"flex", gap:8 }}>
                {["All","Tips","Construction","Investment"].map(f=><FilterBtn key={f} active={blogFilter===f} onClick={()=>setBlogFilter(f)}>{f}</FilterBtn>)}
              </div>
            </div>
            <div className="cards-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
              {blogs.map(b=>(
                <div key={b.title} style={{ background:"white", borderRadius:14, overflow:"hidden", cursor:"pointer", border:`1px solid ${BOR}`, boxShadow:"0 2px 16px rgba(0,0,0,0.05)" }}>
                  <img src={b.img} alt={b.title} style={{ width:"100%", height:180, objectFit:"cover" }} />
                  <div style={{ padding:"18px 20px 22px" }}>
                    <span style={{ fontSize:10, fontWeight:700, color:G, background:GL, padding:"3px 9px", borderRadius:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>{b.cat}</span>
                    <div style={{ fontSize:15, fontWeight:700, color:TXT, lineHeight:1.45, marginTop:10, marginBottom:12 }}>{b.title}</div>
                    <div style={{ fontSize:11, color:MUT, marginBottom:16 }}>{b.date} · {b.read} read</div>
                    <button style={{ fontSize:12, fontWeight:700, color:G, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}>Read More →</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ CONTACT ═════════════════════════════════════════════════════════ */}
        {page==="contact" && (
          <div className="section-pad" style={{ maxWidth:900, margin:"0 auto", padding:"40px 24px" }}>
            <SectionLabel>Get in Touch</SectionLabel>
            <div className="contact-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:36 }}>
              <div>
                <h1 style={{ fontSize:32, fontWeight:800, letterSpacing:"-0.02em", lineHeight:1.1, marginBottom:16 }}>Schedule a<br/>Free Consultation</h1>
                <p style={{ fontSize:14, color:MUT, lineHeight:1.85, marginBottom:28 }}>Ready to build? Have questions? Brandon and the Apollo team are here to help. No pressure — just a real conversation about your vision.</p>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {([["📍","Office","5158 Arville St, Las Vegas, NV 89118"],["📞","Phone","(702) 588-9889"],["✉️","Email","brandon@apollohomebuilders.com"],["🪪","License","NV No. 0077907"]] as [string,string,string][]).map(([icon,label,val])=>(
                    <div key={label} style={{ display:"flex", alignItems:"flex-start", gap:12, background:"white", padding:"13px 16px", borderRadius:10, border:`1px solid ${BOR}` }}>
                      <span style={{ fontSize:18 }}>{icon}</span>
                      <div>
                        <div style={{ fontSize:10, fontWeight:700, color:G, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:2 }}>{label}</div>
                        <div style={{ fontSize:13, color:TXT, fontWeight:500 }}>{val}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background:"white", borderRadius:14, padding:"28px 24px", border:`1px solid ${BOR}`, boxShadow:"0 4px 32px rgba(0,0,0,0.06)" }}>
                {formSent ? (
                  <div style={{ textAlign:"center", padding:"32px 0" }}>
                    <div style={{ fontSize:44, marginBottom:12 }}>✅</div>
                    <h3 style={{ fontSize:20, fontWeight:800, marginBottom:10 }}>Message Sent!</h3>
                    <p style={{ color:MUT, fontSize:13, lineHeight:1.7 }}>Brandon will reach out within 1 business day.</p>
                  </div>
                ) : (
                  <>
                    <h3 style={{ fontSize:17, fontWeight:800, marginBottom:20 }}>Send us a message</h3>
                    <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
                      {([["Name","text","name","Your full name"],["Email","email","email","your@email.com"],["Phone","tel","phone","(702) 555-0000"]] as [string,string,keyof FormState,string][]).map(([label,type,key,ph])=>(
                        <div key={key}>
                          <label style={{ fontSize:11, fontWeight:700, color:MUT, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:4 }}>{label}</label>
                          <input type={type} placeholder={ph} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}
                            style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1px solid ${BOR}`, fontSize:13, outline:"none", color:TXT }}
                            onFocus={e=>{e.currentTarget.style.borderColor=G}} onBlur={e=>{e.currentTarget.style.borderColor=BOR}}/>
                        </div>
                      ))}
                      <div>
                        <label style={{ fontSize:11, fontWeight:700, color:MUT, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:4 }}>I'm interested in</label>
                        <select value={form.interest} onChange={e=>setForm({...form,interest:e.target.value})}
                          style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1px solid ${BOR}`, fontSize:13, outline:"none", color:TXT, background:"white" }}>
                          <option value="buy">Buying a Home</option>
                          <option value="build">Building a Custom Home</option>
                          <option value="lot">Purchasing a Lot</option>
                          <option value="general">General Question</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize:11, fontWeight:700, color:MUT, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:4 }}>Message</label>
                        <textarea placeholder="Tell us about your project..." rows={3} value={form.message} onChange={e=>setForm({...form,message:e.target.value})}
                          style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1px solid ${BOR}`, fontSize:13, outline:"none", color:TXT, resize:"vertical" }}
                          onFocus={e=>{e.currentTarget.style.borderColor=G}} onBlur={e=>{e.currentTarget.style.borderColor=BOR}}/>
                      </div>
                      <button onClick={()=>form.email&&setFormSent(true)}
                        style={{ background:G, color:"white", border:"none", padding:"13px", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                        Send Message ↗
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
