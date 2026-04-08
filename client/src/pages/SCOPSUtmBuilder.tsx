import { useState, useMemo } from "react";
import { useLocation } from "wouter";
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

// Stage colour palette
const STAGE_COLORS: Record<string, string> = {
  NEW_INQUIRY:     "#6366f1",
  QUALIFIED:       "#8b5cf6",
  TOUR_SCHEDULED:  "#3b82f6",
  TOURED:          "#0ea5e9",
  OFFER_SUBMITTED: "#f59e0b",
  UNDER_CONTRACT:  "#f97316",
  CLOSED:          "#22c55e",
};

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
    <div style={{ background: "#ffffff", border: "1px solid #e2e6ed", borderRadius: 16, boxShadow: "0 4px 24px rgba(100,130,200,0.12)", overflow: "hidden", ...style }}>
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

/** Live funnel chart built from real SCOPS pipeline data */
function LeadFunnelChart() {
  const { data: funnel, isLoading } = trpc.leads.getFunnel.useQuery();

  if (isLoading) {
    return (
      <div style={{ padding: "32px 16px", textAlign: "center", color: "rgba(15,32,68,0.35)", fontSize: 13 }}>
        Loading funnel…
      </div>
    );
  }

  if (!funnel || funnel.every(f => f.count === 0)) {
    return (
      <div style={{ padding: "32px 16px", textAlign: "center", color: "rgba(15,32,68,0.35)", fontSize: 13 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
        <div>No lead data yet.<br />Submit a lead to see the funnel.</div>
      </div>
    );
  }

  const maxCount = Math.max(...funnel.map(f => f.count), 1);

  return (
    <div style={{ padding: "16px 16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
      {funnel.map((step, i) => {
        const barWidth = maxCount > 0 ? Math.max((step.count / maxCount) * 100, step.count > 0 ? 4 : 0) : 0;
        const color = STAGE_COLORS[step.stage] ?? "#6366f1";
        return (
          <div key={step.stage}>
            {/* Conversion arrow between stages */}
            {i > 0 && funnel[i - 1].count > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, paddingLeft: 4 }}>
                <div style={{ width: 1, height: 12, background: "rgba(15,32,68,0.12)", marginLeft: 6 }} />
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: (step.conversionRate ?? 0) >= 50 ? "#22c55e" : (step.conversionRate ?? 0) >= 25 ? "#f59e0b" : "#ef4444",
                  letterSpacing: 0.3,
                }}>
                  {step.conversionRate !== null ? `${step.conversionRate}% converted` : "—"}
                </span>
              </div>
            )}
            {/* Stage row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Label */}
              <div style={{ width: 120, flexShrink: 0, fontSize: 11, fontWeight: 600, color: "rgba(15,32,68,0.75)", textAlign: "right", paddingRight: 4 }}>
                {step.label}
              </div>
              {/* Bar */}
              <div style={{ flex: 1, height: 28, background: "rgba(15,32,68,0.04)", borderRadius: 6, overflow: "hidden", position: "relative" }}>
                <div style={{
                  height: "100%",
                  width: `${barWidth}%`,
                  background: color,
                  borderRadius: 6,
                  transition: "width 0.5s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingRight: step.count > 0 ? 8 : 0,
                  minWidth: step.count > 0 ? 32 : 0,
                }}>
                  {step.count > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#ffffff", whiteSpace: "nowrap" }}>
                      {step.count}
                    </span>
                  )}
                </div>
                {step.count === 0 && (
                  <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "rgba(15,32,68,0.30)", fontWeight: 500 }}>0</span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Summary footer */}
      <div style={{ marginTop: 8, paddingTop: 12, borderTop: "1px solid rgba(15,32,68,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "rgba(15,32,68,0.45)" }}>
          Total active leads: <strong style={{ color: "rgba(15,32,68,0.80)" }}>{funnel.reduce((s, f) => s + f.count, 0)}</strong>
        </span>
        {funnel[0].count > 0 && funnel[funnel.length - 1].count > 0 && (
          <span style={{ fontSize: 11, color: "rgba(15,32,68,0.45)" }}>
            End-to-end: <strong style={{ color: "#22c55e" }}>
              {Math.round((funnel[funnel.length - 1].count / funnel[0].count) * 100)}%
            </strong>
          </span>
        )}
      </div>
    </div>
  );
}

/** Blog Post card — reference image style with thumbnail, status pill, views, leads, action buttons */
function BlogPostCard() {
  const { data: posts, isLoading } = trpc.blog.getAll.useQuery();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const updateMutation = trpc.blog.update.useMutation({
    onSuccess: () => { utils.blog.getAll.invalidate(); }
  });

  function handleUnpublish(post: any) {
    updateMutation.mutate({ id: post.id, status: "draft" });
  }

  const recent = posts?.slice(0, 5) ?? [];

  return (
    <GlassCard>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px", borderBottom: "1px solid rgba(15,32,68,0.08)" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(15,32,68,0.90)", letterSpacing: 0.2 }}>Blog Posts</span>
        <input
          placeholder="Search content…"
          style={{ fontSize: 11, padding: "4px 10px", border: "1px solid #e2e6ed", borderRadius: 20, outline: "none", color: "rgba(15,32,68,0.70)", background: "#fafafa", width: 130 }}
        />
      </div>
      {/* Column headers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 60px 50px 120px", gap: 0, padding: "6px 16px", borderBottom: "1px solid rgba(15,32,68,0.06)" }}>
        {["Title", "Status ↕", "Views ↕", "Leads", ""].map((h, i) => (
          <span key={i} style={{ fontSize: 10, fontWeight: 700, color: "rgba(15,32,68,0.40)", letterSpacing: 0.6, textAlign: i > 0 ? "center" : "left" }}>{h}</span>
        ))}
      </div>
      {/* Rows */}
      <div style={{ padding: "0 0 8px" }}>
        {isLoading ? (
          <div style={{ fontSize: 12, color: "rgba(15,32,68,0.35)", padding: "16px" }}>Loading…</div>
        ) : recent.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>✍️</div>
            <div style={{ fontSize: 12, color: "rgba(15,32,68,0.40)" }}>No posts yet</div>
            <button
              onClick={() => setLocation("/scops/blog")}
              style={{ marginTop: 10, padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "#0f2044", color: "#fff", border: "none", cursor: "pointer" }}
            >
              Write First Post
            </button>
          </div>
        ) : (
          recent.map((post: any) => (
            <div
              key={post.id}
              style={{ display: "grid", gridTemplateColumns: "1fr 80px 60px 50px 120px", alignItems: "center", gap: 0, padding: "10px 16px", borderBottom: "1px solid rgba(15,32,68,0.06)" }}
            >
              {/* Thumbnail + title */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                {post.imageUrl ? (
                  <img
                    src={post.imageUrl}
                    alt=""
                    style={{ width: 40, height: 32, objectFit: "cover", borderRadius: 4, flexShrink: 0, border: "1px solid rgba(15,32,68,0.08)" }}
                  />
                ) : (
                  <div style={{ width: 40, height: 32, borderRadius: 4, background: "rgba(99,102,241,0.10)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📝</div>
                )}
                <div style={{ minWidth: 0 }}>
                  <a
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12, fontWeight: 600, color: "rgba(15,32,68,0.85)", textDecoration: "none", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}
                  >
                    {post.title}
                  </a>
                  {post.featured && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#6366f1", letterSpacing: 0.5, textTransform: "uppercase" }}>Featured</span>
                  )}
                </div>
              </div>
              {/* Status */}
              <div style={{ textAlign: "center" }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
                  background: post.status === "published" ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)",
                  color: post.status === "published" ? "#16a34a" : "#b45309",
                }}>
                  {post.status === "published" ? "Published" : "Draft"}
                </span>
              </div>
              {/* Views */}
              <div style={{ textAlign: "center", fontSize: 12, color: "rgba(15,32,68,0.60)" }}>
                {post.viewCount ?? 0}
              </div>
              {/* Leads */}
              <div style={{ textAlign: "center", fontSize: 12, color: "rgba(15,32,68,0.60)" }}>
                —
              </div>
              {/* Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                <a
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 10, fontWeight: 600, color: "rgba(15,32,68,0.55)", textDecoration: "none", padding: "2px 6px", borderRadius: 4, border: "1px solid rgba(15,32,68,0.15)", background: "transparent" }}
                >
                  Preview
                </a>
                <button
                  onClick={() => setLocation("/scops/blog")}
                  style={{ fontSize: 10, fontWeight: 600, color: "rgba(15,32,68,0.55)", padding: "2px 6px", borderRadius: 4, border: "1px solid rgba(15,32,68,0.15)", background: "transparent", cursor: "pointer" }}
                >
                  Edit
                </button>
                {post.status === "published" ? (
                  <button
                    onClick={() => handleUnpublish(post)}
                    style={{ fontSize: 10, fontWeight: 600, color: "#d97706", padding: "2px 6px", borderRadius: 4, border: "1px solid rgba(217,119,6,0.30)", background: "transparent", cursor: "pointer" }}
                  >
                    Unpublish
                  </button>
                ) : (
                  <button
                    onClick={() => setLocation("/scops/blog")}
                    style={{ fontSize: 10, fontWeight: 600, color: "#16a34a", padding: "2px 6px", borderRadius: 4, border: "1px solid rgba(22,163,74,0.30)", background: "transparent", cursor: "pointer" }}
                  >
                    Publish
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        {recent.length > 0 && (
          <div style={{ padding: "10px 16px 4px" }}>
            <button
              onClick={() => setLocation("/scops/blog")}
              style={{ width: "100%", padding: "7px 0", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "rgba(99,102,241,0.08)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.25)", cursor: "pointer" }}
            >
              + New Blog Post
            </button>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

/** Landing Pages card — reference image style with Visitors, Leads, Conv. Rate table + totals */
function LandingPagesCard() {
  const pages = LANDING_PAGE_DATA;
  const totalVisitors = pages.reduce((s, p) => s + p.visitors, 0);
  const totalLeadsLP = pages.reduce((s, p) => s + p.leads, 0);
  return (
    <GlassCard>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px", borderBottom: "1px solid rgba(15,32,68,0.08)" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(15,32,68,0.90)", letterSpacing: 0.2 }}>Landing Pages</span>
        <span style={{ fontSize: 10, color: "rgba(15,32,68,0.40)", fontWeight: 600 }}>Past 60 Days</span>
      </div>
      {/* Column headers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 50px 70px", gap: 0, padding: "6px 16px", borderBottom: "1px solid rgba(15,32,68,0.06)" }}>
        {["TITLE", "VISITORS", "LEADS", "CONV. RATE"].map((h, i) => (
          <span key={h} style={{ fontSize: 9, fontWeight: 700, color: "rgba(15,32,68,0.40)", letterSpacing: 0.8, textAlign: i > 0 ? "right" : "left" }}>{h}</span>
        ))}
      </div>
      {/* Rows */}
      {pages.map((lp) => (
        <div key={lp.name} style={{ display: "grid", gridTemplateColumns: "1fr 70px 50px 70px", gap: 0, padding: "9px 16px", borderBottom: "1px solid rgba(15,32,68,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13 }}>{lp.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(15,32,68,0.85)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 110 }}>{lp.name}</span>
          </div>
          <span style={{ fontSize: 12, color: "rgba(15,32,68,0.60)", textAlign: "right" }}>{lp.visitors.toLocaleString()}</span>
          <span style={{ fontSize: 12, color: "rgba(15,32,68,0.60)", textAlign: "right" }}>{lp.leads}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", textAlign: "right" }}>{lp.convRate}</span>
        </div>
      ))}
      {/* Totals row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 50px 70px", gap: 0, padding: "9px 16px", borderTop: "1px solid rgba(15,32,68,0.10)" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(15,32,68,0.85)" }}>TOTAL</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(15,32,68,0.85)", textAlign: "right" }}>{totalVisitors.toLocaleString()}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(15,32,68,0.85)", textAlign: "right" }}>{totalLeadsLP}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", textAlign: "right" }}>$6.67M</span>
      </div>
    </GlassCard>
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
      <div style={{ padding: "10px 20px", background: "#ffffff", borderBottom: "1px solid #e2e6ed", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {["All Inventory ▾", "Performance ▾", "Map View ▾", "Marketing Readiness ▾"].map((label, i) => (
          <button key={label} style={{ padding: "5px 14px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: i === 0 ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.65)", border: i === 0 ? "1px solid rgba(99,102,241,0.40)" : "1px solid #e2e6ed", color: i === 0 ? "#6366f1" : "rgba(15,32,68,0.55)", cursor: "pointer" }}>{label}</button>
        ))}
        <div style={{ flex: 1, minWidth: 120, maxWidth: 280, marginLeft: "auto" }}>
          <input placeholder="Search address, city or zip…" style={{ width: "100%", padding: "6px 14px", background: "#ffffff", border: "1px solid #e2e6ed", borderRadius: 20, color: "rgba(15,32,68,0.85)", fontSize: 12, outline: "none" }} />
        </div>
      </div>
      {/* 3-Column Body */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 16, padding: 16, overflow: "auto" }} className="lg:grid-cols-[300px_1fr_300px]">
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
          {/* ── Live Lead Funnel (real SCOPS data) ── */}
          <GlassCard>
            <SH title="Lead Funnel" action="Live · All Time" />
            <LeadFunnelChart />
          </GlassCard>

          {/* UTM Builder */}
          <GlassCard style={{ flex: 1 }}>
            <SH title="UTM Builder" />
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
                  <a href={generatedUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#6366f1", textDecoration: "underline", display: "flex", alignItems: "center" }}>Preview ↗</a>
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
          {/* Blog Post Card */}
          <BlogPostCard />

          {/* Landing Pages Card */}
          <LandingPagesCard />

          {/* Channel detail panel */}
          {selectedChannel && (
            <GlassCard>
              <SH title={selectedChannel} action={<button onClick={() => setSelectedChannel(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 16 }}>×</button>} />
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
                        <div key={stat.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#ffffff", borderRadius: 10, border: "1px solid #e2e6ed" }}>
                          <span style={{ fontSize: 12, color: "rgba(15,32,68,0.50)" }}>{stat.label}</span>
                          <span style={{ fontSize: 16, fontWeight: 800, color: stat.color }}>{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
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
