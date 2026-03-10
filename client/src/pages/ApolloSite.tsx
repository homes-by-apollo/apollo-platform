import { useState, useEffect, useRef } from "react";

const G = "#0D2818";
const GM = "#1a4a2e";
const GL = "#e8f0eb";
const BG = "#f8f9f7";
const TXT = "#0d1b12";
const MUT = "#6b7c72";
const BOR = "#e4ebe6";

const homes = [
  { id:1, tag:"For Sale", price:"$389,900", title:"3-Bed Ranch Home", addr:"480 E Arapahoe St", city:"Pahrump, NV 89048", sqft:"1,800", bed:3, bath:2.5, img:"https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=80" },
  { id:2, tag:"For Sale", price:"$749,900", title:"12-Bed Investment Property", addr:"461 Comstock Ave", city:"Pahrump, NV 89048", sqft:"4,400", bed:12, bath:8, img:"https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=80" },
  { id:3, tag:"For Sale", price:"$409,900", title:"All-Inclusive Dream Home", addr:"4081 Jessica St", city:"Pahrump, NV 89048", sqft:"1,800", bed:3, bath:2.5, img:"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80" },
];

const lots = [
  { id:1, tag:"Available", size:"0.25 Acres", price:"$45,000", addr:"Lot 14 – Basin Ave", city:"Pahrump, NV", utilities:"Water · Electric · Sewer", img:"https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80" },
  { id:2, tag:"Available", size:"0.50 Acres", price:"$72,000", addr:"Lot 22 – Desert Rose Dr", city:"Pahrump, NV", utilities:"Water · Electric", img:"https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80" },
  { id:3, tag:"Reserved", size:"1.0 Acre", price:"$115,000", addr:"Lot 7 – Mesquite Ln", city:"Pahrump, NV", utilities:"Water · Electric · Sewer · Gas", img:"https://images.unsplash.com/photo-1416169607655-0c2b3ce2e1cc?w=600&q=80" },
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

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
    <div style={{ width:32, height:1.5, background:G, borderRadius:2 }} />
    <span style={{ fontSize:11, fontWeight:700, color:G, textTransform:"uppercase", letterSpacing:"0.12em" }}>{children}</span>
  </div>
);

interface BtnProps {
  children: React.ReactNode;
  white?: boolean;
  outline?: boolean;
  small?: boolean;
  onClick?: () => void;
}

const Btn = ({ children, white, outline, small, onClick }: BtnProps) => {
  const [hov, setHov] = useState(false);
  const base: React.CSSProperties = { display:"inline-flex", alignItems:"center", gap:5, borderRadius:8, fontWeight:700, cursor:"pointer", transition:"all 0.18s", border:"none", fontSize:small?12:13, padding:small?"8px 16px":"12px 22px", fontFamily:"inherit" };
  let style: React.CSSProperties;
  if (white) style = { ...base, background: hov?"#f0f0f0":"white", color:G };
  else if (outline) style = { ...base, background: hov?BG:"transparent", color:G, border:`1.5px solid ${BOR}` };
  else style = { ...base, background: hov?GM:G, color:"white" };
  return <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={style}>{children} ↗</button>;
};

function HomeCard({ h }: { h: typeof homes[0] }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:"white", borderRadius:14, overflow:"hidden", cursor:"pointer",
        boxShadow:hov?"0 16px 48px rgba(0,0,0,0.14)":"0 2px 16px rgba(0,0,0,0.06)",
        transform:hov?"translateY(-5px)":"translateY(0)", transition:"all 0.28s ease" }}>
      <div style={{ position:"relative", height:200, overflow:"hidden" }}>
        <img src={h.img} alt={h.title} style={{ width:"100%", height:"100%", objectFit:"cover", transform:hov?"scale(1.05)":"scale(1)", transition:"transform 0.5s ease" }} />
        <span style={{ position:"absolute", top:12, left:12, background:"white", color:TXT, fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:6, boxShadow:"0 2px 8px rgba(0,0,0,0.12)" }}>{h.tag}</span>
      </div>
      <div style={{ padding:"18px 20px 22px" }}>
        <div style={{ fontSize:20, fontWeight:800, color:TXT, letterSpacing:"-0.02em", marginBottom:3 }}>{h.price}</div>
        <div style={{ fontSize:14, fontWeight:600, color:TXT, marginBottom:3 }}>{h.title}</div>
        <div style={{ fontSize:12, color:MUT, marginBottom:14 }}>📍 {h.addr}, {h.city}</div>
        <div style={{ display:"flex", gap:14, fontSize:12, color:MUT, borderTop:`1px solid ${BOR}`, paddingTop:12 }}>
          <span>⬜ {h.sqft} sqft</span><span>🛏 {h.bed}</span><span>🚿 {h.bath}</span>
        </div>
      </div>
    </div>
  );
}

