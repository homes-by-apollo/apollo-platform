import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import SCOPSNav from "@/components/SCOPSNav";
import { getLoginUrl } from "@/const";

const TEMPLATES = [
  { label: "Google Search — Pahrump Homes", source: "google", medium: "cpc", campaign: "pahrump-new-homes", content: "search-brand", term: "pahrump+new+homes", landingPage: "/get-in-touch" },
  { label: "Google Search — Build a Home NV", source: "google", medium: "cpc", campaign: "nevada-home-builder", content: "search-generic", term: "build+a+home+nevada", landingPage: "/get-in-touch" },
  { label: "Facebook — New Homes Pahrump", source: "facebook", medium: "paid-social", campaign: "pahrump-new-homes", content: "carousel-homes", term: "", landingPage: "/find-your-home" },
  { label: "Facebook — Retargeting", source: "facebook", medium: "paid-social", campaign: "retargeting", content: "retarget-visitors", term: "", landingPage: "/get-in-touch" },
  { label: "Instagram — Home Build Story", source: "instagram", medium: "paid-social", campaign: "brand-awareness", content: "story-build", term: "", landingPage: "/find-your-home" },
  { label: "Email Newsletter", source: "email", medium: "newsletter", campaign: "monthly-update", content: "cta-button", term: "", landingPage: "/get-in-touch" },
  { label: "Billboard — Pahrump Hwy 160", source: "billboard", medium: "outdoor", campaign: "pahrump-hwy160", content: "qr-code", term: "", landingPage: "/get-in-touch" },
  { label: "Zillow Profile", source: "zillow", medium: "listing", campaign: "zillow-profile", content: "website-link", term: "", landingPage: "/find-your-home" },
];
const BASE_URL = "https://apollohomebuilders.com";
const LANDING_PAGES = [
  { value: "/get-in-touch", label: "/get-in-touch — Contact Form" },
  { value: "/find-your-home", label: "/find-your-home — Browse Homes" },
  { value: "/", label: "/ — Homepage" },
];
const CHANNEL_DATA = [
  { name: "Zillow", icon: "🏠", leads: 57, color: "#006AFF" },
  { name: "Facebook Ads", icon: "📘", leads: 32, color: "#1877F2" },
  { name: "Google Ads", icon: "🔍", leads: 30, color: "#4285F4" },
  { name: "Referrals", icon: "📧", leads: 19, color: "#10b981" },
  { name: "Website", icon: "🌐", leads: 14, color: "#6366f1" },
];
const CAMPAIGN_DATA = [
  { name: "Zillow", icon: "🏠", leads: 57, tours: 19, contracts: 6, revenue: "$3.15M" },
  { name: "Facebook Ads", icon: "📘", leads: 32, tours: 12, contracts: 3, revenue: "$1.75M" },
  { name: "Google Ads", icon: "🔍", leads: 30, tours: 9, contracts: 2, revenue: "$920K" },
  { name: "Referrals", icon: "📧", leads: 19, tours: 6, contracts: 1, revenue: "$570K" },
  { name: "Website", icon: "🌐", leads: 14, tours: 5, contracts: 1, revenue: "$330K" },
];
const LANDING_PAGE_DATA = [
  { name: "Zillow Organic", icon: "🏠", visitors: 772, leads: 42, convRate: "$211M" },
  { name: "Facebook Retargeting", icon: "📘", visitors: 593, leads: 25, convRate: "$175M" },
  { name: "Google Search – 1BR Pahrump", icon: "🔍", visitors: 470, leads: 15, convRate: "$890K" },
  { name: "Email Newsletter", icon: "📧", visitors: 125, leads: 10, convRate: "$330K" },
];
function buildUrl(params: { landingPage: string; source: string; medium: string; campaign: string; content: string; term: string }) {
  const qs = new URLSearchParams();
  if (params.source) qs.set("utm_source", params.source);
  if (params.medium) qs.set("utm_medium", params.medium);
  if (params.campaign) qs.set("utm_campaign", params.campaign);
  if (params.content) qs.set("utm_content", params.content);
  if (params.term) qs.set("utm_term", params.term);
  const query = qs.toString();
  return `${BASE_URL}${params.landingPage}${query ? `?${query}` : ""}`;
}
function GlassCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.85)", borderRadius: 16, boxShadow: "0 4px 24px rgba(100,130,200,0.12)", overflow: "hidden", ...style }}>
      {children}
    </div>
  );
}
function SH({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px", borderBottom: "1px solid rgba(15,32,68,0.08)" }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(15,32,68,0.90)", letterSpacing: 0.2 }}>{title}</span>
      {action && <span style={{ fontSize: 11, color: "rgba(15,32,68,0.45)" }}>{action}</span>}
    </div>
  );
}
export default function SCOPSUtmBuilder() {
  const adminMeQuery = trpc.adminAuth.me.useQuery();
  const adminUser = adminMeQuery.data;
  const loading = adminMeQuery.isLoading;
  const [landingPage, setLandingPage] = useState("/get-in-touch");
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("");
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");
  const [term, setTerm] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const generatedUrl = useMemo(() => buildUrl({ landingPage, source, medium, campaign, content, term }), [landingPage, source, medium, campaign, content, term]);
  function applyTemplate(t: typeof TEMPLATES[0]) { setLandingPage(t.landingPage); setSource(t.source); setMedium(t.medium); setCampaign(t.campaign); setContent(t.content); setTerm(t.term); }
  function copyUrl() { navigator.clipboard.writeText(generatedUrl); toast.success("URL copied to clipboard"); }
  function reset() { setLandingPage("/get-in-touch"); setSource(""); setMedium(""); setCampaign(""); setContent(""); setTerm(""); }
  if (loading) return null;
  if (!adminUser) { window.location.href = getLoginUrl(); return null; }
  const totalLeads = CHANNEL_DATA.reduce((s, c) => s + c.leads, 0);
  const maxLeads = Math.max(...CHANNEL_DATA.map(c => c.leads));
  return (
    <div className="scops-bg" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif", display: "flex", flexDirection: "column" }}>
      <SCOPSNav adminUser={{ name: adminUser.name, adminRole: (adminUser as any).adminRole }} currentPage="utm-builder" />
      {/* Filter Bar */}
      <div style={{ padding: "10px 20px", background: "rgba(255,255,255,0.50)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.75)", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {["All Inventory ▾", "Performance ▾", "Map View ▾", "Marketing Readiness ▾"].map((label, i) => (
          <button key={label} style={{ padding: "5px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: i === 0 ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.65)", border: i === 0 ? "1px solid rgba(99,102,241,0.40)" : "1px solid rgba(255,255,255,0.80)", color: i === 0 ? "#6366f1" : "rgba(15,32,68,0.55)", cursor: "pointer" }}>{label}</button>
        ))}
        <div style={{ flex: 1, minWidth: 200, maxWidth: 280, marginLeft: "auto" }}>
          <input placeholder="Search address, city or zip…" style={{ width: "100%", padding: "6px 14px", background: "rgba(255,255,255,0.70)", border: "1px solid rgba(255,255,255,0.85)", borderRadius: 20, color: "rgba(15,32,68,0.85)", fontSize: 12, outline: "none" }} />
        </div>
      </div>
      {/* 3-Column Body */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "300px 1fr 300px", gap: 16, padding: 16, overflow: "auto" }}>
        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <GlassCard>
            <SH title="Channel Performance" action="Past 60 Days ▾" />
            <div style={{ padding: "10px 16px 14px" }}>
              {CHANNEL_DATA.map(ch => (
                <div key={ch.name} onClick={() => setSelectedChannel(selectedChannel === ch.name ? null : ch.name)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, cursor: "pointer", marginBottom: 4, background: selectedChannel === ch.name ? "rgba(15,32,68,0.08)" : "transparent", transition: "background 0.15s" }}>
                  <span style={{ fontSize: 16 }}>{ch.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(15,32,68,0.85)" }}>{ch.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(15,32,68,0.85)" }}>{ch.leads}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: "rgba(15,32,68,0.08)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 2, background: ch.color, width: `${(ch.leads / maxLeads) * 100}%`, transition: "width 0.4s ease" }} />
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ borderTop: "1px solid rgba(15,32,68,0.08)", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "rgba(15,32,68,0.85)" }}>
                <span>Total</span><span>{totalLeads}</span>
              </div>
            </div>
          </GlassCard>
          <GlassCard style={{ flex: 1 }}>
            <SH title="Landing Pages" action="Past 60 Days ▾" />
            <div style={{ padding: "0 0 8px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 0, padding: "6px 16px", borderBottom: "1px solid rgba(15,32,68,0.08)" }}>
                {["TITLE", "VISITORS", "LEADS", "CONV."].map(h => <span key={h} style={{ fontSize: 9, fontWeight: 700, color: "rgba(15,32,68,0.40)", letterSpacing: 0.8, textAlign: h !== "TITLE" ? "right" : "left" }}>{h}</span>)}
              </div>
              {LANDING_PAGE_DATA.map(lp => (
                <div key={lp.name} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 0, padding: "9px 16px", borderBottom: "1px solid rgba(15,32,68,0.07)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13 }}>{lp.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(15,32,68,0.85)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }}>{lp.name}</span>
                  </div>
                  <span style={{ fontSize: 12, color: "rgba(15,32,68,0.60)", textAlign: "right", paddingLeft: 8 }}>{lp.visitors.toLocaleString()}</span>
                  <span style={{ fontSize: 12, color: "rgba(15,32,68,0.60)", textAlign: "right", paddingLeft: 8 }}>{lp.leads}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", textAlign: "right", paddingLeft: 8 }}>{lp.convRate}</span>
                </div>
              ))}
              <div style={{ padding: "8px 16px", display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 0, borderTop: "1px solid rgba(15,32,68,0.08)" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(15,32,68,0.85)" }}>TOTAL</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(15,32,68,0.85)", textAlign: "right", paddingLeft: 8 }}>152</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(15,32,68,0.85)", textAlign: "right", paddingLeft: 8 }}>51</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", textAlign: "right", paddingLeft: 8 }}>$6.67M</span>
              </div>
            </div>
          </GlassCard>
        </div>
        {/* CENTER */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <GlassCard>
            <SH title="Campaign Leaderboard" action="Past 60 Days ▾" />
            <div style={{ padding: "0 0 8px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto auto", gap: 0, padding: "6px 16px", borderBottom: "1px solid rgba(15,32,68,0.08)" }}>
                {["CAMPAIGN", "LEADS ⇕", "TOURS ⇕", "CONTRACTS ⇕", "REVENUE ⇕"].map(h => <span key={h} style={{ fontSize: 9, fontWeight: 700, color: "rgba(15,32,68,0.40)", letterSpacing: 0.8, textAlign: h !== "CAMPAIGN" ? "right" : "left", cursor: "pointer" }}>{h}</span>)}
              </div>
              {CAMPAIGN_DATA.map(c => (
                <div key={c.name} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto auto", gap: 0, padding: "10px 16px", borderBottom: "1px solid rgba(15,32,68,0.07)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{c.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(15,32,68,0.85)" }}>{c.name}</span>
                  </div>
                  <span style={{ fontSize: 13, color: "rgba(15,32,68,0.60)", textAlign: "right", paddingLeft: 12 }}>{c.leads}</span>
                  <span style={{ fontSize: 13, color: "rgba(15,32,68,0.60)", textAlign: "right", paddingLeft: 12 }}>{c.tours}</span>
                  <span style={{ fontSize: 13, color: "rgba(15,32,68,0.60)", textAlign: "right", paddingLeft: 12 }}>{c.contracts}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#6366f1", textAlign: "right", paddingLeft: 12 }}>{c.revenue}</span>
                </div>
              ))}
              <div style={{ padding: "8px 16px", display: "grid", gridTemplateColumns: "1fr auto auto auto auto", gap: 0, borderTop: "1px solid rgba(15,32,68,0.08)" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(15,32,68,0.85)" }}></span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(15,32,68,0.85)", textAlign: "right", paddingLeft: 12 }}>152</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(15,32,68,0.85)", textAlign: "right", paddingLeft: 12 }}>51</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(15,32,68,0.85)", textAlign: "right", paddingLeft: 12 }}>13</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", textAlign: "right", paddingLeft: 12 }}>$6.67M</span>
              </div>
            </div>
          </GlassCard>
          <GlassCard style={{ flex: 1 }}>
            <SH title="UTM Builder" action="Past 60 Days ▾" />
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(15,32,68,0.40)", letterSpacing: 0.8, marginBottom: 6 }}>LANDING PAGE</div>
                <Select value={landingPage} onValueChange={setLandingPage}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANDING_PAGES.map(lp => <SelectItem key={lp.value} value={lp.value}>{lp.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "utm_source", value: source, set: setSource, placeholder: "google" },
                  { label: "utm_medium", value: medium, set: setMedium, placeholder: "cpc" },
                  { label: "utm_campaign", value: campaign, set: setCampaign, placeholder: "pahrump-new-homes" },
                  { label: "utm_content", value: content, set: setContent, placeholder: "carousel-homes" },
                ].map(f => (
                  <div key={f.label}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(15,32,68,0.40)", letterSpacing: 0.8, marginBottom: 4 }}>{f.label}</div>
                    <Input value={f.value} onChange={e => f.set(e.target.value.toLowerCase().replace(/\s+/g, "-"))} placeholder={f.placeholder} className="h-8 text-xs" />
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(15,32,68,0.40)", letterSpacing: 0.8, marginBottom: 4 }}>utm_term <span style={{ fontWeight: 400, color: "rgba(15,32,68,0.50)" }}>(Google Ads only)</span></div>
                <Input value={term} onChange={e => setTerm(e.target.value.toLowerCase().replace(/\s+/g, "+"))} placeholder="pahrump+new+homes" className="h-8 text-xs" />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(15,32,68,0.40)", letterSpacing: 0.8, marginBottom: 6 }}>GENERATED URL</div>
                <div style={{ background: "rgba(15,32,68,0.04)", border: "1px solid rgba(15,32,68,0.12)", borderRadius: 8, padding: "10px 12px", fontSize: 11, fontFamily: "monospace", color: "rgba(15,32,68,0.70)", wordBreak: "break-all", marginBottom: 8 }}>{generatedUrl}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button size="sm" onClick={copyUrl} className="bg-[#0f2044] hover:bg-[#1a3366] text-white text-xs h-8 flex-1">Copy URL</Button>
                  <Button size="sm" variant="outline" onClick={reset} className="text-xs h-8">Reset</Button>
                  <a href={generatedUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#a5b4fc", textDecoration: "underline", display: "flex", alignItems: "center" }}>Preview ↗</a>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(15,32,68,0.40)", letterSpacing: 0.8, marginBottom: 8 }}>QUICK TEMPLATES</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {TEMPLATES.slice(0, 5).map((t, i) => (
                    <button key={i} onClick={() => applyTemplate(t)} style={{ padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.25)", color: "#6366f1", cursor: "pointer" }}>{t.label.split("—")[0].trim()}</button>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
        {/* RIGHT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {selectedChannel ? (
            <GlassCard>
              <SH title={selectedChannel} action={<button onClick={() => setSelectedChannel(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.40)", fontSize: 16 }}>×</button>} />
              <div style={{ padding: 16 }}>
                {(() => {
                  const ch = CAMPAIGN_DATA.find(c => c.name === selectedChannel);
                  if (!ch) return null;
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {[
                        { label: "Total Leads", value: ch.leads, color: "#6366f1" },
                        { label: "Tours Booked", value: ch.tours, color: "#22c55e" },
                        { label: "Contracts", value: ch.contracts, color: "#f59e0b" },
                        { label: "Revenue", value: ch.revenue, color: "#6366f1" },
                      ].map(stat => (
                        <div key={stat.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "rgba(255,255,255,0.70)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.85)" }}>
                          <span style={{ fontSize: 12, color: "rgba(15,32,68,0.50)" }}>{stat.label}</span>
                          <span style={{ fontSize: 16, fontWeight: 800, color: stat.color }}>{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </GlassCard>
          ) : (
            <GlassCard>
              <div style={{ padding: 24, textAlign: "center", color: "rgba(15,32,68,0.35)", fontSize: 13 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
                <div>Click a channel to<br />see performance details</div>
              </div>
            </GlassCard>
          )}
          <GlassCard style={{ flex: 1 }}>
            <SH title="Parameter Guide" />
            <div style={{ padding: "10px 16px 14px" }}>
              {[{ param: "utm_source", desc: "Where the traffic comes from", ex: "google, facebook, billboard" }, { param: "utm_medium", desc: "The marketing channel", ex: "cpc, email, paid-social" }, { param: "utm_campaign", desc: "The campaign or ad group", ex: "pahrump-new-homes" }, { param: "utm_content", desc: "The specific ad or creative", ex: "carousel-a, story-video" }, { param: "utm_term", desc: "Paid keyword (Google only)", ex: "pahrump+homes" }].map(({ param, desc, ex }) => (
                <div key={param} style={{ borderBottom: "1px solid rgba(15,32,68,0.07)", paddingBottom: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: "#6366f1" }}>{param}</div>
                  <div style={{ fontSize: 11, color: "rgba(15,32,68,0.50)", marginTop: 2 }}>{desc}</div>
                  <div style={{ fontSize: 10, color: "rgba(15,32,68,0.40)", fontStyle: "italic", marginTop: 1 }}>e.g. {ex}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
