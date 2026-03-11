import { useState, useEffect, useRef } from "react";
import type React from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

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
  { cat:"Tips", title:"Why Pahrump is Nevada's Best-Kept Secret for New Home Buyers", date:"Feb 12, 2025", read:"5 min", img:"https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/blog-nevada-homebuying-7NoddsjLZqhAmdfd2knfqU.webp" },
  { cat:"Construction", title:"What to Expect During Your Apollo Home Build", date:"Jan 28, 2025", read:"7 min", img:"https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/blog-construction-4GJBhhCpotjFbWS7hpxogF.webp" },
  { cat:"Investment", title:"The Case for Multi-Family Builds in Southern Nevada", date:"Jan 10, 2025", read:"6 min", img:"https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/blog-investment-8KFZKqzrwoZiwzAc7Cw3b4.webp" },
];

// Home-page FAQ (5 featured questions)
const faqs: [string, string][] = [
  ["How much does it cost to build a home with Apollo?","Our all-inclusive packages start in the low $300s and scale with lot size, floor plan, and finish selections. Every quote is fixed-price — what you sign is what you pay. No change-order surprises."],
  ["How long does the build process take?","Most single-family homes take 6–9 months from signed contract to keys in hand. We provide a written construction schedule at contract signing and update you at every milestone."],
  ["Do you help with financing?","Yes. We have relationships with Pahrump-area lenders who specialize in construction-to-permanent loans. We'll connect you at your first consultation so financing never holds up your timeline."],
  ["What does Apollo's warranty cover?","Every Apollo home comes with a 1-year workmanship warranty, a 2-year mechanical warranty covering plumbing, electrical, and HVAC, and a 10-year structural warranty on the foundation and framing."],
  ["Do you have lots available right now?","Yes — we currently have lots available in Pahrump ranging from 0.25 to 1+ acres, starting at $45,000. Lot inventory moves quickly; schedule a consultation to see what's available today."],
];

// Full FAQ page — 14 questions across 4 categories
const allFaqs: { category: string; items: [string, string][] }[] = [
  {
    category: "Pricing & Financing",
    items: [
      ["How much does it cost to build a home with Apollo?","Our all-inclusive packages start in the low $300s for a standard 3-bedroom, 2-bath home on a standard lot. Pricing scales with lot size, square footage, and finish selections. Every quote is fixed-price — what you sign is what you pay, with no change-order surprises."],
      ["What is included in the all-inclusive price?","The price covers everything: land preparation, foundation, framing, roofing, electrical, plumbing, HVAC, insulation, drywall, interior and exterior paint, flooring, cabinetry, countertops, appliances, fixtures, and front landscaping. One number, no hidden line items."],
      ["Do you help buyers secure financing?","Yes. We work with a network of preferred lenders who specialize in Pahrump construction-to-permanent loans. We'll make introductions at your first consultation so you can get pre-approved before breaking ground."],
      ["Can I use my own lender?","Absolutely. You are welcome to bring your own financing. We simply ask that your lender is familiar with construction draw schedules, as funds are released in stages tied to build milestones."],
    ],
  },
  {
    category: "The Build Process",
    items: [
      ["How long does the build process take from contract to keys?","Most single-family homes take 6–9 months from signed contract to certificate of occupancy. More complex plans or custom floor plans may run 9–12 months. You receive a written construction schedule at contract signing and milestone updates throughout."],
      ["What happens after I sign a contract?","We begin with a design meeting to finalize your floor plan, elevations, and finish selections. Once permits are approved by Nye County — typically 4–8 weeks — ground breaks and your build schedule starts."],
      ["Can I visit the site during construction?","Yes, and we encourage it. We schedule formal walkthroughs at the framing stage, pre-drywall stage, and final walk before closing. You can also request site visits at any time with 24-hour notice."],
      ["What if I want to make changes mid-build?","Minor changes to finishes or fixtures can often be accommodated before the relevant trade is scheduled. Structural changes after permit approval require a change order and may affect the timeline. We are transparent about costs before any change is made."],
    ],
  },
  {
    category: "Lots & Location",
    items: [
      ["Do you have lots available right now?","Yes. We currently have lots available in Pahrump ranging from 0.25 to 1+ acres, starting at $45,000. Lot inventory moves quickly. Schedule a consultation to see current availability and pricing."],
      ["Can I bring my own lot?","Yes. If you already own land in Pahrump or Nye County, we can build on it. We'll evaluate the lot for utility access, setback requirements, and soil conditions before providing a fixed-price quote."],
      ["Why build in Pahrump, Nevada?","Pahrump offers no state income tax, no city tax, and significantly lower land costs than Las Vegas — while being just 60 miles from the Strip. The area is growing rapidly, making it attractive for both primary residences and investment properties."],
    ],
  },
  {
    category: "Warranty & After Move-In",
    items: [
      ["What warranty does Apollo provide?","Every Apollo home includes a 1-year workmanship warranty, a 2-year mechanical warranty covering plumbing, electrical, and HVAC systems, and a 10-year structural warranty on the foundation and load-bearing framing."],
      ["How do I submit a warranty claim?","Contact us at hello@apollohomebuilders.com or call our office directly. We aim to respond to all warranty requests within 1 business day and schedule repairs within 5 business days for non-emergency items."],
      ["Do you build investment properties and multi-family homes?","Yes. We have experience building multi-unit investment properties in Pahrump, including 8- and 12-unit configurations. Investment builds follow the same fixed-price, all-inclusive model. Contact us to discuss your investment goals."],
    ],
  },
];