function LotCard({ l }: { l: typeof lots[0] }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:"white", borderRadius:14, overflow:"hidden", cursor:"pointer",
        boxShadow:hov?"0 16px 48px rgba(0,0,0,0.14)":"0 2px 16px rgba(0,0,0,0.06)",
        transform:hov?"translateY(-5px)":"translateY(0)", transition:"all 0.28s ease" }}>
      <div style={{ position:"relative", height:170, overflow:"hidden" }}>
        <img src={l.img} alt={l.addr} style={{ width:"100%", height:"100%", objectFit:"cover", transform:hov?"scale(1.05)":"scale(1)", transition:"transform 0.5s ease" }} />
        <span style={{ position:"absolute", top:12, left:12, background:l.tag==="Available"?G:"#888", color:"white", fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:6 }}>{l.tag}</span>
        <span style={{ position:"absolute", top:12, right:12, background:"white", color:TXT, fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:6 }}>{l.size}</span>
      </div>
      <div style={{ padding:"16px 20px 20px" }}>
        <div style={{ fontSize:18, fontWeight:800, color:TXT, letterSpacing:"-0.02em", marginBottom:3 }}>{l.price}</div>
        <div style={{ fontSize:13, fontWeight:600, color:TXT, marginBottom:3 }}>{l.addr}</div>
        <div style={{ fontSize:12, color:MUT, marginBottom:12 }}>📍 {l.city}</div>
        <div style={{ fontSize:11, color:G, background:GL, padding:"7px 11px", borderRadius:6, fontWeight:600 }}>🔌 {l.utilities}</div>
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
    <button onClick={onClick} style={{ padding:"7px 16px", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", border:`1px solid ${active?G:BOR}`, background:active?G:"white", color:active?"white":MUT, transition:"all 0.15s", fontFamily:"inherit" }}>{children}</button>
  );
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  interest: string;
  message: string;
}