const testimonials = [
  { quote:"Apollo made the entire process seamless. From picking our lot to getting the keys, they were with us every step. No hidden costs — exactly what they promised.", name:"Marcus & Diana R.", role:"First-Time Homebuyers", img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" },
  { quote:"We built a 12-unit investment property with Apollo. Their local knowledge of Pahrump saved us months of permitting headaches. I'd build with them again tomorrow.", name:"James Kowalski", role:"Real Estate Investor", img:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80" },
  { quote:"The all-inclusive pricing was the deciding factor for us. We knew exactly what we were spending from day one. The home turned out even better than the plans.", name:"Sandra Tran", role:"Homebuyer, Pahrump NV", img:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80" },
];

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
    <div style={{ width:56, height:2, background:ACC, borderRadius:2 }} />
    <span style={{ fontSize:19, fontWeight:700, color:MUT, textTransform:"uppercase", letterSpacing:"0.12em" }}>{children}</span>
  </div>
);

interface BtnProps {
  children: React.ReactNode;
  white?: boolean;
  outline?: boolean;
  small?: boolean;
  full?: boolean;
  carolina?: boolean;
  onClick?: () => void;
}

const Btn = ({ children, white, outline, small, full, carolina, onClick }: BtnProps) => {
  const [hov, setHov] = useState(false);
  const base: React.CSSProperties = {
    display:"inline-flex", alignItems:"center", justifyContent:"center", gap:5,
    borderRadius:8, fontWeight:700, cursor:"pointer", transition:"all 0.18s",
    border:"none", fontFamily:"inherit",
    // carolina blue section buttons: fixed 200×65px; otherwise use full/small sizing
    ...(carolina
      ? { width:200, height:65, fontSize:20, padding:0 }
      : { width: full ? "100%" : undefined, fontSize:small?14:15, padding:small?"11px 22px":"14px 26px" }
    ),
  };
  let style: React.CSSProperties;
  if (carolina)     style = { ...base, background: hov?"#4fa8d5":"#5bb8f5", color:G };
  else if (white)   style = { ...base, background: hov?"#f0f0f0":"white", color:G };
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
      <div style={{ position:"relative", height:430, overflow:"hidden", borderRadius:16, marginBottom:16 }}>
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
      <div style={{ position:"relative", height:430, overflow:"hidden", borderRadius:16, marginBottom:16 }}>
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
    <div
      onClick={()=>setOpen(!open)}
      style={{
        background: open ? "white" : "#f4f5f7",
        borderRadius: 10,
        padding: "0 28px",
        cursor: "pointer",
        border: `1px solid ${open ? BOR : "transparent"}`,
        transition: "background 0.2s, box-shadow 0.2s",
        boxShadow: open ? "0 2px 16px rgba(0,0,0,0.06)" : "none",
        minHeight: open ? undefined : 95,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:24, minHeight: open ? 95 : undefined }}>
        <span style={{ fontSize:20, fontWeight:700, color:TXT, lineHeight:1.4 }}>{q}</span>
        <span style={{ fontSize:24, color: open ? G : MUT, fontWeight:300, flexShrink:0, transform:open?"rotate(45deg)":"rotate(0)", transition:"transform 0.2s, color 0.2s", lineHeight:1 }}>+</span>
      </div>
      {open && <p style={{ marginTop:0, paddingBottom:22, fontSize:16, color:MUT, lineHeight:1.8 }}>{a}</p>}
    </div>
  );
}

function FilterBtn({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ padding:"7px 14px", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", border:`1px solid ${active?G:BOR}`, background:active?G:"white", color:active?"white":MUT, transition:"all 0.15s", fontFamily:"inherit", whiteSpace:"nowrap" }}>{children}</button>
  );
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  contactType: "BUYER" | "AGENT";
  timeline: string;
  priceRange: string;
  financingStatus: string;
  brokerageName: string;
  message: string;
}

export default function ApolloSite() {
  const [page, setPage] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FormState>({ name:"", email:"", phone:"", contactType:"BUYER", timeline:"", priceRange:"", financingStatus:"", brokerageName:"", message:"" });
  const [formSent, setFormSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const contactMutation = trpc.leads.submit.useMutation({
    onSuccess: () => { setFormSent(true); setFormError(null); },
    onError: (err: { message?: string }) => { setFormError(err.message || "Failed to send. Please try again."); },
  });
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const newsletterMutation = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => { setSubmitted(true); setNewsletterError(null); },
    onError: (err: { message?: string }) => { setNewsletterError(err.message || "Something went wrong. Please try again."); },
  });

  const [homeFilter, setHomeFilter] = useState("All");
  const [lotFilter, setLotFilter] = useState("All");
  const [blogFilter, setBlogFilter] = useState("All");
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [featCarouselIdx, setFeatCarouselIdx] = useState(0);

  // Live featured properties from database
  const { data: dbFeaturedProps, isLoading: featPropsLoading } = trpc.properties.getFeatured.useQuery();
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
        :root {
          --pad: clamp(24px, 4.5vw, 80px);
          --container: 1680px;
        }
        .site-container {
          max-width: var(--container);
          margin: 0 auto;
          width: 100%;
        }
        ::selection{background:${G};color:white}
        input,textarea,select,button{font-family:inherit}

        /* Auto-fit masked headline: SVG <text> with textLength fills 100% width exactly */
        .photo-clip-container {
          width: 100%;
          max-width: 1690px;
          margin: 0 auto;
          padding: 0;
          box-sizing: border-box;
          display: block;
          overflow: hidden;
          line-height: 1;
        }
        .photo-clip-svg {
          display: block;
          width: 100%;
          height: auto;
          overflow: visible;
        }

        /* ── Mobile overrides ─────────────────────────────── */
        .hero-section { padding-top: 108px; }

        /* Blog cards: fixed 515px on desktop, fluid on smaller screens */
        .blog-cards-grid {
          grid-template-columns: repeat(3, 515px);
          justify-content: start;
        }
        .blog-card-img { width: 515px; height: 336px; }

        @media (max-width: 1200px) {
          .blog-cards-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .blog-card-img { width: 100% !important; height: 260px !important; }
        }

        @media (max-width: 768px) {
          .blog-cards-grid { grid-template-columns: 1fr !important; }
          .blog-card-img { width: 100% !important; height: 220px !important; }
        }

        @media (max-width: 768px) {
          .hero-section { padding-top: 40px !important; }
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
          .mobile-sticky-cta  { display: flex !important; }

          .featured-props-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
        }

        @media (min-width: 769px) {
          .hamburger-btn { display: none !important; }
          .mobile-menu   { display: none !important; }
        }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <div style={{ background:"#ffffff", boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.07)" : "none", transition:"box-shadow 0.2s", flexShrink:0, zIndex:200, position:"relative" }}>
      <nav style={{
        background: "transparent",
        padding: "40px var(--pad) 0" as React.CSSProperties["padding"],
        height: 136,
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        transition: "all 0.2s",
        position: "relative",
        maxWidth: "var(--container)" as React.CSSProperties["maxWidth"],
        marginLeft: "auto", marginRight: "auto",
        width: "100%",
      }}>
        {/* Logo — owl icon + wordmark */}
        <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }} onClick={()=>nav("home")}>
          <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/homes_by_apollo_clean-Edited_22d5e06c.png" alt="Apollo Owl" style={{ height:65, width:65, objectFit:"contain", display:"block" }} />
          <div style={{ display:"flex", flexDirection:"column", lineHeight:1, gap:1 }}>
            <span style={{ fontSize:17, fontWeight:700, letterSpacing:"0.32em", color:TXT, textTransform:"uppercase", opacity:1 }}>HOMES BY</span>
            <span style={{ fontSize:30, fontWeight:900, letterSpacing:"0.07em", color:TXT, lineHeight:1 }}>APOLLO</span>
          </div>
        </div>

        {/* Desktop center nav */}
        <div className="desktop-nav-center" style={{ display:"flex", gap:28, alignItems:"center" }} />

        {/* Desktop CTAs */}
        <div className="desktop-nav-ctas" style={{ display:"flex", gap:10, alignItems:"center" }}>
          {isAdmin && (
            <a
              href="/crm"
              style={{
                fontSize:14, fontWeight:700, textDecoration:"none",
                color:"#e07b39", background:"white",
                border:"2px solid #e07b39", borderRadius:8,
                padding:"0 18px", height:70, letterSpacing:"0.01em",
                lineHeight:1, display:"inline-flex", alignItems:"center",
                transition:"background 0.15s, color 0.15s",
              }}
              onMouseEnter={e=>{ e.currentTarget.style.background="#e07b39"; e.currentTarget.style.color="white"; }}
              onMouseLeave={e=>{ e.currentTarget.style.background="white"; e.currentTarget.style.color="#e07b39"; }}
            >
              Admin
            </a>
          )}
          <button
            onClick={()=>nav("contact")}
            style={{ width:200, height:70, display:"inline-flex", alignItems:"center", justifyContent:"center", gap:5, borderRadius:8, fontWeight:700, cursor:"pointer", transition:"all 0.18s", border:"none", fontSize:14, fontFamily:"inherit", background:G, color:"white", flexShrink:0 }}
            onMouseEnter={e=>{ e.currentTarget.style.background=GM; }}
            onMouseLeave={e=>{ e.currentTarget.style.background=G; }}
          >Schedule a Consultation ↗</button>
          <button
            onClick={()=>nav("homes")}
            style={{ width:200, height:70, display:"inline-flex", alignItems:"center", justifyContent:"center", gap:5, borderRadius:8, fontWeight:700, cursor:"pointer", transition:"all 0.18s", border:`1.5px solid ${G}`, fontSize:14, fontFamily:"inherit", background:"transparent", color:G, flexShrink:0 }}
            onMouseEnter={e=>{ e.currentTarget.style.background=GL; }}
            onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; }}
          >View Homes &amp; Lots ↗</button>
        </div>

        {/* Hamburger */}
        <button className="hamburger-btn" onClick={()=>setMenuOpen(!menuOpen)}
          style={{ background:G, border:"none", borderRadius:8, padding:"10px 12px", cursor:"pointer", flexDirection:"column", gap:5, alignItems:"center", justifyContent:"center" }}>
          <span style={{ display:"block", width:20, height:2, background:"white", borderRadius:2, transition:"all 0.2s", transform:menuOpen?"rotate(45deg) translate(4px,4px)":"none" }}/>
          <span style={{ display:"block", width:20, height:2, background:"white", borderRadius:2, transition:"all 0.2s", opacity:menuOpen?0:1 }}/>
          <span style={{ display:"block", width:20, height:2, background:"white", borderRadius:2, transition:"all 0.2s", transform:menuOpen?"rotate(-45deg) translate(4px,-4px)":"none" }}/>
        </button>
      </nav>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="mobile-menu" style={{
          position:"fixed", top:64, left:0, right:0, zIndex:190,
          background:"white", borderBottom:`1px solid ${BOR}`,
          boxShadow:"0 8px 32px rgba(0,0,0,0.12)", padding:"16px 20px 20px",
        }}>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {isAdmin && (
              <a
                href="/crm"
                style={{
                  display:"block", textAlign:"center", padding:"12px 16px",
                  fontSize:14, fontWeight:700, textDecoration:"none",
                  color:"#e07b39", background:"white",
                  border:"2px solid #e07b39", borderRadius:8,
                  letterSpacing:"0.01em",
                }}
              >
                Admin
              </a>
            )}
            <Btn full onClick={()=>nav("contact")}>Schedule a Consultation</Btn>
            <Btn full outline onClick={()=>nav("homes")}>View Homes &amp; Lots</Btn>
          </div>
        </div>
      )}

      {/* ── SCROLLABLE CONTENT ───────────────────────────────────────────────── */}
      <div ref={topRef} style={{ flex:1, overflowY:"auto" }}>

        {/* ══ HOME PAGE ══════════════════════════════════════════════════════ */}
        {page==="home" && <>

          {/* HERO + FEATURED PROPERTIES OVERLAP WRAPPER */}
          <div style={{ position:"relative", background:"white" }}>

          {/* HERO */}
          <div className="hero-section" style={{ paddingTop:108, paddingBottom:0, textAlign:"center", position:"relative", zIndex:2 }}>
            {/* White top band — covers headline + search bar area */}
            <div style={{ position:"absolute", inset:0, bottom:"50%", background:"white", zIndex:0 }} />
            {/* Navy bottom band — covers bottom 32.5% of hero section (50% × 0.65) */}
            <div style={{ position:"absolute", inset:0, top:"67.5%", background:"#0f2044", zIndex:0 }} />

            {/* Content sits above both bands */}
            <div style={{ position:"relative", zIndex:2 }}>
              <h1 className="hero-headline" style={{
                fontSize: "clamp(36px,5.8vw,92px)",
                fontWeight: 800, color: TXT, lineHeight: 1.05,
                letterSpacing: "-0.04em",
                margin: "0 auto 24px", padding: "0 var(--pad)",
                whiteSpace: "normal",
              }}>
                <span style={{ display:"block", whiteSpace:"nowrap" }}>Find Your Dream Home</span>
                <span style={{ display:"block", whiteSpace:"nowrap" }}>in Pahrump</span>
              </h1>
              <p className="hero-subtitle" style={{ fontSize:23, color:"#4a5568", margin:"0 auto 32px", lineHeight:1.65, fontWeight:400, padding:"0 var(--pad)", whiteSpace:"nowrap" }}>
                Explore our listings to find the perfect place to call home.
              </p>

              {/* Search bar — floats above the image */}
              <div className="search-bar" style={{
                display:"inline-flex", alignItems:"center",
                background:"#e8eaed", borderRadius:14,
                boxShadow:"0 4px 40px rgba(0,0,0,0.12)",
                padding:"10px", gap:6,
                position:"relative", zIndex:10,
                width:790, height:100, maxWidth:"calc(100% - 32px)",
                marginBottom:0, boxSizing:"border-box",
              }}>
                {[
                  [<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={MUT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, "Location"],
                  [<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={MUT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, "Property"],
                  [<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={MUT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, "Budget"],
                ].map(([icon,label],i)=>(
                  <div key={label as string} className="search-bar-item" style={{
                    display:"flex", alignItems:"center", gap:10,
                    padding:"14px 22px",
                    background:"white",
                    border:"1.5px solid #d8dde8",
                    borderRadius:10,
                    cursor:"pointer", flex:1, alignSelf:"stretch",
                  }}>
                    <span style={{ display:"flex", alignItems:"center", flexShrink:0 }}>{icon}</span>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, justifyContent:"space-between" }}>
                      <div style={{ fontSize:18, fontWeight:600, color:TXT, letterSpacing:"0.01em" }}>{label}</div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                  </div>
                ))}
                <button className="search-bar-btn" onClick={()=>nav("homes")} style={{
                  background:"#0f2044", color:"white", border:"none",
                  padding:"0 36px", borderRadius:10,
                  fontSize:17, fontWeight:700, cursor:"pointer",
                  fontFamily:"inherit", letterSpacing:"0.02em",
                  whiteSpace:"nowrap", alignSelf:"stretch",
                }}>Search</button>
              </div>

              {/* Hero image — inset with horizontal padding, sits above both bg bands */}
              <div className="hero-image-wrap" style={{ margin:"0 auto", marginTop:-40, width:1680, maxWidth:"100%", padding:"0 16px", boxSizing:"border-box", position:"relative", zIndex:3 }}>
                <div style={{ width:"100%", height:720, overflow:"hidden", borderRadius:16, boxShadow:"0 24px 80px rgba(8,12,28,0.38), 0 8px 24px rgba(8,12,28,0.22)", position:"relative" }}>
                  <img
                    src="https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/hero-nevada-home-jLv3PVjtmSM8wPtXaTU7Jy.webp"
                    alt="Pahrump custom home"
                    style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center 40%" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ══ FEATURED PROPERTIES ═══════════════════════════════════ */}
          <div style={{ background:"#0f2044", paddingTop:"calc(280px + 72px)", paddingBottom:80, paddingLeft:"var(--pad)", paddingRight:"var(--pad)", position:"relative", zIndex:1, marginTop:-280 }}>
            <div className="site-container">
            {/* Header row */}
            <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:40, flexWrap:"wrap", gap:16 }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                  <div style={{ width:40, height:2, background:"#4B9CD3" }} />
                  <span style={{ fontSize:19, fontWeight:600, color:"#4B9CD3", letterSpacing:"0.08em", textTransform:"uppercase" }}>Exclusive property</span>
                </div>
                <h2 style={{ fontSize:"clamp(32px,4vw,52px)", fontWeight:800, color:"white", letterSpacing:"-0.03em", lineHeight:1.1, margin:0 }}>Featured Properties</h2>
              </div>
              <button
                onClick={()=>nav("homes")}
                style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8, background:"#5bb8f5", border:"none", color:G, borderRadius:8, width:200, height:65, fontSize:20, fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}
              >
                Explore More ↗
              </button>
            </div>

            {/* Property carousel — 1.5 cards visible, split text/photo layout */}
            {(() => {
              // Fallback hardcoded data shown until DB has entries
              const fallbackProps = [
                { tag:"For Sale",    title:"The Mesquite",  sub:"3 Bed / 2 Bath / 2-Car Garage", address:"Lot 14, Desert Bloom Estates, Pahrump NV 89048", price:"$389,000", beds:3, baths:2, garage:null as number|null, sqft:"1,850", img:"https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80" },
                { tag:"For Sale",    title:"The Sunrise",   sub:"4 Bed / 3 Bath / 2-Car Garage", address:"Lot 22, Pahrump Valley Ranch, Pahrump NV 89048", price:"$459,000", beds:4, baths:3, garage:null as number|null, sqft:"2,240", img:"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80" },
                { tag:"Coming Soon", title:"The Ridgeline", sub:"3 Bed / 2 Bath / 2-Car Garage", address:"Lot 7, Silver Mesa, Pahrump NV 89060",             price:"$419,000", beds:3, baths:2, garage:null as number|null, sqft:"1,980", img:"https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80" },
              ];
              // Map DB rows to the same shape as fallback
              const dbProps = (dbFeaturedProps ?? []).map(p => ({
                tag: p.tag,
                title: p.address,
                sub: [p.beds ? `${p.beds} Bed` : null, p.baths ? `${p.baths} Bath` : null, p.lotSize ?? null].filter(Boolean).join(" / "),
                address: `${p.address}, ${p.city} ${p.state}`,
                price: p.price,
                beds: p.beds ?? null,
                baths: p.baths ?? null,
                garage: null as number|null,
                sqft: p.sqft ?? null,
                img: p.imageUrl ?? "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
              }));
              const featProps = featPropsLoading ? fallbackProps : (dbProps.length > 0 ? dbProps : fallbackProps);
              const cardW = 960; // px width of each card
              const gap = 24;
              const canAdvance = featCarouselIdx < featProps.length - 1;
              const canBack = featCarouselIdx > 0;
              return (
                <div style={{ position:"relative" }}>
                  {/* Scrollable track */}
                  <div style={{
                    display:"flex", gap:gap,
                    overflow:"hidden",
                    /* Show 1.5 cards: cardW + half of next card */
                    width:"100%",
                  }}>
                    <div style={{
                      display:"flex", gap:gap,
                      transform:`translateX(calc(-${featCarouselIdx} * (${cardW}px + ${gap}px)))`,
                      transition:"transform 0.45s cubic-bezier(0.4,0,0.2,1)",
                      willChange:"transform",
                    }}>
                      {featProps.map((p,i)=>(
                        <div key={i} style={{
                          flexShrink:0,
                          width:cardW,
                          background:"white", borderRadius:18, overflow:"hidden",
                          display:"flex", flexDirection:"row",
                          boxShadow:"0 12px 48px rgba(0,0,0,0.22)",
                          minHeight:530,
                        }}>
                          {/* Text panel */}
                          <div style={{ flex:"0 0 52%", padding:"36px 32px 36px", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
                            <div>
                              <h3 style={{ fontSize:26, fontWeight:900, color:TXT, letterSpacing:"-0.03em", lineHeight:1.15, margin:"0 0 6px" }}>{p.title}</h3>
                              <p style={{ fontSize:14, color:MUT, margin:"0 0 4px", fontWeight:500 }}>{p.sub}</p>
                              <p style={{ fontSize:12, color:"#bbb", margin:"0 0 20px", lineHeight:1.4 }}>{p.address}</p>
                              <div style={{ fontSize:34, fontWeight:900, color:TXT, letterSpacing:"-0.04em", margin:"0 0 24px" }}>{p.price}</div>
                            </div>
                            <div style={{ borderTop:`1px solid ${BOR}`, paddingTop:20, display:"flex", flexDirection:"column", gap:12 }}>
                              {([["Bedrooms",p.beds],["Bathrooms",p.baths],["Garage",p.garage],["Area",p.sqft ? `${p.sqft} sqft` : null]] as [string, string|number|null|undefined][]).filter(([,val])=>val!=null).map(([label,val])=>(
                                <div key={label as string} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                  <span style={{ fontSize:14, color:MUT }}>{label}</span>
                                  <span style={{ fontSize:14, fontWeight:700, color:TXT }}>{val}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* Photo panel */}
                          <div style={{ flex:"0 0 48%", position:"relative", overflow:"hidden" }}>
                            <img src={p.img} alt={p.title} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                            <div style={{ position:"absolute", top:16, right:16, background:p.tag==="Coming Soon" ? "#e07b39" : "#0f2044", color:"white", fontSize:11, fontWeight:700, padding:"6px 14px", borderRadius:6, letterSpacing:"0.04em", textTransform:"uppercase" }}>{p.tag}</div>
                            {/* Advance button — sits on the right edge of the photo */}
                            {i === featCarouselIdx && canAdvance && (
                              <button
                                onClick={()=>setFeatCarouselIdx(idx=>idx+1)}
                                style={{
                                  position:"absolute", bottom:24, right:24,
                                  width:56, height:56, borderRadius:"50%",
                                  background:"rgba(75,156,211,0.92)", backdropFilter:"blur(6px)",
                                  border:"none", cursor:"pointer",
                                  display:"flex", alignItems:"center", justifyContent:"center",
                                  boxShadow:"0 4px 20px rgba(0,0,0,0.25)",
                                  transition:"transform 0.2s, background 0.2s",
                                }}
                                onMouseEnter={e=>(e.currentTarget.style.transform="scale(1.08)")}
                                onMouseLeave={e=>(e.currentTarget.style.transform="scale(1)")}
                                aria-label="Next property"
                              >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                              </button>
                            )}
                            {/* Back button */}
                            {i === featCarouselIdx && canBack && (
                              <button
                                onClick={()=>setFeatCarouselIdx(idx=>idx-1)}
                                style={{
                                  position:"absolute", bottom:24, right:92,
                                  width:56, height:56, borderRadius:"50%",
                                  background:"rgba(255,255,255,0.25)", backdropFilter:"blur(6px)",
                                  border:"1.5px solid rgba(255,255,255,0.5)", cursor:"pointer",
                                  display:"flex", alignItems:"center", justifyContent:"center",
                                  boxShadow:"0 4px 20px rgba(0,0,0,0.15)",
                                  transition:"transform 0.2s",
                                }}
                                onMouseEnter={e=>(e.currentTarget.style.transform="scale(1.08)")}
                                onMouseLeave={e=>(e.currentTarget.style.transform="scale(1)")}
                                aria-label="Previous property"
                              >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Dot indicators */}
                  <div style={{ display:"flex", gap:8, justifyContent:"center", marginTop:24 }}>
                    {featProps.map((_,i)=>(
                      <button key={i} onClick={()=>setFeatCarouselIdx(i)} style={{ width:i===featCarouselIdx?24:8, height:8, borderRadius:4, background:i===featCarouselIdx?"#4B9CD3":"rgba(255,255,255,0.3)", border:"none", cursor:"pointer", padding:0, transition:"all 0.3s" }} aria-label={`Go to property ${i+1}`} />
                    ))}
                  </div>
                </div>
              );
            })()}
            </div>
          </div>
          </div>{/* end overlap wrapper */}


          {/* PHOTO-CLIP "HOMES BY APOLLO" + ABOUT US — moved ABOVE featured homes */}
          <div style={{ width:"100%", background:"white", padding:0, margin:0 }}>
            <div className="photo-clip-container">
              <svg className="photo-clip-svg" viewBox="0 0 1690 205" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="heroImg1" patternUnits="userSpaceOnUse" width="1690" height="205">
                    <image href="https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/hero-nevada-home-jLv3PVjtmSM8wPtXaTU7Jy.webp" x="0" y="-300" width="1690" height="875" preserveAspectRatio="xMidYMid slice"/>
                  </pattern>
                  <mask id="textMask1">
                    <text x="845" y="182" textAnchor="middle" dominantBaseline="auto"
                      fontFamily="inherit" fontWeight="900" letterSpacing="0"
                      fill="white" fontSize="205">Homes by Apollo</text>
                  </mask>
                </defs>
                <rect x="0" y="0" width="1690" height="205" fill="url(#heroImg1)" mask="url(#textMask1)"/>
              </svg>
            </div>
          </div>
          <div className="section-pad" style={{ background:"white", padding:"56px var(--pad) 72px" }}>
            <div className="site-container">
              <div className="why-apollo-grid" style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:64, alignItems:"start" }}>
                <div>
                  <SectionLabel>About us</SectionLabel>
                  <h2 style={{ fontSize:"clamp(36px,4vw,52px)", fontWeight:800, letterSpacing:"-0.03em", lineHeight:1.1, marginBottom:16 }}>We provide the best Services</h2>
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
                      <div style={{ fontSize:16, fontWeight:700, color:TXT, marginBottom:10 }}>{title}</div>
                      <div style={{ fontSize:14.5, color:MUT, lineHeight:1.75 }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* FEATURED HOMES */}
          <div style={{ padding:"64px var(--pad) 0" }}>
            <div className="site-container">
            <div className="section-header-row" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}>
              <div>
                <SectionLabel>Featured Properties</SectionLabel>
                <h2 style={{ fontSize:"clamp(36px,4vw,52px)", fontWeight:800, letterSpacing:"-0.03em" }}>Homes for Sale</h2>
              </div>
              <button onClick={()=>nav("homes")} style={{ fontSize:15, fontWeight:700, color:G, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>View All →</button>
            </div>
            <div className="cards-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
              {homes.map(h=>(
                <div key={h.id} onClick={()=>{ setSelectedHome(h); nav("home-detail"); }}>
                  <HomeCard h={h}/>
                </div>
              ))}
            </div>
            </div>
          </div>

          {/* HOW IT WORKS */}
          <div style={{ background:"white", padding:"72px var(--pad)", marginTop:64 }}>
            <div className="site-container">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:48 }}>
                <div>
                  <SectionLabel>Our approach</SectionLabel>
                  <h2 style={{ fontSize:"clamp(36px,4vw,52px)", fontWeight:800, letterSpacing:"-0.03em" }}>How it works</h2>
                </div>
                <Btn carolina onClick={()=>nav("homes")}>Our Properties</Btn>
              </div>
              <div className="how-it-works-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:28 }}>
                {[
                  { n:"01", title:"Browse Lots & Plans", desc:"Use our advanced search to find the perfect lot or floor plan in Pahrump. Filter by size, price, and location.", img:"https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80" },
                  { n:"02", title:"Schedule a Consultation", desc:"Sit down with Brandon and the Apollo team. We'll walk through your vision, timeline, and all-inclusive pricing.", img:"https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/consultation-step_ca878c80.jpg" },
                  { n:"03", title:"Sign & Start Building", desc:"One contract, one price. We break ground and keep you updated every step — from foundation to keys.", img:"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80" },
                ].map(step=>(
                  <div key={step.n} style={{ background:"white", borderRadius:16, overflow:"hidden", boxShadow:"0 2px 20px rgba(0,0,0,0.06)", width:515 }}>
                    <div style={{ height:480, overflow:"hidden", position:"relative" }}>
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
          <div style={{ padding:"72px var(--pad) 64px" }}>
            <div className="site-container">
            <div className="section-header-row" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}>
              <div>
                <SectionLabel>Land</SectionLabel>
                <h2 style={{ fontSize:"clamp(36px,4vw,52px)", fontWeight:800, letterSpacing:"-0.03em" }}>Available Lots</h2>
              </div>
              <button onClick={()=>nav("lots")} style={{ fontSize:15, fontWeight:700, color:G, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>View All →</button>
            </div>
            <div className="cards-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
              {lots.map(l=>(
                <div key={l.id} onClick={()=>{ setSelectedLot(l); nav("lot-detail"); }}>
                  <LotCard l={l}/>
                </div>
              ))}
            </div>
            </div>
          </div>

          {/* TESTIMONIALS */}
          <div style={{ background:"white", padding:"72px var(--pad)" }}>
            <div className="site-container">
            <div>
              <div style={{ textAlign:"center", marginBottom:40 }}>
                <SectionLabel>Client Stories</SectionLabel>
                <h2 style={{ fontSize:"clamp(36px,4vw,52px)", fontWeight:800, letterSpacing:"-0.03em" }}>What our clients say</h2>
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
          </div>

          {/* BLOG PREVIEW */}
          <div style={{ padding:"107px var(--pad) 35px" }}>
            <div className="site-container">
            {/* "Homes by Apollo" photo-clip header — Blog section */}
            <div className="photo-clip-container" style={{ padding:0, margin:0, marginTop:"-40px", marginBottom:"60px", background:"transparent" }}>
              <svg className="photo-clip-svg" viewBox="0 0 1690 205" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="heroImg2" patternUnits="userSpaceOnUse" width="1690" height="205">
                    {/* background-position: center ~65% → horizon/foothills visible */}
                    <image href="https://d2xsxph8kpxj0f.cloudfront.net/310419663032182609/mwVy9Am3ywXkRkqF68TJjK/hero-nevada-home-jLv3PVjtmSM8wPtXaTU7Jy.webp" x="0" y="-300" width="1690" height="875" preserveAspectRatio="xMidYMid slice"/>
                  </pattern>
                  <mask id="textMask2">
                    <text x="845" y="182" textAnchor="middle" dominantBaseline="auto"
                      fontFamily="inherit" fontWeight="900" letterSpacing="0"
                      fill="white" fontSize="205">Homes by Apollo</text>
                  </mask>
                </defs>
                <rect x="0" y="0" width="1690" height="205" fill="url(#heroImg2)" mask="url(#textMask2)"/>
              </svg>
            </div>
            <div className="section-header-row" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:36 }}>
              <div>
                <SectionLabel>Latest Blog</SectionLabel>
                <h2 style={{ fontSize:"clamp(36px,4vw,52px)", fontWeight:800, letterSpacing:"-0.03em", marginBottom:8 }}>Stay updated with our latest articles</h2>
              </div>
              <button onClick={()=>nav("blog")} style={{ fontSize:15, fontWeight:700, color:G, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>View All →</button>
            </div>
            <div className="blog-cards-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,515px)", gap:28, justifyContent:"start" }}>
              {blogs.map(b=>(
                <div key={b.title} style={{ background:"white", borderRadius:14, overflow:"hidden", cursor:"pointer", border:`1px solid ${BOR}` }}>
                  {/* Fixed 515×336 image container */}
                  <div className="blog-card-img" style={{ overflow:"hidden", flexShrink:0 }}>
                    <img src={b.img} alt={b.title} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                  </div>
                  <div style={{ padding:"18px 20px 22px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                      <span style={{ fontSize:10, fontWeight:700, color:G, background:GL, padding:"3px 9px", borderRadius:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>{b.cat}</span>
                      <span style={{ fontSize:11, color:MUT }}>{b.date} · {b.read} read</span>
                    </div>
                    <div style={{ fontSize:15, fontWeight:700, color:TXT, lineHeight:1.45 }}>{b.title}</div>
                  </div>
                </div>
              ))}
            </div>
            </div>
          </div>

          {/* FAQ */}
          <div style={{ background:"white", padding:"80px var(--pad) 80px" }}>
            <div className="site-container">
            <SectionLabel>FAQ</SectionLabel>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:24, marginBottom:40, flexWrap:"wrap" }}>
              <h2 style={{ fontSize:"clamp(36px,4vw,52px)", fontWeight:800, letterSpacing:"-0.03em", lineHeight:1.1, margin:0, maxWidth:520 }}>Feel free to ask any questions</h2>
              <button onClick={()=>setPage("faq")} style={{ marginTop:8, width:200, height:65, background:"#5bb8f5", color:G, border:"none", borderRadius:8, fontSize:20, fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap", display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6 }}>View All FAQs ↗</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {faqs.map(([q,a])=><FAQ key={q} q={q} a={a}/>)}
            </div>
            </div>
          </div>

          {/* FOOTER — dark green luxury */}
          <footer style={{ background:"#0f2044", overflow:"hidden", position:"relative", fontFamily:"inherit" }}>

            {/* ── Top band: Brand + Contact info (reference layout) ──────────── */}
            <div style={{ padding:"52px var(--pad) 48px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ maxWidth:1650, margin:"0 auto" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:64, alignItems:"flex-start" }}>

                {/* LEFT: Logo + tagline + email form */}
                <div>
                  {/* Logo lockup */}
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
                  {/* Tagline */}
                  <p style={{ fontSize:19.5, color:"white", lineHeight:1.65, maxWidth:400, marginBottom:28 }}>
                    Pahrump's premier custom home builder. All-inclusive builds, one price, no surprises.
                  </p>
                  {/* Email form */}
                  {submitted ? (
                    <div style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,0.07)", borderRadius:8, padding:"14px 20px", maxWidth:420 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6ee7a0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      <span style={{ color:"rgba(255,255,255,0.75)", fontSize:14, fontWeight:600 }}>You're on the list.</span>
                    </div>
                  ) : (
                    <>
                      <div style={{ display:"flex", gap:0, maxWidth:420 }}>
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
                </div>

                {/* RIGHT: Call Us Free + phone + address */}
                <div style={{ paddingTop:4 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"rgba(255,255,255,0.4)", marginBottom:10, letterSpacing:"0.02em" }}>Call Us Free</div>
                  <a href="tel:9107771" style={{ display:"block", fontSize:"clamp(28px,3.5vw,42px)", fontWeight:800, color:"rgba(255,255,255,0.85)", textDecoration:"none", letterSpacing:"-0.02em", lineHeight:1.1, marginBottom:24 }}>910-777-1</a>
                  <div style={{ fontSize:15, color:"rgba(255,255,255,0.45)", lineHeight:1.7 }}>
                    4081 Jessica St<br/>
                    Pahrump, NV 89048
                  </div>
                </div>
              </div>
              </div>
            </div>

            {/* ── Middle band: Nav columns ─────────────────────────────── */}
            <div style={{ padding:"52px var(--pad) 40px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ maxWidth:1650, margin:"0 auto" }}>
              <div className="footer-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:32 }}>
                {([
                  ["Company",  [["Home","home"],["About Us","about"],["Contact","contact"]]],
                  ["Properties",[["Homes","homes"],["Lots","lots"]]],
                  ["Resources", [["Blog","blog"],["FAQ","home"]]],
                ] as [string, [string, string][]][]).map(([heading, links])=>(
                  <div key={heading}>
                    <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.28)", textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:18 }}>{heading}</p>
                    {links.map(([label, pg])=>(
                      <div key={label} onClick={()=>nav(pg)}
                        style={{ fontSize:17, color:"rgba(255,255,255,0.55)", marginBottom:16, cursor:"pointer", transition:"color 0.15s", fontWeight:500 }}
                        onMouseEnter={e=>{e.currentTarget.style.color="rgba(255,255,255,0.95)"}}
                        onMouseLeave={e=>{e.currentTarget.style.color="rgba(255,255,255,0.55)"}}>
                        {label}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              </div>
            </div>

            {/* ── Bottom bar ───────────────────────────────────────────── */}
            <div style={{ padding:"22px var(--pad)" }}>
              <div style={{ maxWidth:1650, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
              <p style={{ fontSize:13, color:"rgba(255,255,255,0.22)" }}>© 2026 Homes by Apollo. All rights reserved.</p>
              <div style={{ display:"flex", gap:20 }}>
                {["Privacy Policy","Terms"].map(i=>(
                  <span key={i} style={{ fontSize:13, color:"rgba(255,255,255,0.22)", cursor:"pointer", transition:"color 0.15s" }}
                    onMouseEnter={e=>{e.currentTarget.style.color="rgba(255,255,255,0.6)"}}
                    onMouseLeave={e=>{e.currentTarget.style.color="rgba(255,255,255,0.22)"}}>{i}</span>
                ))}
              </div>
              </div>
            </div>

            {/* MONOCHROMATIC WATERMARK — SVG for true full-width fill, no letter-spacing */}
            <div style={{ overflow:"hidden", pointerEvents:"none", userSelect:"none", width:"100%", maxWidth:1690, margin:"0 auto", padding:0, boxSizing:"border-box" }}>
              <svg viewBox="0 0 1690 200" preserveAspectRatio="xMidYMid meet" style={{ display:"block", width:"100%", height:"auto" }} xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="footerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="white" stopOpacity="0.13"/>
                    <stop offset="100%" stopColor="white" stopOpacity="0.04"/>
                  </linearGradient>
                  <mask id="footerTextMask">
                    <text x="845" y="175" textAnchor="middle" dominantBaseline="auto"
                      fontFamily="inherit" fontWeight="900" letterSpacing="0"
                      fill="white" fontSize="200">Homes by Apollo</text>
                  </mask>
                </defs>
                <rect x="0" y="0" width="1690" height="200" fill="url(#footerGrad)" mask="url(#footerTextMask)"/>
              </svg>
            </div>
          </footer>
        </>}

        {/* ══ HOMES FOR SALE ══════════════════════════════════════════════════ */}
        {page==="homes" && (
          <div className="section-pad" style={{ padding:"40px var(--pad)" }}>
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
          <div className="section-pad" style={{ padding:"40px var(--pad)" }}>
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
            <div style={{ padding:"28px 5vw 0" }}>
              <button onClick={()=>nav("homes")}
                style={{ display:"inline-flex", alignItems:"center", gap:8, background:"none", border:`1px solid ${BOR}`, borderRadius:8, padding:"8px 16px", fontSize:12, fontWeight:700, color:MUT, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=G; e.currentTarget.style.color=G;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=BOR; e.currentTarget.style.color=MUT;}}>
                ← Back to Homes
              </button>
            </div>

            {/* Opulent O-style: big address headline + price top-right */}
            <div style={{ padding:"32px 5vw 0" }}>
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
            <div style={{ padding:"24px 5vw 0" }}>
              <div style={{ borderRadius:20, overflow:"hidden", height:"clamp(320px,45vw,560px)", position:"relative" }}>
                <img src={selectedHome.img} alt={selectedHome.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              </div>
            </div>

            {/* Two-column: overview + sticky contact panel */}
            <div style={{ padding:"48px var(--pad) 64px", display:"grid", gridTemplateColumns:"1fr 340px", gap:48, alignItems:"start" }}>
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
            <div style={{ padding:"28px 5vw 0" }}>
              <button onClick={()=>nav("lots")}
                style={{ display:"inline-flex", alignItems:"center", gap:8, background:"none", border:`1px solid ${BOR}`, borderRadius:8, padding:"8px 16px", fontSize:12, fontWeight:700, color:MUT, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=G; e.currentTarget.style.color=G;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=BOR; e.currentTarget.style.color=MUT;}}>
                ← Back to Lots
              </button>
            </div>

            {/* Big address headline */}
            <div style={{ padding:"32px 5vw 0" }}>
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
            <div style={{ padding:"24px 5vw 0" }}>
              <div style={{ borderRadius:20, overflow:"hidden", height:"clamp(280px,40vw,480px)", position:"relative" }}>
                <img src={selectedLot.img} alt={selectedLot.addr} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(8,12,28,0.3) 0%, transparent 60%)" }} />
              </div>
            </div>

            {/* Two-column: overview + sticky contact panel */}
            <div style={{ padding:"48px var(--pad) 64px", display:"grid", gridTemplateColumns:"1fr 340px", gap:48, alignItems:"start" }}>
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

        {/* ══ FAQ PAGE ═══════════════════════════════════════════════════════ */}
        {page==="faq" && (
          <div className="section-pad" style={{ padding:"60px var(--pad) 80px" }}>
            <div style={{ marginBottom:8 }}>
              <button onClick={()=>nav("home")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, fontWeight:700, color:MUT, fontFamily:"inherit", display:"flex", alignItems:"center", gap:6, padding:0, marginBottom:28 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                Back to Home
              </button>
              <SectionLabel>FAQ</SectionLabel>
              <h1 style={{ fontSize:"clamp(32px,4vw,52px)", fontWeight:800, letterSpacing:"-0.03em", lineHeight:1.1, marginBottom:12, maxWidth:640 }}>Everything you need to know about building with Apollo</h1>
              <p style={{ fontSize:16, color:MUT, lineHeight:1.75, maxWidth:560, marginBottom:52 }}>Can't find your answer here? Call us at (702) 588-9889 or schedule a free consultation — we're happy to walk you through anything.</p>
            </div>
            {allFaqs.map(({ category, items }) => (
              <div key={category} style={{ marginBottom:52 }}>
                <div style={{ fontSize:11, fontWeight:700, color:MUT, textTransform:"uppercase", letterSpacing:"0.14em", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:32, height:1.5, background:ACC, borderRadius:2 }} />
                  {category}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {items.map(([q,a]) => <FAQ key={q} q={q} a={a} />)}
                </div>
              </div>
            ))}
            <div style={{ marginTop:48, background:G, borderRadius:16, padding:"36px 40px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:20 }}>
              <div>
                <div style={{ fontSize:20, fontWeight:800, color:"white", marginBottom:6 }}>Still have questions?</div>
                <div style={{ fontSize:14, color:"rgba(255,255,255,0.65)", lineHeight:1.6 }}>Schedule a free, no-pressure consultation with Brandon and the Apollo team.</div>
              </div>
              <button onClick={()=>nav("contact")} style={{ background:ACC, color:G, border:"none", borderRadius:8, padding:"14px 28px", fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>Schedule a Consultation ↗</button>
            </div>
          </div>
        )}

        {/* ══ BLOG ════════════════════════════════════════════════════════════ */}
        {page==="blog" && (
          <div className="section-pad" style={{ padding:"40px var(--pad)" }}>
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
          <div className="section-pad" style={{ padding:"40px var(--pad)" }}>
            <SectionLabel>Get in Touch</SectionLabel>
            <div className="contact-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:36 }}>
              <div>
                <h1 style={{ fontSize:32, fontWeight:800, letterSpacing:"-0.02em", lineHeight:1.1, marginBottom:16 }}>Schedule a<br/>Free Consultation</h1>
                <p style={{ fontSize:14, color:MUT, lineHeight:1.85, marginBottom:28 }}>Ready to build? Have questions? Brandon and the Apollo team are here to help. No pressure — just a real conversation about your vision.</p>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {([
                    [<svg key="pin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,"Office","5158 Arville St, Las Vegas, NV 89118"],
                    [<svg key="phone" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,"Phone","(702) 588-9889"],
                    [<svg key="mail" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,"Email","brandon@apollohomebuilders.com"],
                    [<svg key="lic" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,"License","NV No. 0077907"],
                  ] as [React.ReactNode,string,string][]).map(([icon,label,val])=>(
                    <div key={label} style={{ display:"flex", alignItems:"flex-start", gap:12, background:"white", padding:"13px 16px", borderRadius:10, border:`1px solid ${BOR}` }}>
                      <span style={{ color:G, flexShrink:0, marginTop:1 }}>{icon}</span>
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
                    <div style={{ marginBottom:16, display:"flex", justifyContent:"center" }}>
                      <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="26" cy="26" r="26" fill="#dcfce7"/>
                        <path d="M16 26.5l7 7 13-14" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3 style={{ fontSize:20, fontWeight:800, marginBottom:10 }}>Message Sent!</h3>
                    <p style={{ color:MUT, fontSize:13, lineHeight:1.7 }}>Brandon will reach out within 1 business day.</p>
                  </div>
                ) : (
                  <>
                    <h3 style={{ fontSize:17, fontWeight:800, marginBottom:20 }}>Send us a message</h3>
                    <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
                      {/* Contact type radio */}
                      <div>
                        <label style={{ fontSize:11, fontWeight:700, color:MUT, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:8 }}>I am a</label>
                        <div style={{ display:"flex", gap:10 }}>
                          {([["BUYER","Homebuyer"],["AGENT","Real Estate Agent"]] as [string,string][]).map(([val,lbl])=>(
                            <button key={val} type="button" onClick={()=>setForm({...form,contactType:val as "BUYER"|"AGENT"})}
                              style={{ flex:1, padding:"9px 0", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", border:`1.5px solid ${form.contactType===val?G:BOR}`, background:form.contactType===val?GL:"white", color:form.contactType===val?G:MUT, transition:"all 0.15s", fontFamily:"inherit" }}>
                              {lbl}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Name, Email, Phone */}
                      {([["Name","text","name","Your full name"],["Email","email","email","your@email.com"],["Phone","tel","phone","(702) 555-0000"]] as [string,string,string,string][]).map(([label,type,key,ph])=>(
                        <div key={key}>
                          <label style={{ fontSize:11, fontWeight:700, color:MUT, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:4 }}>{label}</label>
                          <input type={type} placeholder={ph} value={form[key as keyof FormState] as string} onChange={e=>setForm({...form,[key]:e.target.value})}
                            style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1px solid ${BOR}`, fontSize:13, outline:"none", color:TXT }}
                            onFocus={e=>{e.currentTarget.style.borderColor=G}} onBlur={e=>{e.currentTarget.style.borderColor=BOR}}/>
                        </div>
                      ))}
                      {/* Buyer-specific fields */}
                      {form.contactType === "BUYER" && (<>
                        <div>
                          <label style={{ fontSize:11, fontWeight:700, color:MUT, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:4 }}>Purchase Timeline</label>
                          <select value={form.timeline} onChange={e=>setForm({...form,timeline:e.target.value})}
                            style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1px solid ${BOR}`, fontSize:13, outline:"none", color:form.timeline?TXT:"#9ca3af", background:"white" }}>
                            <option value="">Select timeline…</option>
                            <option value="ASAP">ASAP</option>
                            <option value="1_3_MONTHS">1–3 months</option>
                            <option value="3_6_MONTHS">3–6 months</option>
                            <option value="6_12_MONTHS">6–12 months</option>
                            <option value="JUST_BROWSING">Just browsing</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize:11, fontWeight:700, color:MUT, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:4 }}>Price Range <span style={{ fontWeight:400, textTransform:"none" }}>(optional)</span></label>
                          <select value={form.priceRange} onChange={e=>setForm({...form,priceRange:e.target.value})}
                            style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1px solid ${BOR}`, fontSize:13, outline:"none", color:form.priceRange?TXT:"#9ca3af", background:"white" }}>
                            <option value="">Select range…</option>
                            <option value="under_450">Under $450K</option>
                            <option value="450_500">$450K–$500K</option>
                            <option value="500_550">$500K–$550K</option>
                            <option value="550_600">$550K–$600K</option>
                            <option value="over_600">$600K+</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize:11, fontWeight:700, color:MUT, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:4 }}>Financing <span style={{ fontWeight:400, textTransform:"none" }}>(optional)</span></label>
                          <select value={form.financingStatus} onChange={e=>setForm({...form,financingStatus:e.target.value})}
                            style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1px solid ${BOR}`, fontSize:13, outline:"none", color:form.financingStatus?TXT:"#9ca3af", background:"white" }}>
                            <option value="">Select status…</option>
                            <option value="PRE_APPROVED">Pre-approved</option>
                            <option value="IN_PROCESS">In process</option>
                            <option value="NOT_STARTED">Not started yet</option>
                            <option value="CASH_BUYER">Cash buyer</option>
                          </select>
                        </div>
                      </>)}
                      {/* Agent-specific fields */}
                      {form.contactType === "AGENT" && (
                        <div>
                          <label style={{ fontSize:11, fontWeight:700, color:MUT, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:4 }}>Brokerage Name <span style={{ fontWeight:400, textTransform:"none" }}>(optional)</span></label>
                          <input type="text" placeholder="Your brokerage" value={form.brokerageName} onChange={e=>setForm({...form,brokerageName:e.target.value})}
                            style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1px solid ${BOR}`, fontSize:13, outline:"none", color:TXT }}
                            onFocus={e=>{e.currentTarget.style.borderColor=G}} onBlur={e=>{e.currentTarget.style.borderColor=BOR}}/>
                        </div>
                      )}
                      <div>
                        <label style={{ fontSize:11, fontWeight:700, color:MUT, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:4 }}>Message <span style={{ fontWeight:400, textTransform:"none" }}>(optional)</span></label>
                        <textarea placeholder="Tell us about your project..." rows={3} value={form.message} onChange={e=>setForm({...form,message:e.target.value})}
                          style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1px solid ${BOR}`, fontSize:13, outline:"none", color:TXT, resize:"vertical" }}
                          onFocus={e=>{e.currentTarget.style.borderColor=G}} onBlur={e=>{e.currentTarget.style.borderColor=BOR}}/>
                      </div>
                      {formError && (
                        <div style={{ background:"#fff0f0", border:"1px solid #fca5a5", borderRadius:8, padding:"10px 14px", fontSize:12, color:"#dc2626" }}>
                          {formError}
                        </div>
                      )}
                      <button
                        onClick={()=>{
                          if (!form.name || !form.email || !form.phone) return;
                          const parts = form.name.trim().split(" ");
                          const firstName = parts[0] || form.name;
                          const lastName = parts.slice(1).join(" ") || "-";
                          const priceMap: Record<string,[number,number]> = { under_450:[0,450000], "450_500":[450000,500000], "500_550":[500000,550000], "550_600":[550000,600000], over_600:[600000,999999] };
                          const [prMin,prMax] = form.priceRange ? (priceMap[form.priceRange] ?? [undefined,undefined]) : [undefined,undefined];
                          contactMutation.mutate({
                            contactType: form.contactType,
                            firstName,
                            lastName,
                            email: form.email,
                            phone: form.phone,
                            timeline: form.timeline ? form.timeline as "ASAP"|"1_3_MONTHS"|"3_6_MONTHS"|"6_12_MONTHS"|"JUST_BROWSING" : undefined,
                            priceRangeMin: prMin,
                            priceRangeMax: prMax,
                            financingStatus: form.financingStatus ? form.financingStatus as "PRE_APPROVED"|"IN_PROCESS"|"NOT_STARTED"|"CASH_BUYER" : undefined,
                            brokerageName: form.brokerageName || undefined,
                            message: form.message || undefined,
                          });
                        }}
                        disabled={contactMutation.isPending}
                        style={{ background:contactMutation.isPending?"#6b7a99":G, color:"white", border:"none", padding:"13px", borderRadius:8, fontSize:13, fontWeight:700, cursor:contactMutation.isPending?"not-allowed":"pointer", fontFamily:"inherit", transition:"background 0.2s" }}>
                        {contactMutation.isPending ? "Sending…" : "Send Message ↗"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── STICKY MOBILE CTA BAR ─────────────────────────────────────────── */}
      <div className="mobile-sticky-cta" style={{
        display: "none",
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 300,
        background: "white",
        borderTop: `1px solid ${BOR}`,
        padding: "12px 16px",
        gap: 10,
        boxShadow: "0 -4px 24px rgba(0,0,0,0.10)",
        alignItems: "center",
        justifyContent: "stretch",
      }}>
        {isAdmin && (
          <a
            href="/crm"
            style={{ flexShrink:0, background:"white", color:"#e07b39", border:"2px solid #e07b39", borderRadius:10, padding:"14px 12px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", textDecoration:"none", letterSpacing:"0.01em", whiteSpace:"nowrap" }}
          >
            Admin
          </a>
        )}
        <button
          onClick={()=>nav("contact")}
          style={{ flex:1, background:G, color:"white", border:"none", borderRadius:10, padding:"14px 16px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", letterSpacing:"0.01em" }}>
          Schedule a Free Consultation
        </button>
        <button
          onClick={()=>nav("homes")}
          style={{ flexShrink:0, background:"white", color:G, border:`1.5px solid ${G}`, borderRadius:10, padding:"14px 16px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          View Homes
        </button>
      </div>
    </div>
  );
}