export default function ApolloSite() {
  const [page, setPage] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FormState>({ name:"", email:"", phone:"", interest:"buy", message:"" });
  const [formSent, setFormSent] = useState(false);
  const [homeFilter, setHomeFilter] = useState("All");
  const [lotFilter, setLotFilter] = useState("All");
  const [blogFilter, setBlogFilter] = useState("All");
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = topRef.current;
    if (!el) return;
    const h = () => setScrolled(el.scrollTop > 40);
    el.addEventListener("scroll", h);
    return () => el.removeEventListener("scroll", h);
  }, []);

  const nav = (p: string) => { setPage(p); setTimeout(()=>topRef.current?.scrollTo({top:0,behavior:"smooth"}),0); };

  // suppress unused variable warnings
  void homeFilter; void lotFilter; void blogFilter;

  return (
    <div style={{ fontFamily:"'Manrope',system-ui,sans-serif", background:BG, color:TXT, height:"100vh", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap'); *{box-sizing:border-box;margin:0;padding:0} ::selection{background:${G};color:white} input,textarea,select,button{font-family:inherit}`}</style>

      {/* NAV */}
      <nav style={{ background:scrolled?"rgba(255,255,255,0.97)":"white", borderBottom:`1px solid ${BOR}`, padding:"0 32px", height:60, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, zIndex:100, boxShadow:scrolled?"0 2px 20px rgba(0,0,0,0.07)":"none", transition:"all 0.2s" }}>
        <div style={{ display:"flex", alignItems:"center", gap:9, cursor:"pointer" }} onClick={()=>nav("home")}>
          <div style={{ width:32, height:32, background:G, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ color:"white", fontWeight:800, fontSize:16 }}>A</span>
          </div>
          <span style={{ fontWeight:800, fontSize:14, letterSpacing:"-0.01em" }}>Homes by Apollo</span>
        </div>
        <div style={{ display:"flex", gap:24, alignItems:"center" }}>
          {[["home","Home"],["lots","Available Lots"],["homes","Homes for Sale"],["blog","Blog"]].map(([p,l])=>(
            <button key={p} onClick={()=>nav(p)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:13, fontWeight:500, color:page===p?G:MUT, borderBottom:`2px solid ${page===p?G:"transparent"}`, paddingBottom:2, transition:"all 0.15s", fontFamily:"inherit" }}>{l}</button>
          ))}
        </div>
        <Btn small onClick={()=>nav("contact")}>Schedule a Meeting</Btn>
      </nav>

      {/* SCROLLABLE CONTENT */}
      <div ref={topRef} style={{ flex:1, overflowY:"auto" }}>

        {/* ── HOME PAGE ── */}
        {page==="home" && <>

          {/* HERO */}
          <div style={{ background:G, padding:"80px 32px 90px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:-60, right:-60, width:400, height:400, borderRadius:"50%", background:"rgba(255,255,255,0.03)" }} />
            <div style={{ position:"absolute", bottom:-80, left:-40, width:300, height:300, borderRadius:"50%", background:"rgba(255,255,255,0.02)" }} />
            <div style={{ maxWidth:780, margin:"0 auto", position:"relative" }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.08)", borderRadius:100, padding:"6px 14px", marginBottom:24 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:"#4ade80" }} />
                <span style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.7)", textTransform:"uppercase", letterSpacing:"0.1em" }}>Now Building in Pahrump, NV</span>
              </div>
              <h1 style={{ fontSize:52, fontWeight:800, color:"white", lineHeight:1.08, letterSpacing:"-0.03em", marginBottom:20 }}>
                Your Dream Home,<br/>
                <span style={{ color:"rgba(255,255,255,0.45)" }}>Built to Last.</span>
              </h1>
              <p style={{ fontSize:16, color:"rgba(255,255,255,0.55)", lineHeight:1.8, maxWidth:520, marginBottom:36 }}>
                Apollo Home Builders delivers all-inclusive custom homes in Pahrump, Nevada — from foundation to finish, with no hidden costs and no surprises.
              </p>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <Btn onClick={()=>nav("contact")}>Schedule a Free Consultation</Btn>
                <Btn outline onClick={()=>nav("homes")}>View Available Homes</Btn>
              </div>
            </div>
          </div>

          {/* STATS BAR */}
          <div style={{ background:"white", borderBottom:`1px solid ${BOR}`, padding:"20px 32px" }}>
            <div style={{ maxWidth:780, margin:"0 auto", display:"flex", gap:40, flexWrap:"wrap" }}>
              {[["50+","Homes Built"],["6–9 mo","Avg Build Time"],["$389K","Starting Price"],["100%","All-Inclusive"]].map(([v,l])=>(
                <div key={l}>
                  <div style={{ fontSize:22, fontWeight:800, color:G, letterSpacing:"-0.02em" }}>{v}</div>
                  <div style={{ fontSize:11, color:MUT, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* FEATURED HOMES */}
          <div style={{ maxWidth:1000, margin:"0 auto", padding:"56px 32px 0" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:24 }}>
              <div>
                <SectionLabel>Featured Properties</SectionLabel>
                <h2 style={{ fontSize:30, fontWeight:800, letterSpacing:"-0.02em" }}>Homes for Sale</h2>
              </div>
              <button onClick={()=>nav("homes")} style={{ fontSize:12, fontWeight:700, color:G, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}>View All →</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
              {homes.map(h=><HomeCard key={h.id} h={h}/>)}
            </div>
          </div>

          {/* AVAILABLE LOTS STRIP */}
          <div style={{ maxWidth:1000, margin:"0 auto", padding:"48px 32px 0" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:24 }}>
              <div>
                <SectionLabel>Land</SectionLabel>
                <h2 style={{ fontSize:30, fontWeight:800, letterSpacing:"-0.02em" }}>Available Lots</h2>
              </div>
              <button onClick={()=>nav("lots")} style={{ fontSize:12, fontWeight:700, color:G, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}>View All →</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
              {lots.map(l=><LotCard key={l.id} l={l}/>)}
            </div>
          </div>

          {/* WHY APOLLO */}
          <div style={{ background:GL, margin:"48px 0 0", padding:"56px 32px" }}>
            <div style={{ maxWidth:1000, margin:"0 auto" }}>
              <SectionLabel>Why Apollo</SectionLabel>
              <h2 style={{ fontSize:30, fontWeight:800, letterSpacing:"-0.02em", marginBottom:32 }}>Built Different. Built Better.</h2>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
                {[
                  ["🏗️","All-Inclusive Pricing","One contract, one price. Land prep, foundation, framing, electrical, plumbing, HVAC, finishes — all covered."],
                  ["🗺️","Local Expertise","We know Pahrump. From permits to soil conditions to HOA rules, we've navigated every challenge in Nye County."],
                  ["🎨","Custom Floor Plans","Every build starts with your vision. We modify layouts, elevations, and finishes to match your lifestyle and budget."],
                  ["🤝","Preferred Lenders","We partner with lenders who specialize in Nevada construction loans — making financing seamless from day one."],
                  ["📅","Firm Timelines","We give you a real schedule at contract signing and hold to it. 6–9 months, start to keys."],
                  ["🔑","Turnkey Delivery","Move-in ready means move-in ready. Appliances, landscaping, and final walkthrough included."],
                ].map(([icon,title,desc])=>(
                  <div key={title} style={{ background:"white", borderRadius:12, padding:"22px 20px", border:`1px solid ${BOR}` }}>
                    <div style={{ fontSize:24, marginBottom:10 }}>{icon}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:TXT, marginBottom:6 }}>{title}</div>
                    <div style={{ fontSize:12, color:MUT, lineHeight:1.7 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BLOG PREVIEW */}
          <div style={{ maxWidth:1000, margin:"0 auto", padding:"56px 32px 0" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:24 }}>
              <div>
                <SectionLabel>Insights</SectionLabel>
                <h2 style={{ fontSize:30, fontWeight:800, letterSpacing:"-0.02em" }}>From the Blog</h2>
              </div>
              <button onClick={()=>nav("blog")} style={{ fontSize:12, fontWeight:700, color:G, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}>View All →</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
              {blogs.map(b=>(
                <div key={b.title} style={{ background:"white", borderRadius:14, overflow:"hidden", cursor:"pointer", border:`1px solid ${BOR}` }}>
                  <img src={b.img} alt={b.title} style={{ width:"100%", height:160, objectFit:"cover" }} />
                  <div style={{ padding:"16px 18px 20px" }}>
                    <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                      <span style={{ fontSize:10, fontWeight:700, color:G, background:GL, padding:"3px 9px", borderRadius:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>{b.cat}</span>
                    </div>
                    <div style={{ fontSize:14, fontWeight:700, color:TXT, lineHeight:1.45, marginBottom:10 }}>{b.title}</div>
                    <div style={{ fontSize:11, color:MUT }}>{b.date} · {b.read} read</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div style={{ maxWidth:700, margin:"0 auto", padding:"56px 32px 0" }}>
            <SectionLabel>FAQ</SectionLabel>
            <h2 style={{ fontSize:30, fontWeight:800, letterSpacing:"-0.02em", marginBottom:24 }}>Common Questions</h2>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {faqs.map(([q,a])=><FAQ key={q} q={q} a={a}/>)}
            </div>
          </div>

          {/* EMAIL CAPTURE */}
          <div style={{ background:G, margin:"56px 0 0", padding:"56px 32px" }}>
            <div style={{ maxWidth:520, margin:"0 auto", textAlign:"center" }}>
              <SectionLabel>Stay Updated</SectionLabel>
              <h2 style={{ fontSize:28, fontWeight:800, color:"white", letterSpacing:"-0.02em", marginBottom:12 }}>New lots and homes, first.</h2>
              <p style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:28, lineHeight:1.7 }}>Join our list and get notified when new properties and floor plans drop — before they hit Zillow.</p>
              {submitted ? (
                <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:10, padding:"18px 24px", color:"rgba(255,255,255,0.7)", fontSize:14 }}>✅ You're on the list. We'll be in touch.</div>
              ) : (
                <div style={{ display:"flex", gap:10 }}>
                  <input type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)}
                    style={{ flex:1, padding:"12px 16px", borderRadius:8, border:"none", fontSize:13, outline:"none", background:"rgba(255,255,255,0.1)", color:"white" }} />
                  <button onClick={()=>email&&setSubmitted(true)}
                    style={{ background:"white", color:G, border:"none", padding:"12px 22px", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
                    Notify Me
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <footer style={{ background:"#080f0a", padding:"48px 32px 32px" }}>
            <div style={{ maxWidth:1000, margin:"0 auto" }}>
              <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:32 }}>
                <div style={{ width:32, height:32, background:G, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ color:"white", fontWeight:800, fontSize:16 }}>A</span>
                </div>
                <span style={{ fontWeight:800, fontSize:14, color:"white" }}>Homes by Apollo</span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:32, marginBottom:40 }}>
                {([["Company",[["Home","home"],["About Us","home"],["Why Pahrump","home"],["Contact","contact"]]],
                  ["Properties",[["Homes for Sale","homes"],["Available Lots","lots"],["Floor Plans","homes"],["Updates","homes"]]],
                  ["Resources",[["Blog","blog"],["FAQ","home"],["Warranty","home"],["Schedule","contact"]]],
                ] as [string, [string, string][]][]).map(([heading, links])=>(
                  <div key={heading}>
                    <p style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.22)", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:14 }}>{heading}</p>
                    {links.map(([label, pg])=>(
                      <div key={label} onClick={()=>nav(pg)} style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:10, cursor:"pointer" }}
                        onMouseEnter={(e)=>{e.currentTarget.style.color="rgba(255,255,255,0.8)"}}
                        onMouseLeave={(e)=>{e.currentTarget.style.color="rgba(255,255,255,0.4)"}}>{label}</div>
                    ))}
                  </div>
                ))}
              </div>
              <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:18, display:"flex", justifyContent:"space-between" }}>
                <p style={{ fontSize:11, color:"rgba(255,255,255,0.2)" }}>© 2025 Homes by Apollo. All rights reserved.</p>
                <div style={{ display:"flex", gap:18 }}>
                  {["Privacy Policy","Terms"].map(i=><span key={i} style={{ fontSize:11, color:"rgba(255,255,255,0.2)", cursor:"pointer" }}>{i}</span>)}
                </div>
              </div>
            </div>
          </footer>
        </>}

        {/* ── HOMES FOR SALE ── */}
        {page==="homes" && (
          <div style={{ maxWidth:1000, margin:"0 auto", padding:"48px 32px" }}>
            <SectionLabel>All Properties</SectionLabel>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}>
              <h1 style={{ fontSize:36, fontWeight:800, letterSpacing:"-0.02em" }}>Homes for Sale</h1>
              <div style={{ display:"flex", gap:8 }}>
                {["All","Available","Sold"].map(f=><FilterBtn key={f} active={homeFilter===f} onClick={()=>setHomeFilter(f)}>{f}</FilterBtn>)}
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20, marginBottom:48 }}>
              {homes.map(h=><HomeCard key={h.id} h={h}/>)}
            </div>
            <div style={{ background:G, borderRadius:14, padding:"36px 40px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <h3 style={{ fontSize:22, fontWeight:800, color:"white", marginBottom:6 }}>Don't see what you're looking for?</h3>
                <p style={{ fontSize:13, color:"rgba(255,255,255,0.5)" }}>We build custom — tell us your vision and we'll make it happen.</p>
              </div>
              <Btn white onClick={()=>nav("contact")}>Start a Custom Build</Btn>
            </div>
          </div>
        )}

        {/* ── AVAILABLE LOTS ── */}
        {page==="lots" && (
          <div style={{ maxWidth:1000, margin:"0 auto", padding:"48px 32px" }}>
            <SectionLabel>Land</SectionLabel>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}>
              <h1 style={{ fontSize:36, fontWeight:800, letterSpacing:"-0.02em" }}>Available Lots</h1>
              <div style={{ display:"flex", gap:8 }}>
                {["All","Available","Reserved"].map(f=><FilterBtn key={f} active={lotFilter===f} onClick={()=>setLotFilter(f)}>{f}</FilterBtn>)}
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
              {lots.map(l=><LotCard key={l.id} l={l}/>)}
            </div>
          </div>
        )}

        {/* ── BLOG ── */}
        {page==="blog" && (
          <div style={{ maxWidth:1000, margin:"0 auto", padding:"48px 32px" }}>
            <SectionLabel>Insights</SectionLabel>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}>
              <h1 style={{ fontSize:36, fontWeight:800, letterSpacing:"-0.02em" }}>From the Blog</h1>
              <div style={{ display:"flex", gap:8 }}>
                {["All","Tips","Construction","Investment"].map(f=><FilterBtn key={f} active={blogFilter===f} onClick={()=>setBlogFilter(f)}>{f}</FilterBtn>)}
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
              {blogs.map(b=>(
                <div key={b.title} style={{ background:"white", borderRadius:14, overflow:"hidden", cursor:"pointer", border:`1px solid ${BOR}`, boxShadow:"0 2px 16px rgba(0,0,0,0.05)" }}>
                  <img src={b.img} alt={b.title} style={{ width:"100%", height:180, objectFit:"cover" }} />
                  <div style={{ padding:"18px 20px 22px" }}>
                    <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                      <span style={{ fontSize:10, fontWeight:700, color:G, background:GL, padding:"3px 9px", borderRadius:4, textTransform:"uppercase", letterSpacing:"0.06em" }}>{b.cat}</span>
                    </div>
                    <div style={{ fontSize:15, fontWeight:700, color:TXT, lineHeight:1.45, marginBottom:12 }}>{b.title}</div>
                    <div style={{ fontSize:11, color:MUT, marginBottom:16 }}>{b.date} · {b.read} read</div>
                    <button style={{ fontSize:12, fontWeight:700, color:G, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}>Read More →</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CONTACT ── */}
        {page==="contact" && (
          <div style={{ maxWidth:900, margin:"0 auto", padding:"48px 32px" }}>
            <SectionLabel>Get in Touch</SectionLabel>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:40 }}>
              <div>
                <h1 style={{ fontSize:36, fontWeight:800, letterSpacing:"-0.02em", lineHeight:1.1, marginBottom:18 }}>Schedule a<br/>Free Consultation</h1>
                <p style={{ fontSize:14, color:MUT, lineHeight:1.85, marginBottom:32 }}>Ready to build? Have questions? Brandon and the Apollo team are here to help. No pressure — just a real conversation about your vision.</p>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {([["📍","Office","5158 Arville St, Las Vegas, NV 89118"],["📞","Phone","(702) 588-9889"],["✉️","Email","brandon@apollohomebuilders.com"],["🪪","License","NV No. 0077907"]] as [string,string,string][]).map(([icon,label,val])=>(
                    <div key={label} style={{ display:"flex", alignItems:"flex-start", gap:12, background:"white", padding:"14px 18px", borderRadius:10, border:`1px solid ${BOR}` }}>
                      <span style={{ fontSize:18 }}>{icon}</span>
                      <div>
                        <div style={{ fontSize:10, fontWeight:700, color:G, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:2 }}>{label}</div>
                        <div style={{ fontSize:13, color:TXT, fontWeight:500 }}>{val}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background:"white", borderRadius:14, padding:"32px 28px", border:`1px solid ${BOR}`, boxShadow:"0 4px 32px rgba(0,0,0,0.06)" }}>
                {formSent ? (
                  <div style={{ textAlign:"center", padding:"36px 0" }}>
                    <div style={{ fontSize:44, marginBottom:14 }}>✅</div>
                    <h3 style={{ fontSize:20, fontWeight:800, marginBottom:10 }}>Message Sent!</h3>
                    <p style={{ color:MUT, fontSize:13, lineHeight:1.7 }}>Brandon will reach out within 1 business day.</p>
                  </div>
                ) : (
                  <>
                    <h3 style={{ fontSize:18, fontWeight:800, marginBottom:22 }}>Send us a message</h3>
                    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                      {([["Name","text","name","Your full name"],["Email","email","email","your@email.com"],["Phone","tel","phone","(702) 555-0000"]] as [string,string,keyof FormState,string][]).map(([label,type,key,ph])=>(
                        <div key={key}>
                          <label style={{ fontSize:11, fontWeight:700, color:MUT, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:5 }}>{label}</label>
                          <input type={type} placeholder={ph} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}
                            style={{ width:"100%", padding:"10px 13px", borderRadius:8, border:`1px solid ${BOR}`, fontSize:13, outline:"none", color:TXT }}
                            onFocus={e=>{e.currentTarget.style.borderColor=G}} onBlur={e=>{e.currentTarget.style.borderColor=BOR}}/>
                        </div>
                      ))}
                      <div>
                        <label style={{ fontSize:11, fontWeight:700, color:MUT, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:5 }}>I'm interested in</label>
                        <select value={form.interest} onChange={e=>setForm({...form,interest:e.target.value})}
                          style={{ width:"100%", padding:"10px 13px", borderRadius:8, border:`1px solid ${BOR}`, fontSize:13, outline:"none", color:TXT, background:"white" }}>
                          <option value="buy">Buying a Home</option>
                          <option value="build">Building a Custom Home</option>
                          <option value="lot">Purchasing a Lot</option>
                          <option value="general">General Question</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize:11, fontWeight:700, color:MUT, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:5 }}>Message</label>
                        <textarea placeholder="Tell us about your project..." rows={3} value={form.message} onChange={e=>setForm({...form,message:e.target.value})}
                          style={{ width:"100%", padding:"10px 13px", borderRadius:8, border:`1px solid ${BOR}`, fontSize:13, outline:"none", color:TXT, resize:"vertical" }}
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
